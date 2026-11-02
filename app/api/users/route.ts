export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/app/generated/prisma";
import { requireUser, handleAuthError } from "@/lib/auth/session";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";

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
  createdAt: true,
  updatedAt: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const;

export async function GET(request: Request) {
  try {
    const actor = await requireUser(["SUPER_ADMIN", "ADMIN"], { isApi: true });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const roleFilter = searchParams.get("role") as UserRole | null;
    const isActiveParam = searchParams.get("isActive");
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {
      deletedAt: null,
    };

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (
      isActiveParam !== null &&
      isActiveParam !== undefined &&
      isActiveParam !== ""
    ) {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users, allUsersForStats] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { role: true, isActive: true },
      }),
    ]);

    const stats = {
      total: allUsersForStats.length,
      active: allUsersForStats.filter((u) => u.isActive).length,
      inactive: allUsersForStats.filter((u) => !u.isActive).length,
      byRole: {
        SUPER_ADMIN: allUsersForStats.filter((u) => u.role === "SUPER_ADMIN")
          .length,
        ADMIN: allUsersForStats.filter((u) => u.role === "ADMIN").length,
        ACCOUNTANT: allUsersForStats.filter((u) => u.role === "ACCOUNTANT")
          .length,
        HR: allUsersForStats.filter((u) => u.role === "HR").length,
        INVENTORY_MANAGER: allUsersForStats.filter(
          (u) => u.role === "INVENTORY_MANAGER",
        ).length,
        USER: allUsersForStats.filter((u) => u.role === "USER").length,
      },
    };

    return NextResponse.json({
      users,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const actor = await requireUser(["SUPER_ADMIN", "ADMIN"], { isApi: true });

    const body = await request.json().catch(() => ({}));
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role as UserRole;
    const temporaryPassword =
      typeof body.temporaryPassword === "string"
        ? body.temporaryPassword
        : typeof body.password === "string"
          ? body.password
          : "";

    if (!fullName || !email || !temporaryPassword || !role) {
      return NextResponse.json(
        {
          error: "Full name, email, role, and temporary password are required",
        },
        { status: 400 },
      );
    }

    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Cannot create an additional SUPER_ADMIN" },
        { status: 403 },
      );
    }

    const policyResult = validatePasswordPolicy(temporaryPassword);
    if (!policyResult.valid) {
      return NextResponse.json(
        { error: policyResult.errors[0], errors: policyResult.errors },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(temporaryPassword);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
        mustChangePassword: true,
        createdById: actor.id,
      },
      select: safeUserSelect,
    });

    await createAuditLog({
      actorId: actor.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: newUser.id,
      metadata: {
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
