export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateCronSecret } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const deleteResult = await tx.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: null,
          action: "CLEANUP_EXPIRED_TOKENS",
          entity: "RefreshToken",
          metadata: {
            deletedCount: deleteResult.count,
            cutoffDate: thirtyDaysAgo.toISOString(),
          },
        },
      });

      return deleteResult;
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.count} refresh tokens expired more than 30 days ago`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Cleanup tokens error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
