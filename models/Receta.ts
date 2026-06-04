import mongoose, { Schema, Document, Types } from "mongoose";

interface ILineaReceta {
  ingredienteId: Types.ObjectId;
  nombre:        string;
  cantidad:      number;
  unidad:        string;
  costoUnitario: number;
  costoLinea:    number;   // cantidad × costoUnitario
}

export interface IReceta extends Document {
  branch:        Types.ObjectId;
  producto:      string;
  tamanoLote:    number;   // unidades que produce
  descripcion?:  string;
  ingredientes:  ILineaReceta[];
  costoMP:       number;   // suma de costoLinea
  activo:        boolean;
}

const lineaSchema = new Schema<ILineaReceta>(
  {
    ingredienteId: { type: Schema.Types.ObjectId, ref: "Ingrediente" },
    nombre:        String,
    cantidad:      { type: Number, default: 0 },
    unidad:        String,
    costoUnitario: { type: Number, default: 0 },
    costoLinea:    { type: Number, default: 0 },
  },
  { _id: false }
);

const recetaSchema = new Schema<IReceta>(
  {
    branch:       { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    producto:     { type: String, required: true, trim: true },
    tamanoLote:   { type: Number, default: 1 },
    descripcion:  { type: String, default: "" },
    ingredientes: { type: [lineaSchema], default: [] },
    costoMP:      { type: Number, default: 0 },
    activo:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

recetaSchema.index({ branch: 1, producto: 1 });
export default mongoose.model<IReceta>("Receta", recetaSchema);
