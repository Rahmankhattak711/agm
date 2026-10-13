export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/auth/audit";

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");

    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : querySecret;

    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    await createAuditLog({
      actorId: null,
      action: "CLEANUP_EXPIRED_TOKENS",
      entity: "RefreshToken",
      metadata: {
        deletedCount: result.count,
        cutoffDate: thirtyDaysAgo.toISOString(),
      },
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
