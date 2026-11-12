export const DEV_FALLBACK_JWT_SECRET =
  "agm_dev_fallback_jwt_access_secret_min_32_chars_2026_dev_only";

export function getJwtAccessSecret(): string {
  const secret =
    process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_SECRET;

  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error(
        "FATAL: Production JWT secret is missing. Set JWT_ACCESS_SECRET (or ACCESS_TOKEN_SECRET / JWT_SECRET) in your production environment.",
      );
    }
    return DEV_FALLBACK_JWT_SECRET;
  }

  if (isProduction && secret.length < 32) {
    throw new Error(
      "FATAL: Production JWT secret must be at least 32 characters long.",
    );
  }

  return secret;
}

