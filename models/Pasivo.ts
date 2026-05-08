import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPago {
  fecha:     string;
  monto:     number;
  medioPago: string;
}

export interface IPasivo extends Document {
  branch:     Types.ObjectId;
  fecha:      string;
  proveedor:  string;
  nroFactura: string;
  concepto:   string;
  valor:      number;
  abono:      number;
  saldo:      number;
  estado:     "Pendiente" | "Pagado";
  pagos:      IPago[];
}

const pagoSchema = new Schema<IPago>(
  {
    fecha:     { type: String, required: true },
    monto:     { type: Number, required: true },
    medioPago: { type: String, default: "EFECTIVO" },
  },
  { _id: false }
);

const pasivoSchema = new Schema<IPasivo>(
  {
    branch:     { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    fecha:      { type: String, required: true },
    proveedor:  { type: String, required: true },
    nroFactura: { type: String, default: "S/N" },
    concepto:   { type: String, default: "" },
    valor:      { type: Number, required: true },
    abono:      { type: Number, default: 0 },
    saldo:      { type: Number, required: true },
    estado:     { type: String, enum: ["Pendiente", "Pagado"], default: "Pendiente" },
    pagos:      [pagoSchema],
  },
  { timestamps: true }
);

pasivoSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model<IPasivo>("Pasivo", pasivoSchema);
