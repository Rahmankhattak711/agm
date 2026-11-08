/**
 * UAE Phone Number Utility & Formatter
 * 
 * Rules:
 * - Country Code: +971
 * - Mobile: 9 digits (5X XXX XXXX e.g. 50, 52, 54, 55, 56, 58) -> +971 50 123 4567
 * - Landline: 8 digits ([2-9] XXX XXXX e.g. 4 for Dubai, 2 for Abu Dhabi) -> +971 4 123 4567
 * - Maximum digits allowed: exactly 9 digits (excluding +971)
 */

export const UAE_PHONE_PREFIX = "+971 ";

/**
 * Formats any input string into a standard UAE phone number (+971 XX XXX XXXX).
 * Enforces a strict limit of max 9 national digits.
 */
export function formatUaePhone(val?: string | null): string {
  if (!val || typeof val !== "string") return UAE_PHONE_PREFIX;

  // Extract all digits
  let digits = val.replace(/\D/g, "");

  // If user pasted or typed full international number
  if (digits.startsWith("00971")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("971")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    // Strip local trunk prefix '0' (e.g. 050 -> 50, 04 -> 4)
    digits = digits.slice(1);
  }

  // Strictly enforce max 9 national digits (UAE standard: 8 landline, 9 mobile)
  digits = digits.slice(0, 9);

  if (!digits) return UAE_PHONE_PREFIX;

  // Mobile numbers starting with 5 (9 digits: 5X XXX XXXX)
  if (digits.startsWith("5")) {
    if (digits.length <= 2) return `+971 ${digits}`;
    if (digits.length <= 5) return `+971 ${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  }

  // Landline numbers starting with 2, 3, 4, 6, 7, 9 (8 digits: X XXX XXXX)
  if (["2", "3", "4", "6", "7", "9"].includes(digits[0])) {
    if (digits.length <= 1) return `+971 ${digits}`;
    if (digits.length <= 4) return `+971 ${digits.slice(0, 1)} ${digits.slice(1)}`;
    return `+971 ${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 8)}`;
  }

  // Generic UAE numbers (e.g. 800, 600 or other)
  if (digits.length <= 3) return `+971 ${digits}`;
  if (digits.length <= 6) return `+971 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+971 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

/**
 * Cleans phone number before saving to database.
 * If user only left "+971 " or empty, returns null or empty string.
 */
export function cleanUaePhone(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const digits = val.replace(/\D/g, "");
  // If digits are only 971 or empty
  if (digits === "971" || digits.length <= 3) return null;
  return formatUaePhone(val).trim();
}

/**
 * Validates UAE phone number length
 */
export function validateUaePhone(val?: string | null): string | undefined {
  if (!val) return undefined;
  const digits = val.replace(/\D/g, "");
  if (digits === "971" || digits.length <= 3) return undefined; // Optional field left empty

  let national = digits;
  if (national.startsWith("00971")) national = national.slice(5);
  else if (national.startsWith("971")) national = national.slice(3);
  else if (national.startsWith("0")) national = national.slice(1);

  if (national.length < 8) {
    return "UAE phone number must have at least 8 digits (Landline) or 9 digits (Mobile)";
  }
  if (national.length > 9) {
    return "UAE phone number cannot exceed 9 digits";
  }
  return undefined;
}
