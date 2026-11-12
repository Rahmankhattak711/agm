import { NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden, hasRole } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export async function GET(
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
        "COMMERCIAL_MANAGER",
        "PROJECT_MANAGER",
        "ESTIMATOR",
        "SITE_ENGINEER",
      ])
    ) {
      return forbidden();
    }

    const { id } = await params;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const item = await (prisma as any).riskAssessment.findFirst({
      where: isUuid ? { OR: [{ id }, { refNumber: id }] } : { refNumber: id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("GET /api/commercial/risk-assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
        "COMMERCIAL_MANAGER",
        "PROJECT_MANAGER",
      ])
    ) {
      return forbidden();
    }

    const { id } = await params;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const existing = await (prisma as any).riskAssessment.findFirst({
      where: isUuid ? { OR: [{ id }, { refNumber: id }] } : { refNumber: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Risk assessment not found" },
        { status: 404 },
      );
    }

    await (prisma as any).riskAssessment.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/commercial/risk-assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
