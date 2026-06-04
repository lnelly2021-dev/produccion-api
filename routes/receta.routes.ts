import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import Receta from "../models/Receta";
import Ingrediente from "../models/Ingrediente";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Receta.find({ branch: branchId, activo: true }).sort({ producto: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    // Recalcular costoLinea y costoMP con precios actuales
    const ingredientes = await Promise.all(
      (req.body.ingredientes || []).map(async (linea: any) => {
        const ing = await Ingrediente.findById(linea.ingredienteId).lean();
        const costoUnitario = ing?.costoUnitario ?? linea.costoUnitario ?? 0;
        const costoLinea    = Math.round(linea.cantidad * costoUnitario);
        return { ...linea, costoUnitario, costoLinea };
      })
    );
    const costoMP = ingredientes.reduce((s, l) => s + l.costoLinea, 0);
    const receta  = await Receta.create({ ...req.body, branch: branchId, ingredientes, costoMP });
    created(res, receta);
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    const ingredientes = await Promise.all(
      (req.body.ingredientes || []).map(async (linea: any) => {
        const ing = await Ingrediente.findById(linea.ingredienteId).lean();
        const costoUnitario = ing?.costoUnitario ?? linea.costoUnitario ?? 0;
        return { ...linea, costoUnitario, costoLinea: Math.round(linea.cantidad * costoUnitario) };
      })
    );
    const costoMP = ingredientes.reduce((s, l) => s + l.costoLinea, 0);
    const receta  = await Receta.findOneAndUpdate(
      { _id: req.params.id, branch: branchId },
      { ...req.body, ingredientes, costoMP },
      { new: true }
    );
    if (!receta) throw new NotFoundError("Receta no encontrada");
    ok(res, receta);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await Receta.findOneAndUpdate({ _id: req.params.id, branch: branchId }, { activo: false });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
