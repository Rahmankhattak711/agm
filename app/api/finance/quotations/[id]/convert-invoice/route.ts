import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { round2 } from "@/lib/utils/math";
import { getNextInvoiceNumber, getNextProjectCode } from "@/lib/utils/sequence";
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

    const itemsSubtotal = formattedItems.reduce(
      (sum, i) => sum + i.totalAmount,
      0,
    );
    const subtotal = round2(
      itemsSubtotal || parseFloat(quotation.subtotal?.toString() || "0") || 0,
    );
    const discount = round2(
      parseFloat(quotation.discount?.toString() || "0") || 0,
    );
    const rawVatAmount =
      quotation.vatAmount !== null && quotation.vatAmount !== undefined
        ? parseFloat(quotation.vatAmount.toString())
        : 0;
    const rawVatPct =
      quotation.vatPct !== null && quotation.vatPct !== undefined
        ? parseFloat(quotation.vatPct.toString())
        : 0;
    const rawTotalAmount =
      quotation.totalAmount !== null && quotation.totalAmount !== undefined
        ? parseFloat(quotation.totalAmount.toString())
        : 0;

    const net = Math.max(0, subtotal - discount);

    let vatRate = 0;
    let vatAmount = 0;

    if (rawVatAmount > 0) {
      vatAmount = round2(rawVatAmount);
      vatRate =
        rawVatPct > 0
          ? rawVatPct
          : net > 0
            ? round2((vatAmount / net) * 100)
            : 0;
    } else if (rawVatPct > 0 && rawTotalAmount > net) {
      vatRate = rawVatPct;
      vatAmount = round2((net * vatRate) / 100);
    } else {
      vatRate = 0;
      vatAmount = 0;
    }

    const totalAmount = round2(net + vatAmount);

    let parsedTermsList: string[] = [];
    let parsedPaymentPlans: string[] = [];

    if (quotation.terms) {
      try {
        const parsed = JSON.parse(quotation.terms);
        if (Array.isArray(parsed)) {
          parsedTermsList = parsed.map((t: any) =>
            typeof t === "string"
              ? t
              : `${t.title ? t.title + " " : ""}${t.text || ""}`,
          );
        }
      } catch {
        parsedTermsList = [quotation.terms];
      }
    }

    if (quotation.paymentTerms) {
      try {
        const parsed = JSON.parse(quotation.paymentTerms);
        if (Array.isArray(parsed)) {
          parsedPaymentPlans = parsed.map((p: any) =>
            typeof p === "string" ? p : String(p),
          );
        }
      } catch {
        parsedPaymentPlans = [quotation.paymentTerms];
      }
    }

    if (parsedPaymentPlans.length === 0) {
      parsedPaymentPlans = [
        "40 % Advance",
        "20% Floor work done at ground floor (whichever comes first)",
        "20% Glass work at site (whichever comes first)",
        "15% Wood work at site",
        "5 % Upon handing over",
      ];
    }

    if (parsedTermsList.length === 0) {
      parsedTermsList = [
        "Invoice Note: Please quote the invoice number when making payment.",
        "All materials, specifications, quantities, and prices are as per the approved quotation.",
        "Any additional or variation works requested by the Client shall be charged separately and shall be payable 100% as per the issued invoice.",
        "This invoice is issued in accordance with the terms and conditions stated in the approved quotation.",
        "Payment shall be made as per the payment schedule and terms mentioned in the approved quotation.",
        "Payment Conditions: Variation works shall be paid as per the issued invoice. The quotation number mentioned is for source/reference purposes only and does not constitute the payment terms for the variation works.",
      ];
    }

    const transferredTerms = JSON.stringify({
      terms: parsedTermsList,
      paymentPlans: parsedPaymentPlans,
      paymentTerms: parsedPaymentPlans,
    });

    const salesInvoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await getNextInvoiceNumber(tx);

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
          terms: transferredTerms,
          createdById: authUser.id,
          items: {
            create: formattedItems,
          },
        },
        include: {
          items: true,
        },
      });

      const existingProject = await tx.project.findFirst({
        where: { quotationId: quotation.id },
      });

      if (!existingProject) {
        const projectCode = await getNextProjectCode(tx);
        const projectName = quotation.project
          ? `${quotation.project} (${quotation.quotationNo})`
          : `Project ${quotation.quotationNo}`;

        await tx.project.create({
          data: {
            projectCode,
            name: projectName,
            description: `Project initialized from Quotation ${quotation.quotationNo} and Tax Invoice ${invoiceNumber}`,
            status: "PLANNING",
            priority: "MEDIUM",
            location: quotation.location || null,
            contractValue: totalAmount,
            budget: totalAmount,
            customerId: quotation.customerId || null,
            quotationId: null,
            createdById: authUser.id,
          },
        });
      } else {
        await tx.project.update({
          where: { id: existingProject.id },
          data: {
            contractValue: totalAmount,
            budget: totalAmount,
            quotationId: null,
          },
        });
      }

      // Preserve quotation in database to maintain statutory audit trail and commercial history
      await tx.quotation.update({
        where: { id },
        data: {
          status: "ACCEPTED",
        },
      });

      return inv;
    });

    return NextResponse.json(salesInvoice, { status: 201 });
  } catch (error: any) {
    console.error("POST convert quotation to sales invoice error:", error);
    return NextResponse.json(
      {
        error: "Failed to convert quotation to sales invoice",
      },
      { status: 500 },
    );
  }
}
