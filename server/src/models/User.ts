import { Schema, model, Document, Types } from "mongoose";

export type UserRole =
  | "admin"
  | "sales"
  | "sanction"
  | "disbursement"
  | "collection"
  | "borrower";

export const USER_ROLES: UserRole[] = [
  "admin",
  "sales",
  "sanction",
  "disbursement",
  "collection",
  "borrower",
];

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, required: true },
  phone: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>("User", userSchema);
