export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/app/generated/prisma";
import { requireUser, handleAuthError } from "@/lib/auth/session";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";

type RouteContext = { params: Promise<{ id: string }> };

const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  tokenVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const;

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireUser(["SUPER_ADMIN"], { isApi: true });
    const { id } = await context.params;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: safeUserSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const actor = await requireUser(["SUPER_ADMIN"], { isApi: true });
    const { id } = await context.params;

    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, email, role, isActive, temporaryPassword, password } =
      body as {
        fullName?: string;
        email?: string;
        role?: UserRole;
        isActive?: boolean;
        temporaryPassword?: string;
        password?: string;
      };

    const isSelf = actor.id === target.id;
    const isTargetSuperAdmin = target.role === "SUPER_ADMIN";

    if (role !== undefined && role !== target.role) {
      if (isSelf) {
        return NextResponse.json(
          { error: "You cannot change your own role" },
          { status: 403 },
        );
      }
      if (isTargetSuperAdmin) {
        return NextResponse.json(
          { error: "Cannot change the role of a SUPER_ADMIN" },
          { status: 403 },
        );
      }
      if (role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Cannot assign SUPER_ADMIN role" },
          { status: 403 },
        );
      }
    }

    if (isActive === false) {
      if (isSelf) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 403 },
        );
      }
      if (isTargetSuperAdmin) {
        return NextResponse.json(
          { error: "Cannot deactivate a SUPER_ADMIN account" },
          { status: 403 },
        );
      }
    }

    const auditChanges: Record<string, any> = {};
    let shouldIncrementTokenVersion = false;
    let shouldRevokeRefreshTokens = false;

    const updateData: any = {};

    if (typeof fullName === "string" && fullName.trim() !== target.fullName) {
      updateData.fullName = fullName.trim();
      auditChanges.fullName = {
        from: target.fullName,
        to: updateData.fullName,
      };
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== target.email.toLowerCase()) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { error: "A user with this email address already exists" },
            { status: 409 },
          );
        }
        updateData.email = normalizedEmail;
        auditChanges.email = { from: target.email, to: normalizedEmail };
      }
    }

    if (role !== undefined && role !== target.role) {
      updateData.role = role;
      auditChanges.role = { from: target.role, to: role };
      shouldIncrementTokenVersion = true;
    }

    if (isActive !== undefined && isActive !== target.isActive) {
      updateData.isActive = isActive;
      auditChanges.isActive = { from: target.isActive, to: isActive };
      if (!isActive) {
        shouldIncrementTokenVersion = true;
        shouldRevokeRefreshTokens = true;
      }
    }

    const pwdToSet = temporaryPassword || password;
    if (pwdToSet) {
      const policy = validatePasswordPolicy(pwdToSet);
      if (!policy.valid) {
        return NextResponse.json(
          { error: policy.errors[0], errors: policy.errors },
          { status: 400 },
        );
      }
      updateData.passwordHash = await hashPassword(pwdToSet);
      updateData.mustChangePassword = true;
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
      auditChanges.passwordReset = true;
      shouldIncrementTokenVersion = true;
      shouldRevokeRefreshTokens = true;
    }

    if (shouldIncrementTokenVersion) {
      updateData.tokenVersion = { increment: 1 };
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        select: safeUserSelect,
      });

      if (shouldRevokeRefreshTokens) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return u;
    });

    await createAuditLog({
      actorId: actor.id,
      action: "USER_UPDATED",
      entity: "User",
      entityId: id,
      metadata: {
        changes: auditChanges,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const actor = await requireUser(["SUPER_ADMIN"], { isApi: true });
    const { id } = await context.params;

    if (actor.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 403 },
      );
    }

    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete a SUPER_ADMIN account" },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await createAuditLog({
      actorId: actor.id,
      action: "USER_DELETED",
      entity: "User",
      entityId: id,
      metadata: {
        email: target.email,
        softDelete: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User successfully deactivated and marked as deleted",
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
