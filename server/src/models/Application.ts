import { Schema, model, Document, Types } from "mongoose";

export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";
export const EMPLOYMENT_MODES: EmploymentMode[] = ["Salaried", "Self-Employed", "Unemployed"];

export type BreStatus = "pending" | "passed" | "failed";

export type ApplicationStatus =
  | "DRAFT"
  | "APPLIED"
  | "SANCTIONED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "APPLIED",
  "SANCTIONED",
  "REJECTED",
  "DISBURSED",
  "CLOSED",
];

export interface IStatusHistoryEntry {
  status: ApplicationStatus;
  changedBy?: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IApplication extends Document {
  _id: Types.ObjectId;
  loanRefNumber: string;
  borrowerId: Types.ObjectId;

  fullName?: string;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  breStatus: BreStatus;
  breReasons: string[];

  salarySlipUrl?: string;

  loanAmount?: number;
  tenureDays?: number;
  interestRate: number;
  simpleInterest?: number;
  totalRepayment?: number;
  outstandingBalance?: number;

  status: ApplicationStatus;
  sanctionedBy?: Types.ObjectId;
  rejectionReason?: string;
  disbursedAt?: Date;
  closedAt?: Date;
  statusHistory: IStatusHistoryEntry[];

  createdAt: Date;
  activeSlot?: Types.ObjectId;
}

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const applicationSchema = new Schema<IApplication>({
  loanRefNumber: { type: String, required: true, unique: true },
  borrowerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  fullName: { type: String, trim: true },
  pan: { type: String, trim: true, uppercase: true },
  dob: { type: Date },
  monthlySalary: { type: Number },
  employmentMode: { type: String, enum: EMPLOYMENT_MODES },
  breStatus: { type: String, enum: ["pending", "passed", "failed"], default: "pending" },
  breReasons: { type: [String], default: [] },

  salarySlipUrl: { type: String },

  loanAmount: { type: Number },
  tenureDays: { type: Number },
  interestRate: { type: Number, default: 12 },
  simpleInterest: { type: Number },
  totalRepayment: { type: Number },
  outstandingBalance: { type: Number },

  status: { type: String, enum: APPLICATION_STATUSES, default: "DRAFT" },
  sanctionedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String, trim: true },
  disbursedAt: { type: Date },
  closedAt: { type: Date },
  statusHistory: { type: [statusHistorySchema], default: [] },

  createdAt: { type: Date, default: Date.now },
  activeSlot: { type: Schema.Types.ObjectId },
});

applicationSchema.index(
  { activeSlot: 1 },
  { unique: true, partialFilterExpression: { activeSlot: { $exists: true } } }
);

export const Application = model<IApplication>("Application", applicationSchema);
