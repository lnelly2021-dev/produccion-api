import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Pasivo from "../models/Pasivo";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { ok, created } from "../utils/response.util";
import { ForbiddenError, NotFoundError } from "../utils/errors";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({
    user: userId, active: true,
    $or: [{ branches: branchId }, { allBranches: true }],
  });
  if (!access) throw new ForbiddenError("Access denied");
}

// Listar deudas
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const lista = await Pasivo.find({ branch: branchId }).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// Crear deuda
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const doc = await Pasivo.create({ ...req.body, branch: branchId });
    created(res, doc);
  } catch (err) { next(err); }
});

// Registrar abono
router.post("/:pasivoId/abonos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const doc = await Pasivo.findOne({ _id: req.params.pasivoId, branch: branchId });
    if (!doc) throw new NotFoundError("Deuda no encontrada");
    const { monto, medioPago, fecha } = req.body;
    const montoN = Number(monto) || 0;
    doc.pagos.push({ fecha: fecha || new Date().toISOString(), monto: montoN, medioPago: medioPago || "EFECTIVO" });
    doc.abono   = doc.abono + montoN;
    doc.saldo   = doc.valor - doc.abono;
    doc.estado  = doc.saldo <= 0 ? "Pagado" : "Pendiente";
    await doc.save();
    ok(res, doc);
  } catch (err) { next(err); }
});

// Eliminar deuda
router.delete("/:pasivoId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    await Pasivo.findOneAndDelete({ _id: req.params.pasivoId, branch: branchId });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
