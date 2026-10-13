export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  const user = await getCurrentUser();
  if (!user) {
    await clearAuthCookies();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);

    await createAuditLog({
      actorId: user.id,
      action: "AUTH_LOGOUT_ALL",
      entity: "User",
      entityId: user.id,
      metadata: { reason: "User requested logout from all devices" },
    });

    await clearAuthCookies();
    return NextResponse.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("Logout-all error:", error);
    await clearAuthCookies();
    return NextResponse.json(
      { error: "Failed to log out all sessions" },
      { status: 500 },
    );
  }
}
