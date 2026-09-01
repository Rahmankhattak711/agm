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

    const count = await prisma.salesInvoice.count();
    const invoiceNumber = `INV-2026-${(count + 1).toString().padStart(4, "0")}`;

    const formattedItems = quotation.items.map((item) => {
      const qty = parseFloat(item.quantity?.toString() || "1") || 1;
      const rate = parseFloat(item.unitRate?.toString() || "0") || 0;
      const total =
        parseFloat(item.totalAmount?.toString() || "0") || qty * rate;

      return {
        productId: item.productId || null,
        description: item.description || "Fitout service / supply",
        quantity: qty,
        unit: item.unit || "SQM",
        unitPrice: rate,
        discount: 0,
        totalAmount: total,
      };
    });

    const subtotal = parseFloat(quotation.subtotal?.toString() || "0") || 0;
    const discount = parseFloat(quotation.discount?.toString() || "0") || 0;
    const vatRate = parseFloat(quotation.vatPct?.toString() || "5.00") || 5.0;
    const vatAmount = parseFloat(quotation.vatAmount?.toString() || "0") || 0;
    const totalAmount =
      parseFloat(quotation.totalAmount?.toString() || "0") ||
      subtotal - discount + vatAmount;

    const salesInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.create({
        data: {
          invoiceNumber,
          customerId: quotation.customerId || null,
          customerName: quotation.customer || "Valued Customer",
          customerTrn: quotation.trn || null,
          quotationRef: quotation.quotationNo,
          salesOrderId: null,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          projectScope:
            quotation.project ||
            quotation.reference ||
            "Commercial Fitout Contract",
          status: "DRAFT",
          subtotal,
          discount,
          vatRate,
          vatAmount,
          totalAmount,
          paidAmount: 0,
          remainingBalance: totalAmount,
          notes: quotation.notes || null,
          terms: quotation.terms || quotation.paymentTerms || null,
          createdById: authUser.id,
          items: {
            create: formattedItems,
          },
        },
        include: {
          items: true,
        },
      });

      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });
      await tx.quotation.delete({
        where: { id },
      });

      return inv;
    });

    return NextResponse.json(salesInvoice, { status: 201 });
  } catch (error: any) {
    console.error("POST convert quotation to sales invoice error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to convert quotation to sales invoice",
      },
      { status: 500 },
    );
  }
}
