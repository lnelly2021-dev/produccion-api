import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICompany extends Document {
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  owner: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    taxId: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    logo: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.index({ owner: 1 });
companySchema.index({ taxId: 1 }, { sparse: true });

const Company = mongoose.model<ICompany>("Company", companySchema);
export default Company;
