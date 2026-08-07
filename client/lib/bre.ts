import { EmploymentMode } from "@/types/application";

export interface BreCheckInput {
  dob: string;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BreCheckResult {
  passed: boolean;
  reasons: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MIN_AGE = 23;
const MAX_AGE = 50;
const MIN_MONTHLY_SALARY = 25000;

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function checkBreClientSide(input: BreCheckInput): BreCheckResult {
  const reasons: string[] = [];

  if (!input.dob) {
    reasons.push("Date of birth is required");
  } else {
    const age = calculateAge(input.dob);
    if (age < MIN_AGE || age > MAX_AGE) {
      reasons.push(`Age must be between ${MIN_AGE} and ${MAX_AGE} (you are ${age})`);
    }
  }

  if (!input.monthlySalary || input.monthlySalary < MIN_MONTHLY_SALARY) {
    reasons.push(`Monthly salary must be at least ₹${MIN_MONTHLY_SALARY.toLocaleString("en-IN")}`);
  }

  if (!PAN_REGEX.test(input.pan)) {
    reasons.push("PAN does not match a valid format (e.g. ABCDE1234F)");
  }

  if (input.employmentMode === "Unemployed") {
    reasons.push("You must be employed (Salaried or Self-Employed) to apply");
  }

  return { passed: reasons.length === 0, reasons };
}

export const LOAN_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 500_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  INTEREST_RATE: 12,
};

export function calculateSimpleInterest(principal: number, tenureDays: number): number {
  const si = (principal * LOAN_LIMITS.INTEREST_RATE * tenureDays) / (365 * 100);
  return Math.round(si * 100) / 100;
}

export function calculateTotalRepayment(principal: number, simpleInterest: number): number {
  return Math.round((principal + simpleInterest) * 100) / 100;
}
