import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
  LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  APP_ORIGIN: z.string().url("APP_ORIGIN must be a valid URL"),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_SECRET,
  ACCESS_TOKEN_TTL_MINUTES: process.env.ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS,
  MAX_FAILED_LOGINS: process.env.MAX_FAILED_LOGINS,
  LOCKOUT_MINUTES: process.env.LOCKOUT_MINUTES,
  APP_ORIGIN:
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
});

if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(errors, null, 2),
  );
  throw new Error(
    "Invalid environment configuration. Application boot aborted.",
  );
}

export const env = parsedEnv.data;
