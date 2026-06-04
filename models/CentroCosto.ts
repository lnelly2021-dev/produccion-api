import mongoose, { Schema, Document, Types } from "mongoose";

export type TipoCosto =
  | "MANO_OBRA"       // salarios, prestaciones
  | "FIJO"            // arriendo, depreciación
  | "VARIABLE"        // servicios, empaques, combustible
  | "INDIRECTO"       // CIF no asignables directamente
  | "COMERCIAL"       // publicidad, comisiones ventas
  | "ADMINISTRATIVO"; // gerencia, contabilidad

export type BaseAsignacion =
  | "POR_LOTE"       // valor fijo por lote de producción
  | "POR_UNIDAD"     // valor por unidad producida
  | "POR_HORA"       // costo × horas empleadas
  | "PORCENTAJE_MP"; // % sobre el costo de materia prima

export interface ICentroCosto extends Document {
  branch:          Types.ObjectId;
  nombre:          string;
  tipo:            TipoCosto;
  base:            BaseAsignacion;
  valor:           number;   // valor monetario o % según base
  activo:          boolean;
}

const centroCostoSchema = new Schema<ICentroCosto>(
  {
    branch:  { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nombre:  { type: String, required: true, trim: true },
    tipo:    { type: String, enum: ["MANO_OBRA","FIJO","VARIABLE","INDIRECTO","COMERCIAL","ADMINISTRATIVO"], required: true },
    base:    { type: String, enum: ["POR_LOTE","POR_UNIDAD","POR_HORA","PORCENTAJE_MP"], default: "POR_LOTE" },
    valor:   { type: Number, default: 0 },
    activo:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

centroCostoSchema.index({ branch: 1, tipo: 1 });
export default mongoose.model<ICentroCosto>("CentroCosto", centroCostoSchema);
