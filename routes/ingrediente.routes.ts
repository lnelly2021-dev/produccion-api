import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import Ingrediente from "../models/Ingrediente";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// GET todos los ingredientes
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Ingrediente.find({ branch: branchId, activo: true }).sort({ nombre: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// POST crear ingrediente
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await Ingrediente.create({ ...req.body, branch: branchId });
    created(res, item);
  } catch (err) { next(err); }
});

// PUT actualizar
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const item = await Ingrediente.findOneAndUpdate({ _id: req.params.id, branch: branchId }, req.body, { new: true });
    if (!item) throw new NotFoundError("Ingrediente no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

// DELETE (soft)
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await Ingrediente.findOneAndUpdate({ _id: req.params.id, branch: branchId }, { activo: false });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
