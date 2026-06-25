import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import InformeProduccion from "../models/InformeProduccion";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await InformeProduccion.find({ branch: branchId }).sort({ fecha: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await InformeProduccion.findOne({ _id: req.params.id, branch: branchId }).lean();
    if (!item) throw new NotFoundError("Informe no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await InformeProduccion.create({ ...req.body, branch: branchId });
    created(res, item);
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await InformeProduccion.findOneAndUpdate({ _id: req.params.id, branch: branchId }, req.body, { new: true });
    if (!item) throw new NotFoundError("Informe no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await InformeProduccion.findOneAndDelete({ _id: req.params.id, branch: branchId });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
