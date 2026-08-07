import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  loanId: Types.ObjectId;
  utrNumber: string;
  amount: number;
  date: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  loanId: { type: Schema.Types.ObjectId, ref: "Application", required: true },
  utrNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = model<IPayment>("Payment", paymentSchema);
