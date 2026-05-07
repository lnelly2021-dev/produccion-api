import mongoose, { Schema, Document, Types } from "mongoose";

interface IItemVenta {
  productoId: string;
  nombre:     string;
  cantidad:   number;
  precio:     number;
  subtotal:   number;
}

export interface IVenta extends Document {
  branch:      Types.ObjectId;
  nroFactura:  string;
  mesa?:       Types.ObjectId;
  mesero:      string;
  cliente:     string;
  tipoPago:    string;   // CONTADO | CRÉDITO
  medioPago:   string;   // EFECTIVO | NEQUI | ...
  pagos:       { medio: string; monto: number }[];
  productos:   IItemVenta[];
  valor:       number;
  estado:      string;   // CUADRADA | ANULADA | PENDIENTE
  motivoAnulacion?: string;
  fechaAnulacion?:  Date;
  categoria:   string;   // ingreso | egreso
}

const itemVentaSchema = new Schema<IItemVenta>(
  {
    productoId: String,
    nombre:     String,
    cantidad:   Number,
    precio:     Number,
    subtotal:   Number,
  },
  { _id: false }
);

const ventaSchema = new Schema<IVenta>(
  {
    branch:      { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nroFactura:  { type: String, required: true },
    mesa:        { type: Schema.Types.ObjectId, ref: "Mesa" },
    mesero:      { type: String, default: "" },
    cliente:     { type: String, default: "CONSUMIDOR FINAL" },
    tipoPago:    { type: String, default: "CONTADO" },
    medioPago:   { type: String, default: "EFECTIVO" },
    pagos:       [{ medio: String, monto: Number, _id: false }],
    productos:   { type: [itemVentaSchema], default: [] },
    valor:       { type: Number, required: true },
    estado:      { type: String, default: "CUADRADA" },
    motivoAnulacion: String,
    fechaAnulacion:  Date,
    categoria:   { type: String, default: "ingreso" },
  },
  { timestamps: true }
);

ventaSchema.index({ branch: 1, createdAt: -1 });
ventaSchema.index({ branch: 1, estado: 1 });

export default mongoose.model<IVenta>("Venta", ventaSchema);
