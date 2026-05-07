import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import Contacto from "../models/Contacto";
import UserCompanyAccess from "../models/UserCompanyAccess";
import { ok, created } from "../utils/response.util";
import { ForbiddenError, NotFoundError } from "../utils/errors";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

async function assertAccess(branchId: string, userId: string) {
  const access = await UserCompanyAccess.findOne({ user: userId, branches: branchId, active: true });
  if (!access) throw new ForbiddenError("Access denied");
}

// GET /branches/:branchId/contactos?tipo=CLIENTE
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const filtro: any = { branch: branchId, activo: true };
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    const lista = await Contacto.find(filtro).sort({ nombre: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// POST
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const contacto = await Contacto.create({ ...req.body, branch: branchId });
    created(res, contacto);
  } catch (err) { next(err); }
});

// PUT /:id
router.put("/:contactoId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    const contacto = await Contacto.findOneAndUpdate(
      { _id: req.params.contactoId, branch: branchId },
      req.body, { new: true }
    );
    if (!contacto) throw new NotFoundError("Contacto no encontrado");
    ok(res, contacto);
  } catch (err) { next(err); }
});

// DELETE /:id (soft)
router.delete("/:contactoId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertAccess(branchId, req.user!.userId);
    await Contacto.findOneAndUpdate({ _id: req.params.contactoId, branch: branchId }, { activo: false });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
