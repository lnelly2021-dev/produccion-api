import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok } from "../utils/response.util";
import CostoProduccion from "../models/CostoProduccion";
import { recalcularTodo } from "../utils/recalculoCostos";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const doc = await CostoProduccion.findOne({ branch: branchId }).lean();
    ok(res, doc ?? { diasLaborales: 26, horasDia: 15, empleados: [], cif: [], personalVentas: [], gastosVentas: [], personalAdmon: [], gastosAdmon: [], ventasMensual: 0, admonMensual: 0, baseMensual: 0 });
  } catch (err) { next(err); }
});

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const doc = await CostoProduccion.findOneAndUpdate(
      { branch: branchId },
      { ...req.body, branch: branchId },
      { new: true, upsert: true }
    );
    await recalcularTodo(branchId);
    ok(res, doc);
  } catch (err) { next(err); }
});

export default router;
