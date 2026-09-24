import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          { isActive: true },
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { customerCode: { contains: search, mode: "insensitive" } },
                  { companyName: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        _count: {
          select: {
            quotations: true,
            salesOrders: true,
            salesInvoices: true,
            customerPayments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("GET /api/commercial/customers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      customerCode,
      name,
      companyName,
      phone,
      email,
      address,
      creditLimit,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 },
      );
    }

    let code = customerCode;
    if (!code) {
      const count = await prisma.customer.count();
      code = `CUST-${(count + 1).toString().padStart(3, "0")}`;
    }

    const customer = await prisma.customer.create({
      data: {
        customerCode: code,
        name,
        companyName,
        phone,
        email,
        address,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        currentBalance: 0,
        isActive: true,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/customers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 },
    );
  }
}
