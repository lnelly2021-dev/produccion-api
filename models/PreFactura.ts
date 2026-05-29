import mongoose, { Schema, Document, Types } from "mongoose";

interface IItemPF {
  productoId?: string;
  nombre:      string;
  cantidad:    number;
  precio:      number;
  subtotal:    number;
}

export interface IPreFactura extends Document {
  branch:          Types.ObjectId;
  nroDocumento:    string;
  tercero:         string;
  fecha:           Date;
  productos:       IItemPF[];
  subtotal:        number;
  descuento:       number;
  impuesto:        number;
  propina:         number;
  envio:           number;
  total:           number;
  pagos:           { medio: string; monto: number }[];
  anticipo:        number;
  abonos:          { fecha: Date; medio: string; monto: number }[];
  saldoPendiente:  number;
  estado:          "PENDIENTE" | "ENTREGADA" | "ANULADA";
  facturaRef?:     string;
  notasEntrega?:   string;
}

const itemSchema = new Schema<IItemPF>(
  { productoId: String, nombre: String, cantidad: Number, precio: Number, subtotal: Number },
  { _id: false }
);

const preFacturaSchema = new Schema<IPreFactura>(
  {
    branch:         { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nroDocumento:   { type: String, required: true },
    tercero:        { type: String, default: "CONSUMIDOR FINAL" },
    fecha:          { type: Date, default: Date.now },
    productos:      { type: [itemSchema], default: [] },
    subtotal:       { type: Number, default: 0 },
    descuento:      { type: Number, default: 0 },
    impuesto:       { type: Number, default: 0 },
    propina:        { type: Number, default: 0 },
    envio:          { type: Number, default: 0 },
    total:          { type: Number, required: true },
    pagos:          [{ medio: String, monto: Number, _id: false }],
    anticipo:       { type: Number, default: 0 },
    abonos:         [{ fecha: { type: Date, default: Date.now }, medio: String, monto: Number, _id: false }],
    saldoPendiente: { type: Number, default: 0 },
    estado:         { type: String, enum: ["PENDIENTE","ENTREGADA","ANULADA"], default: "PENDIENTE" },
    facturaRef:     { type: String },
    notasEntrega:   { type: String },
  },
  { timestamps: true }
);

preFacturaSchema.index({ branch: 1, createdAt: -1 });
preFacturaSchema.index({ branch: 1, estado: 1 });

export default mongoose.model<IPreFactura>("PreFactura", preFacturaSchema);
