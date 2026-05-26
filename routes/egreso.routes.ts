import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Egreso from "../models/Egreso";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertBranchAccess(String(req.params.branchId), req.user!.userId);
    const lista = await Egreso.find({ branch: req.params.branchId })
      .sort({ createdAt: -1 })
      .lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertBranchAccess(String(req.params.branchId), req.user!.userId);
    const egreso = await Egreso.create({ ...req.body, branch: req.params.branchId });
    created(res, egreso);
  } catch (err) { next(err); }
});

router.delete("/:egresoId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertBranchAccess(String(req.params.branchId), req.user!.userId);
    const egreso = await Egreso.findOneAndDelete({
      _id: req.params.egresoId,
      branch: req.params.branchId,
    });
    if (!egreso) return next(new Error("Egreso no encontrado"));
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
