import { NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden, hasRole } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "HR_MANAGER",
        "HR",
        "ACCOUNTANT",
      ])
    ) {
      return forbidden();
    }

    const { id } = await props.params;

    const item = await (prisma as any).salaryCertificate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Salary certificate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...item,
      monthlySalaryNum: Number(item.monthlySalaryNum || 0),
      createdAt: item.createdAt?.toISOString?.() || item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() || item.updatedAt,
    });
  } catch (error: any) {
    console.error("GET /api/commercial/salary-certificates/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "HR_MANAGER",
        "HR",
      ])
    ) {
      return forbidden();
    }

    const { id } = await props.params;

    await (prisma as any).salaryCertificate.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(
      "DELETE /api/commercial/salary-certificates/[id] error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
