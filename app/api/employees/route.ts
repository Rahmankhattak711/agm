import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
  publicEmployeeSelect,
  accountantEmployeeSelect,
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

    const isHrOrAdmin = hasRole(authUser, "SUPER_ADMIN", "ADMIN", "HR_MANAGER", "HR");
    const isAccountant = hasRole(authUser, "ACCOUNTANT");

    if (isHrOrAdmin) {
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
    }

    if (isAccountant) {
      const employees = await prisma.employee.findMany({
        where,
        select: accountantEmployeeSelect,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(employees);
    }

    const employees = await prisma.employee.findMany({
      where,
      select: publicEmployeeSelect,
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

    const allowedFields = new Set([
      "employeeCode",
      "firstName",
      "lastName",
      "email",
      "phone",
      "department",
      "designation",
      "joiningDate",
      "gender",
      "dateOfBirth",
      "nationality",
      "maritalStatus",
      "address",
      "profilePhotoUrl",
      "emergencyContactName",
      "emergencyContactPhone",
      "emiratesId",
      "emiratesIdExpiry",
      "passportNo",
      "passportExpiry",
      "laborCardNo",
      "laborCardExpiry",
      "visaNumber",
      "visaExpiry",
      "contractType",
      "employmentStatus",
      "probationEndDate",
      "contractEndDate",
      "terminationDate",
      "reportsToId",
      "basicSalary",
      "housingAllowance",
      "transportAllowance",
      "otherAllowances",
      "annualLeaveBalance",
      "paymentMethod",
      "bankName",
      "iban",
      "isActive",
    ]);

    const sanitizedData: any = {};
    for (const key of Object.keys(data)) {
      if (allowedFields.has(key)) {
        sanitizedData[key] = data[key];
      }
    }

    if (sanitizedData.employeeCode)
      sanitizedData.employeeCode = sanitizedData.employeeCode.trim().toUpperCase();
    if (sanitizedData.joiningDate)
      sanitizedData.joiningDate = new Date(sanitizedData.joiningDate);
    if (sanitizedData.dateOfBirth)
      sanitizedData.dateOfBirth = new Date(sanitizedData.dateOfBirth);
    if (sanitizedData.emiratesIdExpiry)
      sanitizedData.emiratesIdExpiry = new Date(sanitizedData.emiratesIdExpiry);
    if (sanitizedData.passportExpiry)
      sanitizedData.passportExpiry = new Date(sanitizedData.passportExpiry);
    if (sanitizedData.laborCardExpiry)
      sanitizedData.laborCardExpiry = new Date(sanitizedData.laborCardExpiry);
    if (sanitizedData.visaExpiry)
      sanitizedData.visaExpiry = new Date(sanitizedData.visaExpiry);
    if (sanitizedData.probationEndDate)
      sanitizedData.probationEndDate = new Date(sanitizedData.probationEndDate);
    if (sanitizedData.contractEndDate)
      sanitizedData.contractEndDate = new Date(sanitizedData.contractEndDate);
    if (sanitizedData.terminationDate)
      sanitizedData.terminationDate = new Date(sanitizedData.terminationDate);

    if (sanitizedData.basicSalary !== undefined)
      sanitizedData.basicSalary = Number(sanitizedData.basicSalary);
    if (sanitizedData.housingAllowance !== undefined)
      sanitizedData.housingAllowance = Number(sanitizedData.housingAllowance);
    if (sanitizedData.transportAllowance !== undefined)
      sanitizedData.transportAllowance = Number(sanitizedData.transportAllowance);
    if (sanitizedData.otherAllowances !== undefined)
      sanitizedData.otherAllowances = Number(sanitizedData.otherAllowances);
    if (sanitizedData.annualLeaveBalance !== undefined)
      sanitizedData.annualLeaveBalance = Number(sanitizedData.annualLeaveBalance);

    if (
      sanitizedData.basicSalary !== undefined ||
      sanitizedData.housingAllowance !== undefined ||
      sanitizedData.transportAllowance !== undefined ||
      sanitizedData.otherAllowances !== undefined
    ) {
      const current = await prisma.employee.findUnique({ where: { id } });
      if (current) {
        const basic =
          sanitizedData.basicSalary !== undefined
            ? sanitizedData.basicSalary
            : Number(current.basicSalary);
        const housing =
          sanitizedData.housingAllowance !== undefined
            ? sanitizedData.housingAllowance
            : Number(current.housingAllowance);
        const transport =
          sanitizedData.transportAllowance !== undefined
            ? sanitizedData.transportAllowance
            : Number(current.transportAllowance);
        const other =
          sanitizedData.otherAllowances !== undefined
            ? sanitizedData.otherAllowances
            : Number(current.otherAllowances);
        sanitizedData.monthlySalary = basic + housing + transport + other;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: sanitizedData,
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

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Soft deactivation preserves 5-year statutory payroll & attendance audit trails
    await prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        employmentStatus: "TERMINATED",
        terminationDate: new Date(),
      },
    });
    return NextResponse.json({ ok: true, message: "Employee deactivated successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
