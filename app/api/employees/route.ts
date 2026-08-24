import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const users = await prisma.user.findMany({
      where: { isActive: true },
    });

    for (const u of users) {
      if (u.email) {
        const existing = await prisma.employee.findUnique({
          where: { email: u.email },
        });

        if (!existing) {
          const names = (u.fullName || "User").trim().split(" ");
          const firstName = names[0] || "User";
          const lastName = names.slice(1).join(" ") || "Staff";
          const codeSuffix = u.id.replace(/-/g, "").slice(-4).toUpperCase();
          const employeeCode = `EMP-${codeSuffix}`;

          let dept = "Operations";
          let desig = "Staff";
          if (u.role === "SUPER_ADMIN" || u.role === "ADMIN") {
            dept = "Administration";
            desig = "Administrator";
          } else if (u.role === "ACCOUNTANT") {
            dept = "Finance";
            desig = "Senior Accountant";
          } else if (u.role === "HR") {
            dept = "Human Resources";
            desig = "HR Specialist";
          } else if (u.role === "INVENTORY_MANAGER") {
            dept = "Inventory";
            desig = "Inventory Manager";
          }

          try {
            await prisma.employee.create({
              data: {
                employeeCode,
                firstName,
                lastName,
                email: u.email,
                department: dept,
                designation: desig,
                joiningDate: u.createdAt || new Date(),
                employmentStatus: "ACTIVE",
                basicSalary: 6000,
                housingAllowance: 0,
                transportAllowance: 0,
                otherAllowances: 0,
                monthlySalary: 6000,
                annualLeaveBalance: 30,
              },
            });
          } catch (e) {
            return NextResponse.json(
              { error: "Internal Server Error" },
              { status: 500 },
            );
          }
        }
      }
    }

    const where: any = {};
    if (department) where.department = department;
    if (status) where.employmentStatus = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        reportsTo: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            directReports: true,
            attendances: true,
            leaves: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
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
    if (!hasRole(authUser, "HR")) {
      return forbidden(
        "Forbidden: Only HR and Admins can create employee profiles",
      );
    }

    const body = await request.json();
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      gender,
      dateOfBirth,
      nationality,
      maritalStatus,
      address,
      profilePhotoUrl,
      emergencyContactName,
      emergencyContactPhone,
      emiratesId,
      emiratesIdExpiry,
      passportNo,
      passportExpiry,
      laborCardNo,
      laborCardExpiry,
      visaNumber,
      visaExpiry,
      contractType,
      employmentStatus,
      probationEndDate,
      contractEndDate,
      reportsToId,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      annualLeaveBalance,
      paymentMethod,
      bankName,
      iban,
    } = body;

    if (
      !employeeCode?.trim() ||
      !firstName?.trim() ||
      !lastName?.trim() ||
      !joiningDate ||
      basicSalary === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const basic = Number(basicSalary || 0);
    const housing = Number(housingAllowance || 0);
    const transport = Number(transportAllowance || 0);
    const other = Number(otherAllowances || 0);
    const monthlySalary = basic + housing + transport + other;

    const created = await prisma.employee.create({
      data: {
        employeeCode: employeeCode.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        designation: designation?.trim() || null,
        joiningDate: new Date(joiningDate),
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality?.trim() || null,
        maritalStatus: maritalStatus || null,
        address: address?.trim() || null,
        profilePhotoUrl: profilePhotoUrl?.trim() || null,
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
        emiratesId: emiratesId?.trim() || null,
        emiratesIdExpiry: emiratesIdExpiry ? new Date(emiratesIdExpiry) : null,
        passportNo: passportNo?.trim() || null,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        laborCardNo: laborCardNo?.trim() || null,
        laborCardExpiry: laborCardExpiry ? new Date(laborCardExpiry) : null,
        visaNumber: visaNumber?.trim() || null,
        visaExpiry: visaExpiry ? new Date(visaExpiry) : null,
        contractType: contractType || "FULL_TIME",
        employmentStatus: employmentStatus || "ACTIVE",
        probationEndDate: probationEndDate ? new Date(probationEndDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        reportsToId: reportsToId || null,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        monthlySalary,
        annualLeaveBalance:
          annualLeaveBalance !== undefined ? Number(annualLeaveBalance) : 30.0,
        paymentMethod: paymentMethod || "WPS_BANK_TRANSFER",
        bankName: bankName?.trim() || null,
        iban: iban?.trim() || null,
      },
      include: {
        reportsTo: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "Code/Email/Emirates ID";
      return NextResponse.json(
        { error: `An employee with this ${field} already exists` },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "HR")) {
      return forbidden(
        "Forbidden: Only HR and Admins can update employee profiles",
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id)
      return NextResponse.json(
        { error: "Missing employee ID" },
        { status: 400 },
      );

    if (data.employeeCode)
      data.employeeCode = data.employeeCode.trim().toUpperCase();
    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.emiratesIdExpiry)
      data.emiratesIdExpiry = new Date(data.emiratesIdExpiry);
    if (data.passportExpiry)
      data.passportExpiry = new Date(data.passportExpiry);
    if (data.laborCardExpiry)
      data.laborCardExpiry = new Date(data.laborCardExpiry);
    if (data.visaExpiry) data.visaExpiry = new Date(data.visaExpiry);
    if (data.probationEndDate)
      data.probationEndDate = new Date(data.probationEndDate);
    if (data.contractEndDate)
      data.contractEndDate = new Date(data.contractEndDate);
    if (data.terminationDate)
      data.terminationDate = new Date(data.terminationDate);

    if (data.basicSalary !== undefined)
      data.basicSalary = Number(data.basicSalary);
    if (data.housingAllowance !== undefined)
      data.housingAllowance = Number(data.housingAllowance);
    if (data.transportAllowance !== undefined)
      data.transportAllowance = Number(data.transportAllowance);
    if (data.otherAllowances !== undefined)
      data.otherAllowances = Number(data.otherAllowances);
    if (data.annualLeaveBalance !== undefined)
      data.annualLeaveBalance = Number(data.annualLeaveBalance);

    if (
      data.basicSalary !== undefined ||
      data.housingAllowance !== undefined ||
      data.transportAllowance !== undefined ||
      data.otherAllowances !== undefined
    ) {
      const current = await prisma.employee.findUnique({ where: { id } });
      if (current) {
        const basic =
          data.basicSalary !== undefined
            ? data.basicSalary
            : Number(current.basicSalary);
        const housing =
          data.housingAllowance !== undefined
            ? data.housingAllowance
            : Number(current.housingAllowance);
        const transport =
          data.transportAllowance !== undefined
            ? data.transportAllowance
            : Number(current.transportAllowance);
        const other =
          data.otherAllowances !== undefined
            ? data.otherAllowances
            : Number(current.otherAllowances);
        data.monthlySalary = basic + housing + transport + other;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: { reportsTo: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "HR")) {
      return forbidden(
        "Forbidden: Only HR and Admins can delete employee profiles",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Missing employee ID" },
        { status: 400 },
      );

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
