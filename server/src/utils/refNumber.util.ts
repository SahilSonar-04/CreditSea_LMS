import { Application } from "../models/Application";

export async function generateLoanRefNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CS-${year}-`;
  const latestApplication = await Application.findOne({
    loanRefNumber: new RegExp(`^${prefix}\\d{6}$`),
  })
    .sort({ loanRefNumber: -1 })
    .select("loanRefNumber")
    .lean();

  const previousSequence = latestApplication
    ? Number(latestApplication.loanRefNumber.slice(prefix.length))
    : 0;
  const sequence = String(previousSequence + 1).padStart(6, "0");
  return `CS-${year}-${sequence}`;
}
