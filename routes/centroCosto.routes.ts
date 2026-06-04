import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import CentroCosto from "../models/CentroCosto";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const filtro: any = { branch: branchId, activo: true };
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    const lista = await CentroCosto.find(filtro).sort({ tipo: 1, nombre: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await CentroCosto.create({ ...req.body, branch: branchId });
    created(res, item);
  } catch (err) { next(err); }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await CentroCosto.findOneAndUpdate({ _id: req.params.id, branch: branchId }, req.body, { new: true });
    if (!item) throw new NotFoundError("Centro de costo no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await CentroCosto.findOneAndUpdate({ _id: req.params.id, branch: branchId }, { activo: false });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
