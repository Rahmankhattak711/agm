import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}


export async function POST(request: Request) {
  try {
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
      basicSalary,
    } = body;

    if (
      !employeeCode ||
      !firstName ||
      !lastName ||
      !joiningDate ||
      !basicSalary
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const created = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        department: department || null,
        designation: designation || null,
        joiningDate: new Date(joiningDate),
        basicSalary: Number(basicSalary),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
    if (data.basicSalary) data.basicSalary = Number(data.basicSalary);

    const updated = await prisma.employee.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
