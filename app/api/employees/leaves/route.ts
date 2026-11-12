import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import {
  forbidden,
  getAuthUser,
  hasRole,
  resolveLinkedEmployee,
  unauthorized,
} from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const isHrOrAccountant =
      hasRole(authUser, "HR") || hasRole(authUser, "ACCOUNTANT");

    if (isHrOrAccountant) {
      if (employeeId) where.employeeId = employeeId;
    } else {
      const linkage = await resolveLinkedEmployee(authUser);
      if (linkage.status !== "MATCH") {
        return NextResponse.json([]);
      }
      if (employeeId && employeeId !== linkage.employeeId) {
        return forbidden(
          "Forbidden: You cannot view another employee's leave requests",
        );
      }
      where.employeeId = linkage.employeeId;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            annualLeaveBalance: true,
          },
        },
        approver: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } =
      body;

    if (!employeeId || !leaveType || !startDate || !endDate || !totalDays) {
      return NextResponse.json(
        { error: "Missing required leave fields" },
        { status: 400 },
      );
    }

    if (!hasRole(authUser, "HR")) {
      const linkage = await resolveLinkedEmployee(authUser);
      if (linkage.status !== "MATCH" || linkage.employeeId !== employeeId) {
        return forbidden("Forbidden: You can only apply for your own leave");
      }
    }

    const created = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: Number(totalDays),
        reason: reason?.trim() || null,
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Leave ID and Status are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    if (
      (status === "APPROVED" || status === "REJECTED") &&
      !hasRole(user, "HR")
    ) {
      return forbidden(
        "Forbidden: Only HR and Admins can approve or reject leave requests",
      );
    }

    if (status === "CANCELLED") {
      if (!hasRole(user, "HR")) {
        const linkage = await resolveLinkedEmployee(user);
        if (
          linkage.status !== "MATCH" ||
          linkage.employeeId !== existing.employeeId
        ) {
          return forbidden(
            "Forbidden: You cannot cancel another user's leave request",
          );
        }
      }
    } else if (
      status !== "APPROVED" &&
      status !== "REJECTED" &&
      !hasRole(user, "HR")
    ) {
      return forbidden(
        "Forbidden: You do not have permission to update this leave request",
      );
    }

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (
          status === "APPROVED" &&
          existing.status !== "APPROVED" &&
          existing.leaveType === "ANNUAL"
        ) {
          const days = Number(existing.totalDays);
          const currentBalance = Number(existing.employee.annualLeaveBalance);
          await tx.employee.update({
            where: { id: existing.employeeId },
            data: { annualLeaveBalance: Math.max(0, currentBalance - days) },
          });
        }

        if (
          existing.status === "APPROVED" &&
          status !== "APPROVED" &&
          existing.leaveType === "ANNUAL"
        ) {
          const days = Number(existing.totalDays);
          const currentBalance = Number(existing.employee.annualLeaveBalance);
          await tx.employee.update({
            where: { id: existing.employeeId },
            data: { annualLeaveBalance: currentBalance + days },
          });
        }

        const leave = await tx.leaveRequest.update({
          where: { id },
          data: {
            status,
            approvedBy: status === "APPROVED" ? user.id : null,
            approvedAt: status === "APPROVED" ? new Date() : null,
          },
          include: {
            employee: true,
            approver: true,
          },
        });

        return leave;
      },
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing leave ID" }, { status: 400 });

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      select: { id: true, employeeId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    if (!hasRole(user, "HR")) {
      const linkage = await resolveLinkedEmployee(user);
      if (
        linkage.status !== "MATCH" ||
        linkage.employeeId !== existing.employeeId
      ) {
        return forbidden(
          "Forbidden: You cannot delete another user's leave request",
        );
      }
      if (existing.status === "APPROVED") {
        return forbidden(
          "Forbidden: Approved leave requests cannot be deleted by employees",
        );
      }
    }

    await prisma.leaveRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
