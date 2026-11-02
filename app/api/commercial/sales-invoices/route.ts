import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSalesInvoiceJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";
import { round2 } from "@/lib/utils/math";
import { getNextInvoiceNumber } from "@/lib/utils/sequence";

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
        discountAccount: true,
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

    const mappedInvoices = invoices.map((inv) => {
      const itemsSum = inv.items?.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0,
      );

      let subtotal = Number(inv.subtotal || 0);
      const discount = Number(inv.discount || 0);
      if (itemsSum && itemsSum > 0) {
        subtotal = round2(itemsSum);
      }
      const net = Math.max(0, subtotal - discount);

      const dbVatRate =
        inv.vatRate !== undefined && inv.vatRate !== null
          ? Number(inv.vatRate)
          : 0;
      const dbVatAmount = Number(inv.vatAmount || 0);
      const dbTotalAmount = Number(inv.totalAmount || 0);

      let vatRate = 0;
      let vatAmount = 0;
      let totalAmount = 0;

      if (dbVatRate > 0 && dbVatAmount > 0) {
        vatRate = dbVatRate;
        vatAmount = round2(dbVatAmount);
        totalAmount =
          dbTotalAmount > 0 ? dbTotalAmount : round2(net + vatAmount);
      } else if (dbVatRate > 0 && dbTotalAmount > net) {
        vatRate = dbVatRate;
        vatAmount = round2((net * vatRate) / 100);
        totalAmount =
          dbTotalAmount > 0 ? dbTotalAmount : round2(net + vatAmount);
      } else {
        vatRate = 0;
        vatAmount = 0;
        totalAmount = dbTotalAmount > 0 ? dbTotalAmount : round2(net);
      }

      const paidAmount = Number(inv.paidAmount || 0);
      const remainingBalance = Math.max(0, round2(totalAmount - paidAmount));

      return {
        ...inv,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        remainingBalance,
      };
    });

    return NextResponse.json(mappedInvoices);
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
      discountAccountId = null,
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
      }
    }

    let invNo = invoiceNumber;
    if (!invNo) {
      invNo = await getNextInvoiceNumber();
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
    const vatRate =
      body.vatRate !== undefined && body.vatRate !== null
        ? parseFloat(body.vatRate)
        : body.vatAmount !== undefined
          ? parseFloat(body.vatAmount) > 0
            ? 5.0
            : 0
          : 0;
    const vatAmount =
      body.vatAmount !== undefined
        ? parseFloat(body.vatAmount)
        : vatRate > 0
          ? (netSubtotal * vatRate) / 100
          : 0;
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
        discountAccountId: discountAccountId || null,
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
        discountAccount: true,
      },
    });

    if (autoPost) {
      const je = await postSalesInvoiceJournalEntry({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invDate,
        customerName: invoice.customerName,
        subtotal: subtotal,
        discount: discTotal,
        discountAccountId: discountAccountId || null,
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

    if (quotationRef || projectScope) {
      const matchedProject = await prisma.project.findFirst({
        where: {
          OR: [
            ...(quotationRef
              ? [
                  {
                    name: {
                      contains: quotationRef,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
            ...(projectScope
              ? [
                  {
                    name: {
                      equals: projectScope,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
      });

      if (
        matchedProject &&
        (!matchedProject.contractValue ||
          Number(matchedProject.contractValue) === 0 ||
          Number(matchedProject.contractValue) !== totalAmount)
      ) {
        await prisma.project.update({
          where: { id: matchedProject.id },
          data: {
            contractValue: totalAmount,
            budget: totalAmount,
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
