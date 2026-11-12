import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { SYSTEM_ROLES } from "@/lib/modules/hr/roles.config";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Fetch user counts grouped by role
    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { role: true },
    });

    const countMap: Record<string, number> = {};
    for (const u of users) {
      countMap[u.role] = (countMap[u.role] || 0) + 1;
    }

    const rolesWithCounts = SYSTEM_ROLES.map((r) => ({
      ...r,
      userCount: countMap[r.code] || (r.code === "USER" ? countMap["USER"] || 0 : 0),
    }));

    return NextResponse.json({
      roles: rolesWithCounts,
      totalRoles: rolesWithCounts.length,
    });
  } catch (error) {
    console.error("Error fetching HR roles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
