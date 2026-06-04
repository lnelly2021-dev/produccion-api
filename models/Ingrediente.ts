import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIngrediente extends Document {
  branch:          Types.ObjectId;
  nombre:          string;
  unidad:          string;   // kg, lt, und, gr, ml, etc.
  costoUnitario:   number;
  proveedor?:      string;
  activo:          boolean;
}

const ingredienteSchema = new Schema<IIngrediente>(
  {
    branch:        { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nombre:        { type: String, required: true, trim: true },
    unidad:        { type: String, default: "und" },
    costoUnitario: { type: Number, default: 0 },
    proveedor:     { type: String, default: "" },
    activo:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredienteSchema.index({ branch: 1, nombre: 1 });
export default mongoose.model<IIngrediente>("Ingrediente", ingredienteSchema);
