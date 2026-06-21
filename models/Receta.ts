import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILineaReceta {
  tipo:          "ingrediente" | "subreceta";
  ingredienteId?: Types.ObjectId;
  recetaId?:      Types.ObjectId;
  nombre:        string;
  cantidad:      number;
  unidad:        string;
  costoUnitario: number;
  costoLinea:    number;
}

export interface IReceta extends Document {
  branch:       Types.ObjectId;
  nombre:       string;
  rendimiento:  number;
  unidad:       string;
  lineas:       ILineaReceta[];
  minutosMO:          number;
  minutosCIF:         number;
  moExterna:          boolean;
  moExternaPorUnidad: number;
  costoMP:            number;
  costoMO:      number;
  costoCIF:     number;
  costoTotal:   number;
  costoPorcion: number;
  esProductoTerminado: boolean;
  pctPersonalizado:    boolean;
  pctVentas:           number;
  pctAdmon:            number;
  costoAdmon:          number;
  costoVentas:         number;
  costoTotalFinal:     number;
  activo:       boolean;
}

const lineaSchema = new Schema<ILineaReceta>(
  {
    tipo:          { type: String, enum: ["ingrediente", "subreceta"], default: "ingrediente" },
    ingredienteId: { type: Schema.Types.ObjectId, ref: "Ingrediente" },
    recetaId:      { type: Schema.Types.ObjectId, ref: "Receta" },
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
    nombre:       { type: String, required: true, trim: true },
    rendimiento:  { type: Number, default: 1 },
    unidad:       { type: String, default: "und" },
    lineas:       { type: [lineaSchema], default: [] },
    minutosMO:          { type: Number,  default: 0 },
    minutosCIF:         { type: Number,  default: 0 },
    moExterna:          { type: Boolean, default: false },
    moExternaPorUnidad: { type: Number,  default: 0 },
    costoMP:            { type: Number,  default: 0 },
    costoMO:      { type: Number, default: 0 },
    costoCIF:     { type: Number, default: 0 },
    costoTotal:   { type: Number, default: 0 },
    costoPorcion: { type: Number, default: 0 },
    esProductoTerminado: { type: Boolean, default: false },
    pctPersonalizado:    { type: Boolean, default: false },
    pctVentas:           { type: Number,  default: 0 },
    pctAdmon:            { type: Number,  default: 0 },
    costoAdmon:          { type: Number,  default: 0 },
    costoVentas:         { type: Number,  default: 0 },
    costoTotalFinal:     { type: Number,  default: 0 },
    activo:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

recetaSchema.index({ branch: 1, nombre: 1 });
export default mongoose.model<IReceta>("Receta", recetaSchema);
