import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBranch extends Document {
  name: string;
  company: Types.ObjectId;
  address?: string;
  phone?: string;
  bancos: string[];
  consecutivo:   number;
  consecutivoPF: number;
  consecutivoCN: number;
  consecutivoRC: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    address: { type: String, trim: true },
    phone:   { type: String, trim: true },
    bancos:  [{ type: String }],
    consecutivo:   { type: Number, default: 0 },
    consecutivoPF: { type: Number, default: 0 },
    consecutivoCN: { type: Number, default: 0 },
    consecutivoRC: { type: Number, default: 0 },
    active:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ company: 1 });

const Branch = mongoose.model<IBranch>("Branch", branchSchema);
export default Branch;
