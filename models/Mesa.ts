import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMesa extends Document {
  branch:  Types.ObjectId;
  nombre:  string;
  numero:  number;
  estado:  "libre" | "ocupada";
  mesero:  string;
  active:  boolean;
}

const mesaSchema = new Schema<IMesa>(
  {
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    nombre: { type: String, required: true, trim: true },
    numero: { type: Number, required: true },
    estado: { type: String, enum: ["libre", "ocupada"], default: "libre" },
    mesero: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mesaSchema.index({ branch: 1, active: 1 });

export default mongoose.model<IMesa>("Mesa", mesaSchema);
