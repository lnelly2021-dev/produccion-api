import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecaudo extends Document {
  branch:     Types.ObjectId;
  nroRecibo:  string;
  fecha:      string;
  fechaISO:   string;
  tercero:    string;
  concepto:   string;
  valor:      number;
  medioPago:  string;
  facturaRef?: string;
}

const recaudoSchema = new Schema<IRecaudo>(
  {
    branch:    { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nroRecibo: { type: String, required: true },
    fecha:     { type: String, required: true },
    fechaISO:  { type: String, required: true },
    tercero:   { type: String, default: "" },
    concepto:  { type: String, default: "" },
    valor:     { type: Number, required: true },
    medioPago: { type: String, default: "EFECTIVO" },
    facturaRef:{ type: String },
  },
  { timestamps: true }
);

recaudoSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model<IRecaudo>("Recaudo", recaudoSchema);
