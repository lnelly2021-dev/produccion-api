import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBranch extends Document {
  name: string;
  company: Types.ObjectId;
  address?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ company: 1 });

const Branch = mongoose.model<IBranch>("Branch", branchSchema);
export default Branch;
