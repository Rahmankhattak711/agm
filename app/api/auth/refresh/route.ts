export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  clearAuthCookies,
  getRefreshTokenFromCookie,
  setAuthCookies,
} from "@/lib/auth/cookies";
import {
  generateRefreshToken,
  sha256,
  signAccessToken,
} from "@/lib/auth/tokens";
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

  const rl = rateLimit(`refresh:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many refresh attempts" },
      { status: 429 },
    );
  }

  const rawToken = await getRefreshTokenFromCookie();
  if (!rawToken) {
    await clearAuthCookies();
    return NextResponse.json(
      { error: "Missing refresh token" },
      { status: 401 },
    );
  }

  const tokenHash = sha256(rawToken);

  try {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    const now = new Date();

    if (existingToken.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { familyId: existingToken.familyId },
        data: { revokedAt: now },
      });

      await createAuditLog({
        actorId: existingToken.userId,
        action: "AUTH_TOKEN_REUSE_DETECTED",
        entity: "RefreshToken",
        entityId: existingToken.id,
        metadata: {
          familyId: existingToken.familyId,
          warning: "Refresh token reuse detected; entire token family revoked",
        },
        ip,
      });

      await clearAuthCookies();
      return NextResponse.json(
        { error: "Compromised token detected. Please sign in again." },
        { status: 401 },
      );
    }

    if (existingToken.expiresAt < now) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 },
      );
    }

    const user = existingToken.user;
    if (!user || !user.isActive || user.deletedAt) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "User inactive or deleted" },
        { status: 401 },
      );
    }

    const nextRawToken = generateRefreshToken();
    const nextTokenHash = sha256(nextRawToken);
    const nextExpiresAt = new Date(
      Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
    );
    const nextTokenId = crypto.randomUUID();

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          id: nextTokenId,
          tokenHash: nextTokenHash,
          familyId: existingToken.familyId,
          userId: user.id,
          expiresAt: nextExpiresAt,
          userAgent,
          ip,
        },
      }),
      prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          revokedAt: now,
          replacedById: nextTokenId,
        },
      }),
    ]);

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      v: user.tokenVersion,
    });

    await setAuthCookies(accessToken, nextRawToken);

    return NextResponse.json({
      success: true,
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
    console.error("Refresh error:", error);
    await clearAuthCookies();
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 },
    );
  }
}
