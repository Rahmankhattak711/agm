import type { UserRole } from "@/app/generated/prisma";
import {
  canManageRole,
  canManageUser,
  forbidden,
  getAuthUser,
  isAdminRole,
  unauthorized,
  userSelect,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isAdminRole(authUser.role)) return forbidden();

    const { id } = await context.params;
    const target = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, email, role, isActive, password } = body as {
      fullName?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    };

    const isSelf = authUser.id === id;

    if (isSelf && (role !== undefined || isActive === false)) {
      return NextResponse.json(
        { error: "You cannot change your own role or deactivate yourself" },
        { status: 403 },
      );
    }

    if (!isSelf && !canManageUser(authUser, target)) {
      return forbidden();
    }

    if (role !== undefined && !canManageRole(authUser, role)) {
      return NextResponse.json(
        { error: "You cannot assign this role" },
        { status: 403 },
      );
    }

    const data: {
      fullName?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (fullName !== undefined) data.fullName = fullName.trim();
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== target.email.toLowerCase()) {
        const existing = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 409 },
          );
        }
        data.email = trimmedEmail;
      }
    }
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isAdminRole(authUser.role)) return forbidden();

    const { id } = await context.params;

    if (authUser.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 403 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageUser(authUser, target)) return forbidden();

    if (authUser.role === "SUPER_ADMIN") {
      try {
        await prisma.refreshToken.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({
          success: true,
          message: "User permanently deleted",
        });
      } catch (e) {
        const updated = await prisma.user.update({
          where: { id },
          data: { isActive: false },
          select: userSelect,
        });
        return NextResponse.json({
          success: true,
          message: "User has linked operational records, deactivated instead",
          user: updated,
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
