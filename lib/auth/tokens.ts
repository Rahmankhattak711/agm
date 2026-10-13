import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { UserRole } from "@/app/generated/prisma";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  role: UserRole;
  v: number;
}

const secretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export async function signAccessToken(payload: {
  sub: string;
  role: UserRole;
  v: number;
}): Promise<string> {
  const expiresMinutes = env.ACCESS_TOKEN_TTL_MINUTES || 480;
  return new SignJWT({
    role: payload.role,
    v: payload.v,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresMinutes}m`)
    .sign(secretKey);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}
