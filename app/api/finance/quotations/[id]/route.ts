import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import {
  canModifyResource,
  forbidden,
  getAuthUser,
  isAdminRole,
  unauthorized,
} from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customerRel: {
          select: {
            id: true,
            customerCode: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          orderBy: { itemOrder: "asc" },
          include: {
            product: true,
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;
    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    if (!isAdminRole(authUser.role)) {
      return forbidden("Forbidden: Only Admins can update quotations");
    }

    const body = await request.json();
    const {
      quotationNo,
      date,
      validUntil,
      customerId,
      customer,
      attention,
      address,
      trn,
      mobile,
      project,
      location,
      reference,
      preparedBy,
      contact,
      vatPct = 0,
      discount = 0,
      notes,
      terms,
      paymentTerms,
      status,
      items = [],
    } = body;

    const computedSubtotal = items.reduce((sum: number, it: any) => {
      if (
        it.isFree ||
        String(it.qty).toLowerCase() === "free" ||
        String(it.rate).toLowerCase() === "free"
      ) {
        return sum;
      }
      return (
        sum +
        Number(it.quantity || it.qty || 0) * Number(it.unitRate || it.rate || 0)
      );
    }, 0);
    const computedVat = (computedSubtotal * Number(vatPct || 0)) / 100;
    const computedTotal =
      computedSubtotal + computedVat - Number(discount || 0);

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.quotationItem.deleteMany({
          where: { quotationId: id },
        });

        const q = await tx.quotation.update({
          where: { id },
          data: {
            quotationNo: quotationNo || undefined,
            date: date || "",
            validUntil: validUntil || "",
            customerId: customerId || null,
            customer: customer || "",
            attention: attention || "",
            address: address || "",
            trn: trn || "",
            mobile: mobile || "",
            project: project || "",
            location: location || "",
            reference: reference || "",
            preparedBy: preparedBy || "",
            contact: contact || "",
            vatPct: Number(vatPct || 0),
            discount: Number(discount || 0),
            subtotal: computedSubtotal,
            vatAmount: computedVat,
            totalAmount: computedTotal,
            status: status ? (status as any) : undefined,
            notes: notes || null,
            terms: terms || null,
            paymentTerms: paymentTerms || null,
          },
        });

        if (Array.isArray(items) && items.length > 0) {
          const itemRows = items.map((it: any, index: number) => {
            const isItemFree = Boolean(
              it.isFree ||
              String(it.qty).toLowerCase() === "free" ||
              String(it.rate).toLowerCase() === "free",
            );

            return {
              quotationId: id,
              productId: it.productId || null,
              section: it.section || "",
              itemOrder: index + 1,
              description: it.description || it.desc || "",
              quantity: isItemFree ? 0 : Number(it.quantity || it.qty || 1),
              unit: it.unit || "SQM",
              unitRate: isItemFree ? 0 : Number(it.unitRate || it.rate || 0),
              totalAmount: isItemFree
                ? 0
                : Number(it.quantity || it.qty || 1) *
                  Number(it.unitRate || it.rate || 0),
              isFree: isItemFree,
            };
          });

          await tx.quotationItem.createMany({
            data: itemRows,
          });
        }

        return tx.quotation.findUnique({
          where: { id },
          include: {
            customerRel: {
              select: {
                id: true,
                customerCode: true,
                name: true,
                companyName: true,
                phone: true,
                email: true,
              },
            },
            items: {
              orderBy: { itemOrder: "asc" },
              include: { product: true },
            },
            createdBy: true,
          },
        });
      },
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update quotation" },
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

    const { id } = await params;
    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    if (!isAdminRole(authUser.role)) {
      return forbidden("Forbidden: Only Admins can delete quotations");
    }

    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete quotation" },
      { status: 500 },
    );
  }
}
