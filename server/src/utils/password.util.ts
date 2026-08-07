const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt silently truncates/ignores input beyond 72 bytes

export interface PasswordValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validatePassword(password: unknown): PasswordValidationResult {
  const reasons: string[] = [];

  if (typeof password !== "string" || password.length === 0) {
    return { valid: false, reasons: ["password is required"] };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    reasons.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    reasons.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters long`);
  }

  if (!/[a-zA-Z]/.test(password)) {
    reasons.push("Password must contain at least one letter");
  }

  if (!/[0-9]/.test(password)) {
    reasons.push("Password must contain at least one number");
  }

  if (/\s/.test(password)) {
    reasons.push("Password must not contain whitespace");
  }

  return { valid: reasons.length === 0, reasons };
}
