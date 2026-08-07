export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";

export type BreStatus = "pending" | "passed" | "failed";

export type ApplicationStatus =
  | "DRAFT"
  | "APPLIED"
  | "SANCTIONED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED";

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedBy?: string;
  changedAt: string;
  note?: string;
}

export interface Application {
  _id: string;
  loanRefNumber: string;
  borrowerId: string;

  fullName?: string;
  pan?: string;
  dob?: string;
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
  rejectionReason?: string;
  disbursedAt?: string;
  closedAt?: string;
  statusHistory: StatusHistoryEntry[];

  createdAt: string;
}
