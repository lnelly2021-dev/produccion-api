import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as svc from "../services/cierre.service";
import { ok, created } from "../utils/response.util";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.listar(String(req.params.branchId), req.user!.userId)); }
  catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await svc.crear(String(req.params.branchId), req.user!.userId, req.body)); }
  catch (err) { next(err); }
});

export default router;
