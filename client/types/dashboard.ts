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
