import {
  getAuthUser,
  hasRole,
  unauthorized,
  resolveLinkedEmployee,
  publicEmployeeSelect,
  accountantEmployeeSelect,
  selfEmployeeSelect,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const isHrOrAdmin = hasRole(authUser, "SUPER_ADMIN", "ADMIN", "HR_MANAGER", "HR");
    if (isHrOrAdmin) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          reportsTo: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
          },
          documents: {
            orderBy: { createdAt: "desc" },
          },
          leaves: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          attendances: {
            take: 30,
            orderBy: { attendanceDate: "desc" },
          },
        },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      return NextResponse.json(employee);
    }

    // Check if employee is viewing own self-service profile
    const linkage = await resolveLinkedEmployee(authUser);
    const isSelf = linkage.status === "MATCH" && linkage.employeeId === id;

    if (isSelf) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        select: {
          ...selfEmployeeSelect,
          documents: {
            orderBy: { createdAt: "desc" },
          },
          leaves: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          attendances: {
            take: 30,
            orderBy: { attendanceDate: "desc" },
          },
        },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      return NextResponse.json(employee);
    }

    if (hasRole(authUser, "ACCOUNTANT")) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        select: {
          ...accountantEmployeeSelect,
          leaves: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          attendances: {
            take: 30,
            orderBy: { attendanceDate: "desc" },
          },
        },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      return NextResponse.json(employee);
    }

    // Public workforce view: strictly exclude sensitive PII, compensation and banking
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: publicEmployeeSelect,
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
