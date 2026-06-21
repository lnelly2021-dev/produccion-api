import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIngrediente extends Document {
  branch:          Types.ObjectId;
  codigo:          string;
  familia:         string;
  nombre:          string;
  unidad:          string;
  costoUnitario:   number;
  costoGr:         number;
  activo:          boolean;
}

const ingredienteSchema = new Schema<IIngrediente>(
  {
    branch:        { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    codigo:        { type: String, default: "" },
    familia:       { type: String, default: "" },
    nombre:        { type: String, required: true, trim: true },
    unidad:        { type: String, default: "und" },
    costoUnitario: { type: Number, default: 0 },
    costoGr:       { type: Number, default: 0 },
    activo:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredienteSchema.index({ branch: 1, nombre: 1 });
export default mongoose.model<IIngrediente>("Ingrediente", ingredienteSchema);
