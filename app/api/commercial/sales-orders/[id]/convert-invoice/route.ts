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
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const { id } = await params;

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: true,
        customerRel: true,
      },
    });

    if (!salesOrder) {
      return NextResponse.json(
        { error: "Sales Order not found" },
        { status: 404 },
      );
    }

    const count = await prisma.salesInvoice.count();
    const invoiceNumber = `INV-2026-${(count + 1).toString().padStart(4, "0")}`;

    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        customerId: salesOrder.customerId,
        customerName: salesOrder.customerName,
        customerTrn: salesOrder.customerRel?.trn || null,
        salesOrderId: salesOrder.id,
        quotationRef: salesOrder.quotationId || null,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        projectScope: salesOrder.projectScope,
        status: "DRAFT",
        subtotal: salesOrder.subtotal,
        discount: salesOrder.discount,
        vatRate: salesOrder.vatRate,
        vatAmount: salesOrder.vatAmount,
        totalAmount: salesOrder.totalAmount,
        paidAmount: 0,
        remainingBalance: salesOrder.totalAmount,
        notes: salesOrder.notes,
        terms: salesOrder.terms,
        createdById: authUser.id,
        items: {
          create: salesOrder.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: true,
        customerRel: true,
      },
    });

    // Update Sales Order status to PROCESSING / COMPLETED
    await prisma.salesOrder.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("POST convert sales order to invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert sales order to invoice" },
      { status: 500 },
    );
  }
}
