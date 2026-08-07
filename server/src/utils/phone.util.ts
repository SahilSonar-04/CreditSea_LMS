const PHONE_REGEX = /^\d{10}$/;

export interface PhoneValidationResult {
  valid: boolean;
  reasons: string[];
}

export function validatePhone(phone: unknown): PhoneValidationResult {
  if (typeof phone !== "string" || phone.trim().length === 0) {
    return { valid: false, reasons: ["Phone number is required"] };
  }

  if (!PHONE_REGEX.test(phone.trim())) {
    return { valid: false, reasons: ["Phone number must be exactly 10 digits"] };
  }

  return { valid: true, reasons: [] };
}
