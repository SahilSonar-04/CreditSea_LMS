import { EmploymentMode } from "../models/Application";

export interface BreInput {
  dob: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  reasons: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MIN_AGE = 23;
const MAX_AGE = 50;
const MIN_MONTHLY_SALARY = 25000;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function runBre(input: BreInput): BreResult {
  const reasons: string[] = [];
  const age = calculateAge(input.dob);

  if (age < MIN_AGE || age > MAX_AGE) {
    reasons.push(`Age must be between ${MIN_AGE} and ${MAX_AGE} (applicant is ${age})`);
  }

  if (input.monthlySalary < MIN_MONTHLY_SALARY) {
    reasons.push(`Monthly salary must be at least ₹${MIN_MONTHLY_SALARY.toLocaleString("en-IN")}`);
  }

  if (!PAN_REGEX.test(input.pan)) {
    reasons.push("PAN does not match a valid format (e.g. ABCDE1234F)");
  }

  if (input.employmentMode === "Unemployed") {
    reasons.push("Applicant must be employed (Salaried or Self-Employed)");
  }

  return { passed: reasons.length === 0, reasons };
}
