import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
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
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("GET /api/commercial/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const {
      customerCode,
      name,
      companyName,
      phone,
      email,
      address,
      creditLimit,
      isActive,
    } = body;

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: "Customer name cannot be empty" },
        { status: 400 },
      );
    }

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (customerCode && customerCode.trim() !== existing.customerCode) {
      const codeCheck = await prisma.customer.findUnique({
        where: { customerCode: customerCode.trim() },
      });
      if (codeCheck && codeCheck.id !== id) {
        return NextResponse.json(
          { error: "Customer code is already taken by another client" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        customerCode:
          customerCode !== undefined ? customerCode.trim() : undefined,
        name: name !== undefined ? name.trim() : undefined,
        companyName:
          companyName !== undefined
            ? companyName
              ? companyName.trim()
              : null
            : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        address:
          address !== undefined ? (address ? address.trim() : null) : undefined,
        creditLimit:
          creditLimit !== undefined ? parseFloat(creditLimit) || 0 : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/commercial/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const { id } = await params;

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const [quotationsCount, ordersCount, invoicesCount, paymentsCount] =
      await Promise.all([
        prisma.quotation.count({ where: { customerId: id } }),
        prisma.salesOrder.count({ where: { customerId: id } }),
        prisma.salesInvoice.count({ where: { customerId: id } }),
        prisma.customerPayment.count({ where: { customerId: id } }),
      ]);

    const hasTransactions =
      quotationsCount > 0 ||
      ordersCount > 0 ||
      invoicesCount > 0 ||
      paymentsCount > 0;

    if (hasTransactions) {
      await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "Customer deactivated and hidden",
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/commercial/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
