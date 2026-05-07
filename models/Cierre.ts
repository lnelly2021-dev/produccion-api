import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICierre extends Document {
  branch:       Types.ObjectId;
  responsable:  string;
  fechaApertura: string;
  fechaAperturaISO: string;
  fechaCierre:  string;
  baseCaja:     number;
  valor:        number;
  estado:       "CUADRADA" | "DESCUADRADA";
  snapshot:     Record<string, any>;
}

const cierreSchema = new Schema<ICierre>(
  {
    branch:           { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    responsable:      { type: String, required: true },
    fechaApertura:    { type: String },
    fechaAperturaISO: { type: String },
    fechaCierre:      { type: String, required: true },
    baseCaja:         { type: Number, default: 0 },
    valor:            { type: Number, default: 0 },
    estado:           { type: String, enum: ["CUADRADA", "DESCUADRADA"], default: "CUADRADA" },
    snapshot:         { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

cierreSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model<ICierre>("Cierre", cierreSchema);
