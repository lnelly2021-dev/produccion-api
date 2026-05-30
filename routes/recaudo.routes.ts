import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Recaudo from "../models/Recaudo";
import Branch  from "../models/Branch";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Recaudo.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);

    let body = { ...req.body };

    // Cruce de nómina: asignar consecutivo CN automático
    if (body.medioPago === "DESCUENTO_NOMINA") {
      const branch = await Branch.findByIdAndUpdate(
        branchId,
        { $inc: { consecutivoCN: 1 } },
        { new: true }
      );
      const num = String(branch?.consecutivoCN ?? 1).padStart(3, "0");
      body.nroRecibo = `CN-${num}`;
    }

    const rec = await Recaudo.create({ ...body, branch: branchId });
    created(res, rec);
  } catch (err) { next(err); }
});

export default router;
