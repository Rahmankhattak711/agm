import "server-only";
import bcrypt from "bcryptjs";

export const PASSWORD_POLICY = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasDigit: /[0-9]/,
};

export function validatePasswordPolicy(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.minLength} characters long`,
    );
  }
  if (!PASSWORD_POLICY.hasUpper.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!PASSWORD_POLICY.hasLower.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!PASSWORD_POLICY.hasDigit.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function dummyVerifyPassword(password: string): Promise<boolean> {
  const dummyHash =
    "$2a$12$e8p4lQ8Fm6Fh1DqN8qJ9Ye5u5u5u5u5u5u5u5u5u5u5u5u5u5u5u5";
  try {
    await bcrypt.compare(password, dummyHash);
  } catch {}
  return false;
}
