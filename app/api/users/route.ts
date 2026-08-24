import type { UserRole } from "@/app/generated/prisma";
import {
  canManageRole,
  forbidden,
  getAuthUser,
  isAdminRole,
  unauthorized,
  userSelect,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isAdminRole(authUser.role)) return forbidden();

    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    type UserItem = (typeof users)[number];
    const stats = {
      total: users.length,
      active: users.filter((u: UserItem) => u.isActive).length,
      inactive: users.filter((u: UserItem) => !u.isActive).length,
      byRole: {
        SUPER_ADMIN: users.filter((u: UserItem) => u.role === "SUPER_ADMIN")
          .length,
        ADMIN: users.filter((u: UserItem) => u.role === "ADMIN").length,
        ACCOUNTANT: users.filter((u: UserItem) => u.role === "ACCOUNTANT")
          .length,
        HR: users.filter((u: UserItem) => u.role === "HR").length,
        INVENTORY_MANAGER: users.filter(
          (u: UserItem) => u.role === "INVENTORY_MANAGER",
        ).length,
        USER: users.filter((u: UserItem) => u.role === "USER").length,
      },
    };

    return NextResponse.json({ users, stats });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isAdminRole(authUser.role)) return forbidden();

    const body = await request.json();
    const { fullName, email, password, role } = body as {
      fullName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 },
      );
    }

    const targetRole: UserRole = role || "USER";
    if (!canManageRole(authUser, targetRole)) {
      return NextResponse.json(
        { error: "You cannot assign this role" },
        { status: 403 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, role: targetRole },
      select: userSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
