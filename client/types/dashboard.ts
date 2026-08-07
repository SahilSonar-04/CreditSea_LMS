export interface SalesLead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  utrNumber: string;
  amount: number;
  date: string;
  recordedBy?: string;
  createdAt: string;
}

export interface PaymentHistoryEntry {
  _id: string;
  utrNumber: string;
  amount: number;
  date: string;
  createdAt: string;
  loanId: { _id: string; loanRefNumber: string; fullName?: string } | string;
}