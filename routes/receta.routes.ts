import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import Receta from "../models/Receta";
import { recalcularCadena } from "../utils/recalculoCostos";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Receta.find({ branch: branchId, activo: true }).sort({ nombre: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    // El frontend ya calcula costoLinea y costoMP correctamente (con costoGr)
    const receta = await Receta.create({ ...req.body, branch: branchId });
    created(res, receta);
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const previa = await Receta.findOne({ _id: req.params.id, branch: branchId }).lean();
    if (!previa) throw new NotFoundError("Receta no encontrada");

    const receta = await Receta.findOneAndUpdate(
      { _id: req.params.id, branch: branchId },
      { ...req.body },
      { new: true }
    );
    if (!receta) throw new NotFoundError("Receta no encontrada");

    if (receta.costoTotal !== previa.costoTotal) {
      await recalcularCadena(branchId, [String(receta._id)]);
    }

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
