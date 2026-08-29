import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-2026-${(count + 1).toString().padStart(4, "0")}`;

    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: quotation.customerId,
        customerName: quotation.customer || "Valued Customer",
        quotationId: quotation.id,
        orderDate: new Date(),
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        projectScope: quotation.project || "Commercial Fitout Contract",
        status: "CONFIRMED",
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        vatRate: quotation.vatPct,
        vatAmount: quotation.vatAmount,
        totalAmount: quotation.totalAmount,
        notes: quotation.notes,
        terms: quotation.terms,
        createdById: authUser.id,
        items: {
          create: quotation.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitRate,
            discount: 0,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update Quotation status to ACCEPTED
    await prisma.quotation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json(salesOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST convert quotation to sales order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert quotation to sales order" },
      { status: 500 },
    );
  }
}
