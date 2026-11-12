import { z } from "zod";
import { DEV_FALLBACK_JWT_SECRET, getJwtAccessSecret } from "@/lib/auth/jwt-secret";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/agm"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default(DEV_FALLBACK_JWT_SECRET),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(480),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
  LOCKOUT_MINUTES: z.coerce.number().int().positive().default(480),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
});

const rawEnv = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/agm",
  JWT_ACCESS_SECRET: getJwtAccessSecret(),
  ACCESS_TOKEN_TTL_MINUTES: process.env.ACCESS_TOKEN_TTL_MINUTES || 480,
  REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS || 7,
  MAX_FAILED_LOGINS: process.env.MAX_FAILED_LOGINS || 5,
  LOCKOUT_MINUTES: process.env.LOCKOUT_MINUTES || 480,
  APP_ORIGIN:
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ||
    "http://localhost:3000",
};

const parsedEnv = envSchema.safeParse(rawEnv);

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      DATABASE_URL: rawEnv.DATABASE_URL,
      JWT_ACCESS_SECRET: rawEnv.JWT_ACCESS_SECRET,
      ACCESS_TOKEN_TTL_MINUTES: 480,
      REFRESH_TOKEN_TTL_DAYS: 7,
      MAX_FAILED_LOGINS: 5,
      LOCKOUT_MINUTES: 480,
      APP_ORIGIN: "http://localhost:3000",
    };
