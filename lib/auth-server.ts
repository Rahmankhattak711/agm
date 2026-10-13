import type { UserRole } from "@/app/generated/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  tokenVersion?: number;
  mustChangePassword?: boolean;
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match =
      cookieHeader.match(/access_token=([^;]+)/) ||
      cookieHeader.match(/agm_access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function getAuthUser(
  request: Request,
  options?: { allowMustChangePassword?: boolean },
): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        deletedAt: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) return null;
    if (user.tokenVersion !== payload.v) return null;
    if (user.mustChangePassword && !options?.allowMustChangePassword)
      return null;

    return user;
  } catch {
    return null;
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function hasRole(
  actor: AuthUser,
  ...roles: (UserRole | UserRole[])[]
): boolean {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") return true;
  const flatRoles = roles.flat();
  return flatRoles.includes(actor.role);
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
  if (actor.role === "SUPER_ADMIN") {
    return targetRole !== "SUPER_ADMIN";
  }
  return false;
}

export function canManageUser(actor: AuthUser, target: AuthUser): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return actor.id !== target.id && target.role !== "SUPER_ADMIN";
  }
  return false;
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
  mustChangePassword: true,
  lastLoginAt: true,
  tokenVersion: true,
} as const;
