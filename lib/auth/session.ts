import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessTokenFromCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";
import type { UserRole } from "@/app/generated/prisma";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  tokenVersion: number;
  deletedAt: Date | null;
  mustChangePassword: boolean;
}

export const sessionUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  tokenVersion: true,
  deletedAt: true,
  mustChangePassword: true,
} as const;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const token = await getAccessTokenFromCookie();
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: sessionUserSelect,
    });

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    if (user.tokenVersion !== payload.v) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
});

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireUser(
  roles?: UserRole[],
  options?: { isApi?: boolean; allowMustChangePassword?: boolean },
): Promise<SessionUser> {
  const user = await getCurrentUser();
  const isApi = options?.isApi ?? false;

  if (!user) {
    if (isApi) {
      throw new AuthError("Unauthorized: Authentication required", 401);
    }
    redirect("/login");
  }

  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    if (isApi) {
      throw new AuthError("Forbidden: Password change required", 403);
    }
    redirect("/change-password");
  }

  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    if (isApi) {
      throw new AuthError("Forbidden: Insufficient permissions", 403);
    }
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return null;
}
