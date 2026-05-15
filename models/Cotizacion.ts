import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICotizacionItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ICotizacion extends Document {
  branch: Types.ObjectId;
  nro: string;
  fecha: string;
  vigencia: string;
  cliente: string;
  direccion: string;
  telefono: string;
  email: string;
  items: ICotizacionItem[];
  descuento: number;
  notas: string;
  subtotal: number;
  totalFinal: number;
  estado: "vigente" | "vencida" | "aceptada" | "cancelada";
}

const itemSchema = new Schema<ICotizacionItem>(
  {
    nombre:         { type: String, required: true },
    cantidad:       { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
    subtotal:       { type: Number, required: true },
  },
  { _id: false }
);

const cotizacionSchema = new Schema<ICotizacion>(
  {
    branch:     { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nro:        { type: String, required: true },
    fecha:      { type: String, required: true },
    vigencia:   { type: String, required: true },
    cliente:    { type: String, default: "" },
    direccion:  { type: String, default: "" },
    telefono:   { type: String, default: "" },
    email:      { type: String, default: "" },
    items:      [itemSchema],
    descuento:  { type: Number, default: 0 },
    impuesto:   { type: Number, default: 0 },
    domicilio:  { type: Number, default: 0 },
    notas:      { type: String, default: "" },
    subtotal:   { type: Number, required: true },
    totalFinal: { type: Number, required: true },
    estado:     { type: String, enum: ["vigente", "vencida", "aceptada", "cancelada"], default: "vigente" },
  },
  { timestamps: true }
);

cotizacionSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model<ICotizacion>("Cotizacion", cotizacionSchema);
