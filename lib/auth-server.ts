import type { UserRole } from "@/app/generated/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/agm_access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function hasRole(actor: AuthUser, ...roles: UserRole[]): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;
  return roles.includes(actor.role);
}

export function canModifyResource(
  actor: AuthUser,
  resourceOwnerId?: string | null,
  allowedRoles: UserRole[] = [],
): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;
  if (allowedRoles.length > 0 && allowedRoles.includes(actor.role)) return true;
  if (resourceOwnerId && actor.id === resourceOwnerId) return true;
  return false;
}

export function canManageRole(actor: AuthUser, targetRole: UserRole): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  if (actor.role === "ADMIN") {
    return (
      targetRole === "ACCOUNTANT" ||
      targetRole === "HR" ||
      targetRole === "INVENTORY_MANAGER" ||
      targetRole === "USER"
    );
  }
  return false;
}

export function canManageUser(actor: AuthUser, target: AuthUser): boolean {
  if (actor.id === target.id) return false;
  return canManageRole(actor, target.role);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(
  message = "Forbidden: You do not have permission to perform this action",
) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
