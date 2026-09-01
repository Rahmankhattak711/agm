import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSalesInvoiceJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const invoices = await prisma.salesInvoice.findMany({
      where: {
        AND: [
          status && status !== "ALL" ? { status: status as any } : {},
          search
            ? {
                OR: [
                  { invoiceNumber: { contains: search, mode: "insensitive" } },
                  { customerName: { contains: search, mode: "insensitive" } },
                  { customerTrn: { contains: search, mode: "insensitive" } },
                  { projectScope: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        customerRel: true,
        salesOrder: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        creditNotes: true,
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET /api/commercial/sales-invoices error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales invoices" },
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
      invoiceNumber,
      customerId,
      customerName,
      customerTrn,
      quotationRef,
      salesOrderId,
      invoiceDate,
      dueDate,
      projectScope,
      items = [],
      discount = 0,
      notes,
      terms,
      autoPost = false,
    } = body;

    if (!customerName && !customerId) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 },
      );
    }

    let custName = customerName;
    let custTrn = customerTrn;
    if (customerId) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      if (c) {
        if (!custName) custName = c.name;
        if (!custTrn) custTrn = c.trn;
      }
    }

    let invNo = invoiceNumber;
    if (!invNo) {
      const count = await prisma.salesInvoice.count();
      invNo = `INV-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.unitPrice || item.unitRate) || 0;
      const itemDisc = parseFloat(item.discount) || 0;
      const total = qty * rate - itemDisc;
      subtotal += total;

      return {
        productId: item.productId || null,
        description: item.description || "Fitout service / supply",
        quantity: qty,
        unit: item.unit || "SQM",
        unitPrice: rate,
        discount: itemDisc,
        totalAmount: total,
      };
    });

    const discTotal = parseFloat(discount) || 0;
    const netSubtotal = Math.max(0, subtotal - discTotal);
    const vatRate = 5.0;
    const vatAmount = (netSubtotal * vatRate) / 100;
    const totalAmount = netSubtotal + vatAmount;

    const invDate = invoiceDate ? new Date(invoiceDate) : new Date();

    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber: invNo,
        customerId: customerId || null,
        customerName: custName || "Valued Customer",
        customerTrn: custTrn || null,
        quotationRef,
        salesOrderId: salesOrderId || null,
        invoiceDate: invDate,
        dueDate: dueDate
          ? new Date(dueDate)
          : new Date(invDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        projectScope: projectScope || "Commercial Fitout Project",
        status: autoPost ? "POSTED" : "DRAFT",
        subtotal: netSubtotal,
        discount: discTotal,
        vatRate,
        vatAmount,
        totalAmount,
        paidAmount: 0,
        remainingBalance: totalAmount,
        notes,
        terms,
        createdById: authUser.id,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: true,
        customerRel: true,
      },
    });

    if (autoPost) {
      const je = await postSalesInvoiceJournalEntry({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invDate,
        customerName: invoice.customerName,
        subtotal: netSubtotal,
        vatAmount,
        totalAmount,
        userId: authUser.id,
      });

      await prisma.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          journalEntryId: je.id,
          postedAt: new Date(),
        },
      });

      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            currentBalance: { increment: totalAmount },
          },
        });
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/sales-invoices error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sales invoice" },
      { status: 500 },
    );
  }
}
