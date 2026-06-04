import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import HojaCosto from "../models/HojaCosto";
import Receta from "../models/Receta";
import CentroCosto from "../models/CentroCosto";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await HojaCosto.find({ branch: branchId }).sort({ fechaCalculo: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// Calcular y guardar hoja de costos para una receta
router.post("/calcular/:recetaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    const receta = await Receta.findOne({ _id: req.params.recetaId, branch: branchId }).lean();
    if (!receta) throw new NotFoundError("Receta no encontrada");

    const centros = await CentroCosto.find({ branch: branchId, activo: true }).lean();
    const margen  = Number(req.body.margenDeseado) || 0;
    const lote    = receta.tamanoLote || 1;

    // Calcular cada tipo de costo
    const sumar = (tipo: string) => centros
      .filter(c => c.tipo === tipo)
      .reduce((s, c) => {
        if (c.base === "POR_LOTE")       return s + c.valor;
        if (c.base === "POR_UNIDAD")     return s + c.valor * lote;
        if (c.base === "PORCENTAJE_MP")  return s + (receta.costoMP * c.valor / 100);
        if (c.base === "POR_HORA")       return s + c.valor * (Number(req.body.horas) || 1);
        return s + c.valor;
      }, 0);

    const costoMP        = receta.costoMP;
    const costoMO        = sumar("MANO_OBRA");
    const costoFijo      = sumar("FIJO");
    const costoVariable  = sumar("VARIABLE");
    const costoIndirecto = sumar("INDIRECTO");
    const costoComercial = sumar("COMERCIAL");
    const costoAdmin     = sumar("ADMINISTRATIVO");

    const costoTotalLote = Math.round(costoMP + costoMO + costoFijo + costoVariable + costoIndirecto + costoComercial + costoAdmin);
    const costoUnitario  = Math.round(costoTotalLote / lote);
    const precioSugerido = margen > 0 ? Math.round(costoUnitario / (1 - margen / 100)) : 0;

    const hoja = await HojaCosto.create({
      branch: branchId, recetaId: receta._id, producto: receta.producto,
      tamanoLote: lote, costoMP, costoMO, costoFijo, costoVariable,
      costoIndirecto, costoComercial, costoAdmin,
      costoTotalLote, costoUnitario, margenDeseado: margen, precioSugerido,
      detalle: centros.map(c => ({ nombre: c.nombre, tipo: c.tipo, valor: c.valor, base: c.base })),
    });
    created(res, hoja);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const h = await HojaCosto.findOneAndDelete({ _id: req.params.id, branch: branchId });
    if (!h) throw new NotFoundError("Hoja no encontrada");
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
