import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import UserCompanyAccess from "../models/UserCompanyAccess";
import Egreso from "../models/Egreso";
import { ok, created } from "../utils/response.util";
import { ForbiddenError } from "../utils/errors";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

async function assertAccess(branchId: string, userId: string) {
  const a = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!a) throw new ForbiddenError("Access denied");
}

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertAccess(String(req.params.branchId), req.user!.userId);
    const lista = await Egreso.find({ branch: req.params.branchId })
      .sort({ createdAt: -1 })
      .lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertAccess(String(req.params.branchId), req.user!.userId);
    const egreso = await Egreso.create({ ...req.body, branch: req.params.branchId });
    created(res, egreso);
  } catch (err) { next(err); }
});

export default router;
