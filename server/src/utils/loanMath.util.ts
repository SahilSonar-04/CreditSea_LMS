export const INTEREST_RATE = 12;
export const MIN_LOAN_AMOUNT = 50_000;
export const MAX_LOAN_AMOUNT = 500_000;
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;

export function calculateSimpleInterest(
  principal: number,
  tenureDays: number,
  rate: number = INTEREST_RATE
): number {
  const simpleInterest = (principal * rate * tenureDays) / (365 * 100);
  return Math.round(simpleInterest * 100) / 100;
}

export function calculateTotalRepayment(principal: number, simpleInterest: number): number {
  return Math.round((principal + simpleInterest) * 100) / 100;
}
