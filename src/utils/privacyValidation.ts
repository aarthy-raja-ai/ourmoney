// OurMoney — Privacy Validation
// Client-side guard: ensures no sensitive fields are ever submitted.
// Server-side Firestore rules are the authoritative enforcement.
// This is a defence-in-depth layer.

// Fields that must NEVER be stored — hard product requirement.
const BANNED_FIELDS = [
  'accountNumber',
  'loanAccountNumber',
  'bankAccountNumber',
  'accountNo',
  'loanAccountNo',
  'customerID',
  'customerId',
  'cifNumber',
  'cif',
  'upiId',
  'upiPin',
  'atmPin',
  'cardNumber',
  'cardPin',
  'bankPassword',
  'netBankingPassword',
  'otp',
  'aadhaar',
  'aadhaarNumber',
  'pan',
  'panNumber',
  'passportNumber',
  'drivingLicense',
  'cvv',
  'pin',
  'password',
] as const;

export type BannedField = typeof BANNED_FIELDS[number];

export class SensitiveFieldError extends Error {
  constructor(fieldName: string) {
    super(`OurMoney does not store sensitive field: ${fieldName}`);
    this.name = 'SensitiveFieldError';
  }
}

/**
 * Validate that a data object contains no sensitive fields.
 * Throws SensitiveFieldError if any banned field is found.
 * Call this before any Firestore write.
 */
export function assertNoSensitiveFields(data: Record<string, unknown>): void {
  for (const field of BANNED_FIELDS) {
    if (field in data && data[field] !== undefined && data[field] !== null) {
      throw new SensitiveFieldError(field);
    }
  }

  // Also check for case-insensitive variants
  const lowerKeys = Object.keys(data).map((k) => k.toLowerCase());
  for (const banned of BANNED_FIELDS as readonly string[]) {
    if (lowerKeys.includes(banned.toLowerCase())) {
      throw new SensitiveFieldError(banned);
    }
  }
}

/**
 * Strip any sensitive fields from an object (non-throwing alternative).
 * Returns a clean copy.
 */
export function stripSensitiveFields<T extends Record<string, unknown>>(data: T): Partial<T> {
  const clean: Partial<T> = {};
  for (const [key, value] of Object.entries(data)) {
    const isLower = (BANNED_FIELDS as readonly string[]).includes(key.toLowerCase());
    const isExact = (BANNED_FIELDS as readonly string[]).includes(key);
    if (!isLower && !isExact) {
      (clean as Record<string, unknown>)[key] = value;
    }
  }
  return clean;
}

/**
 * Check if a field name is sensitive (case-insensitive).
 */
export function isSensitiveFieldName(fieldName: string): boolean {
  return (BANNED_FIELDS as readonly string[]).some(
    (f) => f.toLowerCase() === fieldName.toLowerCase(),
  );
}
