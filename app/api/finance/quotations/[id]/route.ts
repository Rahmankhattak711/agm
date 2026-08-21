import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
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
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch quotation", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      quotationNo,
      date,
      validUntil,
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
      vatPct = 5,
      discount = 0,
      notes,
      terms,
      paymentTerms,
      status,
      items = [],
    } = body;

    const computedSubtotal = items.reduce(
      (sum: number, it: any) => {
        if (it.isFree || String(it.qty).toLowerCase() === "free" || String(it.rate).toLowerCase() === "free") {
          return sum;
        }
        return sum + Number(it.quantity || it.qty || 0) * Number(it.unitRate || it.rate || 0);
      },
      0
    );
    const computedVat = (computedSubtotal * Number(vatPct || 0)) / 100;
    const computedTotal = computedSubtotal + computedVat - Number(discount || 0);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      const q = await tx.quotation.update({
        where: { id },
        data: {
          quotationNo: quotationNo || undefined,
          date: date || "",
          validUntil: validUntil || "",
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
            String(it.rate).toLowerCase() === "free"
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
              : Number(it.quantity || it.qty || 1) * Number(it.unitRate || it.rate || 0),
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
          items: {
            orderBy: { itemOrder: "asc" },
            include: { product: true },
          },
          createdBy: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update quotation", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete quotation", details: error.message },
      { status: 500 }
    );
  }
}
