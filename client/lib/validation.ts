export interface FieldValidationResult {
  valid: boolean;
  reasons: string[];
}

const MIN_PASSWORD_LENGTH = 8;
const PHONE_REGEX = /^\d{10}$/;

export function validatePasswordClient(password: string): FieldValidationResult {
  const reasons: string[] = [];

  if (!password) {
    return { valid: false, reasons: ["Password is required"] };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    reasons.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) {
    reasons.push("At least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    reasons.push("At least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    reasons.push("At least one number");
  }
  if (!/[^a-zA-Z0-9\s]/.test(password)) {
    reasons.push("At least one symbol");
  }
  if (/\s/.test(password)) {
    reasons.push("No whitespace allowed");
  }

  return { valid: reasons.length === 0, reasons };
}

export function validatePhoneClient(phone: string): FieldValidationResult {
  if (!phone.trim()) {
    return { valid: false, reasons: ["Phone number is required"] };
  }

  if (!PHONE_REGEX.test(phone.trim())) {
    return { valid: false, reasons: ["Must be exactly 10 digits"] };
  }

  return { valid: true, reasons: [] };
}
