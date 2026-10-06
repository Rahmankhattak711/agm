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

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
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
        journalEntry: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Sales invoice not found" },
        { status: 404 },
      );
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const itemsSum = invoice.items?.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );

    let subtotal = Number(invoice.subtotal || 0);
    let vatAmount = Number(invoice.vatAmount || 0);
    let totalAmount = Number(invoice.totalAmount || 0);
    const discount = Number(invoice.discount || 0);
    const vatRate = invoice.vatRate !== undefined && invoice.vatRate !== null ? Number(invoice.vatRate) : 0;

    if (itemsSum && itemsSum > 0) {
      subtotal = round2(itemsSum);
      const net = Math.max(0, subtotal - discount);
      vatAmount = 0;
      totalAmount = round2(net);
    }

    const paidAmount = Number(invoice.paidAmount || 0);
    const remainingBalance = Math.max(0, round2(totalAmount - paidAmount));

    return NextResponse.json({
      ...invoice,
      subtotal,
      vatAmount,
      totalAmount,
      remainingBalance,
    });
  } catch (error: any) {
    console.error("GET /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales invoice" },
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
      dueDate,
      projectScope,
      customerName,
      customerTrn,
      totalAmount,
    } = body;

    const dataToUpdate: any = {
      terms: terms !== undefined ? terms : undefined,
      notes: notes !== undefined ? notes : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      projectScope: projectScope !== undefined ? projectScope : undefined,
      customerName: customerName !== undefined ? customerName : undefined,
      customerTrn: customerTrn !== undefined ? customerTrn : undefined,
    };

    if (totalAmount !== undefined && terms === undefined) {
      dataToUpdate.totalAmount = Number(totalAmount);
      dataToUpdate.subtotal = Number(totalAmount) / 1.05;
      dataToUpdate.vatAmount = Number(totalAmount) - dataToUpdate.subtotal;

      const existingInvoice = await prisma.salesInvoice.findUnique({
        where: { id },
      });
      if (existingInvoice) {
        dataToUpdate.remainingBalance =
          Number(totalAmount) - Number(existingInvoice.paidAmount || 0);
      }
    }

    const updated = await prisma.salesInvoice.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: true,
        customerRel: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sales invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN"])) {
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

    if (existing.status !== "DRAFT" && existing.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only draft or cancelled invoices can be deleted" },
        { status: 400 },
      );
    }

    await prisma.salesInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/commercial/sales-invoices/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sales invoice" },
      { status: 500 },
    );
  }
}
