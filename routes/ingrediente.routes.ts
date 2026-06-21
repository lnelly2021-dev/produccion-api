import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import { NotFoundError } from "../utils/errors";
import Ingrediente from "../models/Ingrediente";
import { recalcularCadena } from "../utils/recalculoCostos";

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// GET todos los ingredientes
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const lista = await Ingrediente.find({ branch: branchId }).sort({ nombre: 1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

// DELETE todos (para reimportar)
router.delete("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const { deletedCount } = await Ingrediente.deleteMany({ branch: branchId });
    ok(res, { deleted: deletedCount });
  } catch (err) { next(err); }
});

// POST bulk import
// Con upsert: si el ingrediente (mismo nombre + branch) ya existe lo actualiza,
// si no existe lo crea. Así se puede importar una categoría sin borrar las demás.
router.post("/bulk", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    const items = (req.body as any[]).map(i => ({ ...i, branch: branchId }));
    const ops = items.map(i => ({
      updateOne: {
        filter: { branch: branchId, nombre: i.nombre },
        update: { $set: i },
        upsert: true,
      },
    }));
    const result = await Ingrediente.bulkWrite(ops, { ordered: false });
    created(res, { inserted: result.upsertedCount, updated: result.modifiedCount });
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
    const previo = await Ingrediente.findOne({ _id: req.params.id, branch: branchId }).lean();
    if (!previo) throw new NotFoundError("Ingrediente no encontrado");

    const item = await Ingrediente.findOneAndUpdate({ _id: req.params.id, branch: branchId }, req.body, { new: true });
    if (!item) throw new NotFoundError("Ingrediente no encontrado");

    if (item.costoUnitario !== previo.costoUnitario || item.costoGr !== previo.costoGr) {
      await recalcularCadena(branchId, [String(item._id)]);
    }

    ok(res, item);
  } catch (err) { next(err); }
});

// DELETE
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = String(req.params.branchId);
    await assertBranchAccess(branchId, req.user!.userId);
    await Ingrediente.findOneAndDelete({ _id: req.params.id, branch: branchId });
    ok(res, { deleted: true });
  } catch (err) { next(err); }
});

export default router;
