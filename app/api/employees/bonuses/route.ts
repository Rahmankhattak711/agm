import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = parseInt(year, 10);
    if (month) where.month = parseInt(month, 10);

    const bonuses = await prisma.bonus.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
        approver: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bonuses);
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, type, amount, month, year, reason } = body;

    if (!employeeId || amount === undefined) {
      return NextResponse.json(
        { error: "Employee ID and Amount are required" },
        { status: 400 },
      );
    }

    const created = await prisma.bonus.create({
      data: {
        employeeId,
        type: type || "OTHER",
        amount: Number(amount),
        month: month ? parseInt(month, 10) : new Date().getMonth() + 1,
        year: year ? parseInt(year, 10) : new Date().getFullYear(),
        reason: reason?.trim() || null,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bonus:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { id, isApproved, isPaid, paidDate, amount, type, reason } = body;

    if (!id)
      return NextResponse.json({ error: "Missing bonus ID" }, { status: 400 });

    const data: any = {};
    if (amount !== undefined) data.amount = Number(amount);
    if (type !== undefined) data.type = type;
    if (reason !== undefined) data.reason = reason?.trim() || null;
    if (isApproved !== undefined) {
      data.isApproved = Boolean(isApproved);
      data.approvedBy = isApproved ? user?.id || null : null;
    }
    if (isPaid !== undefined) {
      data.isPaid = Boolean(isPaid);
      data.paidDate = isPaid
        ? paidDate
          ? new Date(paidDate)
          : new Date()
        : null;
    }

    const updated = await prisma.bonus.update({
      where: { id },
      data,
      include: {
        employee: true,
        approver: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating bonus:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing bonus ID" }, { status: 400 });

    await prisma.bonus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bonus:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
