import { Application } from "../models/Application";

export async function generateLoanRefNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Application.countDocuments();
  const sequence = String(count + 1).padStart(6, "0");
  return `CS-${year}-${sequence}`;
}
