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

    return NextResponse.json(invoice);
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

    if (totalAmount !== undefined) {
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
