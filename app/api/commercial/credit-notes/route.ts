import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postCreditNoteJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const creditNotes = await prisma.creditNote.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    creditNoteNumber: { contains: search, mode: "insensitive" },
                  },
                  { customerName: { contains: search, mode: "insensitive" } },
                  { reason: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        customerRel: true,
        salesInvoice: true,
        items: true,
        journalEntry: true,
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

    return NextResponse.json(creditNotes);
  } catch (error: any) {
    console.error("GET /api/commercial/credit-notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch credit notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const body = await request.json();
    const {
      creditNoteNumber,
      customerId,
      customerName,
      salesInvoiceId,
      returnDate,
      reason,
      items = [],
      subtotal = 0,
      vatAmount = 0,
      totalAmount = 0,
      autoPost = true,
    } = body;

    let custId = customerId;
    let custName = customerName;

    if (salesInvoiceId && !custId) {
      const inv = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
      });
      if (inv) {
        custId = inv.customerId;
        if (!custName) custName = inv.customerName;
      }
    }

    let cnNo = creditNoteNumber;
    if (!cnNo) {
      const count = await prisma.creditNote.count();
      cnNo = `CN-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const netSub = parseFloat(subtotal) || 0;
    const netVat = parseFloat(vatAmount) || netSub * 0.05;
    const netTot = parseFloat(totalAmount) || netSub + netVat;
    const retDate = returnDate ? new Date(returnDate) : new Date();

    let journalEntryId: string | null = null;
    if (autoPost) {
      const je = await postCreditNoteJournalEntry({
        creditNoteId: "",
        creditNoteNumber: cnNo,
        returnDate: retDate,
        customerName: custName || "Customer",
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        userId: authUser.id,
      });
      journalEntryId = je.id;
    }

    const creditNote = await prisma.creditNote.create({
      data: {
        creditNoteNumber: cnNo,
        customerId: custId || null,
        customerName: custName || "Valued Customer",
        salesInvoiceId: salesInvoiceId || null,
        returnDate: retDate,
        reason: reason || "Scope alteration / Client credit note",
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        status: autoPost ? "POSTED" : "DRAFT",
        journalEntryId,
        createdById: authUser.id,
        items: {
          create: items.map((i: any) => ({
            description: i.description || "Credit item",
            quantity: parseFloat(i.quantity) || 1,
            unitPrice: parseFloat(i.unitPrice || i.unitRate) || 0,
            totalAmount:
              (parseFloat(i.quantity) || 1) *
              (parseFloat(i.unitPrice || i.unitRate) || 0),
          })),
        },
      },
      include: {
        items: true,
        customerRel: true,
        salesInvoice: true,
      },
    });

    // Update customer balance
    if (autoPost && custId) {
      await prisma.customer.update({
        where: { id: custId },
        data: {
          currentBalance: { decrement: netTot },
        },
      });
    }

    return NextResponse.json(creditNote, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/credit-notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create credit note" },
      { status: 500 },
    );
  }
}
