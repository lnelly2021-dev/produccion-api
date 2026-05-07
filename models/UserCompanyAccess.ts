import mongoose, { Schema, Document, Types } from "mongoose";

export type CompanyRole = "admin" | "manager" | "cashier";

export interface IUserCompanyAccess extends Document {
  user: Types.ObjectId;
  company: Types.ObjectId;
  branches: Types.ObjectId[];
  allBranches: boolean;
  role: CompanyRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userCompanyAccessSchema = new Schema<IUserCompanyAccess>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    branches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    // true = access to all current and future branches of this company
    allBranches: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["admin", "manager", "cashier"],
      default: "admin",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userCompanyAccessSchema.index({ user: 1, company: 1 }, { unique: true });
userCompanyAccessSchema.index({ company: 1 });

const UserCompanyAccess = mongoose.model<IUserCompanyAccess>(
  "UserCompanyAccess",
  userCompanyAccessSchema
);
export default UserCompanyAccess;
