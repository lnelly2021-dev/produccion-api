import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Recaudo from "../models/Recaudo";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { ok, created } from "../utils/response.util";
import { ForbiddenError } from "../utils/errors";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
}

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const lista = await Recaudo.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const rec = await Recaudo.create({ ...req.body, branch: branchId });
    created(res, rec);
  } catch (err) { next(err); }
});

export default router;
