import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
        "INVENTORY_MANAGER",
      ])
    ) {
      return forbidden();
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action = "APPROVE" } = body;

    const newStatus = action === "REJECT" ? "REJECTED" : "APPROVED";

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: newStatus,
        approvedAt: newStatus === "APPROVED" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("POST approve purchase request error:", error);
    return NextResponse.json(
      { error: "Failed to update purchase request status" },
      { status: 500 },
    );
  }
}
