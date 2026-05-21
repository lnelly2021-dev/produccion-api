import mongoose, { Schema, Document, Types } from "mongoose";

type Estado = "NUEVO" | "EN_PREPARACION" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";

interface IItem { productoId: string; nombre: string; precio: number; cantidad: number; }

export interface IDomicilio extends Document {
  branch:      Types.ObjectId;
  fecha:       string;
  nro:         string;
  cliente:     string;
  telefono:    string;
  direccion:   string;
  barrio:      string;
  productos:   IItem[];
  subtotal:    number;
  descuento:   number;
  impuesto:    number;
  envio:       number;
  total:       number;
  medioPago:   string;
  pagos:       { medio: string; monto: number }[];
  estado:      Estado;
  notas:       string;
  domiciliario: string;
  facturaId?:  string;
}

const itemSchema = new Schema<IItem>(
  { productoId: String, nombre: String, precio: Number, cantidad: Number },
  { _id: false }
);

const domicilioSchema = new Schema<IDomicilio>(
  {
    branch:       { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    fecha:        { type: String, default: () => new Date().toISOString() },
    nro:          { type: String, required: true },
    cliente:      { type: String, required: true },
    telefono:     { type: String, default: "" },
    direccion:    { type: String, required: true },
    barrio:       { type: String, default: "" },
    productos:    { type: [itemSchema], default: [] },
    subtotal:     { type: Number, default: 0 },
    descuento:    { type: Number, default: 0 },
    impuesto:     { type: Number, default: 0 },
    envio:        { type: Number, default: 0 },
    total:        { type: Number, required: true },
    medioPago:    { type: String, default: "EFECTIVO" },
    pagos:        [{ medio: String, monto: Number, _id: false }],
    estado:       { type: String, enum: ["NUEVO","EN_PREPARACION","EN_CAMINO","ENTREGADO","CANCELADO"], default: "NUEVO" },
    notas:        { type: String, default: "" },
    domiciliario: { type: String, default: "" },
    facturaId:    { type: String },
  },
  { timestamps: true }
);

domicilioSchema.index({ branch: 1, createdAt: -1 });
domicilioSchema.index({ branch: 1, estado: 1 });

export default mongoose.model<IDomicilio>("Domicilio", domicilioSchema);
