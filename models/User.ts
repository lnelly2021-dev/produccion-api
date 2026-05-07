import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "superadmin" | "admin" | "manager" | "cashier";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "cashier"],
      default: "admin",
    },
    active: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// email unique index is already created by `unique: true` in the field definition above

const User = mongoose.model<IUser>("User", userSchema);
export default User;
