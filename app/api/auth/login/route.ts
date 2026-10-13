export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { dummyVerifyPassword, verifyPassword } from "@/lib/auth/password";
import {
  generateRefreshToken,
  sha256,
  signAccessToken,
} from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";
import { rateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || undefined;

  const rl = rateLimit(`login:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    const email = rawEmail.trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const now = new Date();

    if (!user) {
      await dummyVerifyPassword(password);
      await createAuditLog({
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        metadata: { reason: "User not found", email },
        ip,
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.isActive || user.deletedAt) {
      await dummyVerifyPassword(password);
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        metadata: { reason: "Account inactive or deleted", email },
        ip,
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      await dummyVerifyPassword(password);
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGIN_LOCKED",
        entity: "User",
        entityId: user.id,
        metadata: { lockedUntil: user.lockedUntil, email },
        ip,
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxFailed = env.MAX_FAILED_LOGINS || 5;
      const lockoutMinutes = env.LOCKOUT_MINUTES || 15;

      let newLockedUntil: Date | null = null;
      if (failedAttempts >= maxFailed) {
        newLockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: newLockedUntil,
        },
      });

      await createAuditLog({
        actorId: user.id,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        metadata: { failedAttempts, locked: Boolean(newLockedUntil), email },
        ip,
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    const familyId = crypto.randomUUID();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = sha256(rawRefreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId,
        userId: user.id,
        expiresAt: refreshExpiresAt,
        userAgent,
        ip,
      },
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      v: user.tokenVersion,
    });

    await setAuthCookies(accessToken, rawRefreshToken);

    await createAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ip,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
