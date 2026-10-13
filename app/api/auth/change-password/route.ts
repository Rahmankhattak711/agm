export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import {
  hashPassword,
  validatePasswordPolicy,
  verifyPassword,
} from "@/lib/auth/password";
import {
  generateRefreshToken,
  sha256,
  signAccessToken,
} from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAgent = request.headers.get("user-agent") || undefined;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const body = await request.json().catch(() => ({}));
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 },
      );
    }

    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      await createAuditLog({
        actorId: user.id,
        action: "AUTH_CHANGE_PASSWORD_FAILED",
        entity: "User",
        entityId: user.id,
        metadata: { reason: "Incorrect current password" },
        ip,
      });
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      return NextResponse.json(
        { error: policyResult.errors[0], errors: policyResult.errors },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(newPassword);
    const now = new Date();
    const nextTokenVersion = user.tokenVersion + 1;

    const familyId = crypto.randomUUID();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = sha256(rawRefreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
    );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          passwordChangedAt: now,
          mustChangePassword: false,
          tokenVersion: nextTokenVersion,
        },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash,
          familyId,
          userId: user.id,
          expiresAt: refreshExpiresAt,
          userAgent,
          ip,
        },
      }),
    ]);

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      v: nextTokenVersion,
    });

    await setAuthCookies(accessToken, rawRefreshToken);

    await createAuditLog({
      actorId: user.id,
      action: "AUTH_CHANGE_PASSWORD_SUCCESS",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email },
      ip,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change-password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
