import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { round2 } from "@/lib/utils/math";
import { UpdatePostedInvoiceCommandHandler } from "@/lib/modules/accounting";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    const shortId = cleanId.replace(/^INV-2026-/i, "INV-");

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const where: any = isUuid
      ? { OR: [{ id: cleanId }, { invoiceNumber: { equals: cleanId, mode: "insensitive" as const } }] }
      : {
          OR: [
            { invoiceNumber: { equals: cleanId, mode: "insensitive" as const } },
            { invoiceNumber: { equals: shortId, mode: "insensitive" as const } },
            { invoiceNumber: { contains: cleanId, mode: "insensitive" as const } },
          ],
        };

    let invoice = await prisma.salesInvoice.findFirst({
      where,
      include: {
        customerRel: true,
        salesOrder: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
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
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Sales invoice not found" },
        { status: 404 },
      );
    }

    // If journalEntry is missing on relation, look up by reference or entryNumber
    if (!invoice.journalEntry || !(invoice.journalEntry as any).lines?.length) {
      const je = await prisma.journalEntry.findFirst({
        where: {
          OR: [
            { reference: invoice.invoiceNumber },
            { entryNumber: { contains: invoice.invoiceNumber } },
            { description: { contains: invoice.invoiceNumber, mode: "insensitive" } },
          ],
        },
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
      });
      if (je) {
        (invoice as any).journalEntry = je;
      }
    }

    const itemsSum = invoice.items?.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );

    let subtotal = Number(invoice.subtotal || 0);
    const discount = Number(invoice.discount || 0);
    if (itemsSum && itemsSum > 0) {
      subtotal = round2(itemsSum);
    }
    const net = Math.max(0, subtotal - discount);

    const dbVatRate =
      invoice.vatRate !== undefined && invoice.vatRate !== null
        ? Number(invoice.vatRate)
        : 0;
    const dbVatAmount = Number(invoice.vatAmount || 0);
    const dbTotalAmount = Number(invoice.totalAmount || 0);

    let vatRate = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    if (dbVatRate > 0 && dbVatAmount > 0) {
      vatRate = dbVatRate;
      vatAmount = round2(dbVatAmount);
      totalAmount = dbTotalAmount > 0 ? dbTotalAmount : round2(net + vatAmount);
    } else if (dbVatRate > 0 && dbTotalAmount > net) {
      vatRate = dbVatRate;
      vatAmount = round2((net * vatRate) / 100);
      totalAmount = dbTotalAmount > 0 ? dbTotalAmount : round2(net + vatAmount);
    } else {
      vatRate = 0;
      vatAmount = 0;
      totalAmount = dbTotalAmount > 0 ? dbTotalAmount : round2(net);
    }

    const paidAmount = Number(invoice.paidAmount || 0);
    const remainingBalance = Math.max(0, round2(totalAmount - paidAmount));

    return NextResponse.json({
      ...invoice,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      remainingBalance,
    });
  } catch (error: any) {
    console.error("GET /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales invoice" },
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
      terms,
      notes,
      invoiceDate,
      dueDate,
      projectScope,
      customerName,
      customerTrn,
      discount,
      discountAccountId,
      vatRate,
      vatAmount,
      totalAmount,
      items,
    } = body;

    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Sales invoice not found" },
        { status: 404 },
      );
    }

    const dataToUpdate: any = {
      terms: terms !== undefined ? terms : undefined,
      notes: notes !== undefined ? notes : undefined,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      projectScope: projectScope !== undefined ? projectScope : undefined,
      customerName: customerName !== undefined ? customerName : undefined,
      customerTrn: customerTrn !== undefined ? customerTrn : undefined,
      discountAccountId: discountAccountId !== undefined ? (discountAccountId || null) : undefined,
    };

    if (Array.isArray(items)) {
      await prisma.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: id },
      });

      let calculatedSubtotal = 0;
      const formattedItems = items.map((item: any) => {
        const qty = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.unitPrice || item.unitRate) || 0;
        const itemDisc = parseFloat(item.discount) || 0;
        const total = qty * rate - itemDisc;
        calculatedSubtotal += total;
        return {
          salesInvoiceId: id,
          productId: item.productId || null,
          description: item.description || "Fitout service / supply",
          quantity: qty,
          unit: item.unit || "SQM",
          unitPrice: rate,
          discount: itemDisc,
          totalAmount: total,
        };
      });

      if (formattedItems.length > 0) {
        await prisma.salesInvoiceItem.createMany({
          data: formattedItems,
        });
      }

      const disc =
        discount !== undefined
          ? parseFloat(discount) || 0
          : Number(existingInvoice.discount || 0);
      const net = Math.max(0, calculatedSubtotal - disc);
      const vRate =
        vatRate !== undefined
          ? parseFloat(vatRate) || 0
          : Number(existingInvoice.vatRate || 0);
      const vAmount =
        vatAmount !== undefined
          ? parseFloat(vatAmount) || 0
          : vRate > 0
            ? round2((net * vRate) / 100)
            : 0;
      const tot = round2(net + vAmount);

      dataToUpdate.subtotal = calculatedSubtotal;
      dataToUpdate.discount = disc;
      dataToUpdate.vatRate = vRate;
      dataToUpdate.vatAmount = vAmount;
      dataToUpdate.totalAmount = tot;
      dataToUpdate.remainingBalance = Math.max(
        0,
        round2(tot - Number(existingInvoice.paidAmount || 0)),
      );
    } else if (totalAmount !== undefined && terms === undefined) {
      const hasVat =
        Number(existingInvoice.vatRate || 0) > 0 ||
        Number(existingInvoice.vatAmount || 0) > 0;
      const vRate =
        existingInvoice.vatRate !== null &&
        existingInvoice.vatRate !== undefined
          ? Number(existingInvoice.vatRate)
          : Number(existingInvoice.vatAmount || 0) > 0
            ? 5
            : 0;

      dataToUpdate.totalAmount = Number(totalAmount);
      if (hasVat && vRate > 0) {
        dataToUpdate.subtotal = Number(totalAmount) / (1 + vRate / 100);
        dataToUpdate.vatAmount = Number(totalAmount) - dataToUpdate.subtotal;
      } else {
        dataToUpdate.subtotal = Number(totalAmount);
        dataToUpdate.vatAmount = 0;
        dataToUpdate.vatRate = 0;
      }

      dataToUpdate.remainingBalance = Math.max(
        0,
        Number(totalAmount) - Number(existingInvoice.paidAmount || 0),
      );
    }

    const updated = await prisma.salesInvoice.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: true,
        customerRel: true,
        discountAccount: true,
      },
    });

    // If invoice is already posted, re-sync its General Ledger journal entry lines
    if (existingInvoice.status === "POSTED" && existingInvoice.journalEntryId) {
      await UpdatePostedInvoiceCommandHandler.execute({
        invoiceId: id,
        subtotal: Number(updated.subtotal || 0),
        discount: Number(updated.discount || 0),
        discountAccountId: updated.discountAccountId,
        vatRate: Number(updated.vatRate || 0),
        vatAmount: Number(updated.vatAmount || 0),
        totalAmount: Number(updated.totalAmount || 0),
        userId: authUser.id,
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update sales invoice" },
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

    const existing = await prisma.salesInvoice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sales invoice not found" },
        { status: 404 },
      );
    }

    if (existing.status !== "DRAFT" || existing.journalEntryId) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a posted or finalized sales invoice. In accordance with UAE FTA and accounting audit standards, posted transactions cannot be deleted. Please cancel or issue a credit note instead.",
        },
        { status: 400 },
      );
    }

    const paymentsCount = await prisma.customerPayment.count({
      where: { salesInvoiceId: id },
    });
    if (paymentsCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete invoice: Customer payment records are attached. Remove payments first.",
        },
        { status: 400 },
      );
    }

    const creditNotesCount = await prisma.creditNote.count({
      where: { salesInvoiceId: id },
    });
    if (creditNotesCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete invoice: Credit notes are linked to this invoice. Please remove or unlink credit notes first.",
        },
        { status: 400 },
      );
    }

    if (existing.journalEntryId) {
      await prisma.journalEntryLine.deleteMany({
        where: { journalEntryId: existing.journalEntryId },
      });
      await prisma.journalEntry.delete({
        where: { id: existing.journalEntryId },
      });
    }

    await prisma.salesInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete sales invoice" },
      { status: 500 },
    );
  }
}
