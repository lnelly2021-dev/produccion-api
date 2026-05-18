import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Cotizacion from "../models/Cotizacion";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Cotizacion.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const cotizacion = await Cotizacion.create({ ...req.body, branch: branchId });
    created(res, cotizacion);
  } catch (err) { next(err); }
});

router.put("/:cotizacionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const doc = await Cotizacion.findOneAndUpdate(
      { _id: req.params.cotizacionId, branch: branchId },
      req.body,
      { new: true }
    );
    if (!doc) throw new NotFoundError("Cotización no encontrada");
    ok(res, doc);
  } catch (err) { next(err); }
});

router.delete("/:cotizacionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await Cotizacion.findOneAndDelete({ _id: req.params.cotizacionId, branch: branchId });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
