import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { assertBranchAccess } from "../utils/tenant.guard";
import { ok, created } from "../utils/response.util";
import mongoose, { Schema } from "mongoose";

// Schema inline (simple)
const salidaSchema = new Schema({
  branch:       { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  tipo:         { type: String, required: true }, // REMISION | AVERIA_FRITA | AVERIA
  nroDoc:       { type: String, required: true },
  fecha:        { type: String },
  fechaISO:     { type: String },
  producto:     { type: String },
  categoria:    { type: String },
  productoId:   { type: Schema.Types.Mixed },
  cantidad:     { type: Number },
  precioPublico:{ type: Number },
  porcentaje:   { type: Number },
  costoUnit:    { type: Number },
  costoTotal:   { type: Number },
}, { timestamps: true });

const Salida = mongoose.models["Salida"] || mongoose.model("Salida", salidaSchema);

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertBranchAccess(String(req.params.branchId), req.user!.userId);
    const lista = await Salida.find({ branch: req.params.branchId }).sort({ createdAt: -1 }).lean();
    ok(res, lista);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertBranchAccess(String(req.params.branchId), req.user!.userId);
    const salida = await Salida.create({ ...req.body, branch: req.params.branchId });
    created(res, salida);
  } catch (err) { next(err); }
});

export default router;
