import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Branch from "../models/Branch";
import Venta from "../models/Venta";
import * as vc from "../controllers/venta/venta.controller";
import { ok } from "../utils/response.util";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

/**
 * GET /branches/:branchId/ventas/consecutivo
 * Retorna e incrementa atómicamente el consecutivo de facturación de la sucursal.
 * Si es la primera vez (consecutivo === 0), lo inicializa desde el máximo
 * número existente en las ventas para no reutilizar números anteriores.
 */
router.get("/consecutivo", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    const branch = await Branch.findById(branchId);
    if (!branch) { res.status(404).json({ ok: false, error: "Branch not found" }); return; }

    if (branch.consecutivo === 0) {
      const ventas = await Venta.find({ branch: branchId }, { nroFactura: 1 }).lean();
      const maxNum = ventas.reduce((max, v) => {
        const match = (v.nroFactura || "").match(/(\d+)$/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      if (maxNum > 0) {
        await Branch.findByIdAndUpdate(branchId, { consecutivo: maxNum });
      }
    }

    const updated = await Branch.findByIdAndUpdate(
      branchId,
      { $inc: { consecutivo: 1 } },
      { new: true }
    );

    ok(res, { consecutivo: updated!.consecutivo });
  } catch (err) { next(err); }
});

router.get( "/",                vc.listar);
router.post("/",                vc.crear);
router.put( "/:ventaId/anular", vc.anular);

export default router;
