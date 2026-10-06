import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import {
  canModifyResource,
  forbidden,
  getAuthUser,
  unauthorized,
} from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: "insensitive" } },
        { customer: { contains: search, mode: "insensitive" } },
        { project: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error("GET /api/finance/quotations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

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
      vatPct = 5,
      discount = 0,
      notes,
      terms,
      paymentTerms,
      status = "DRAFT",
      items = [],
    } = body;

    if (!quotationNo) {
      return NextResponse.json(
        { error: "Quotation number is required" },
        { status: 400 },
      );
    }

    if (!customerId && (!customer || !customer.trim())) {
      return NextResponse.json(
        {
          error:
            "Customer is required: You must select or create a registered customer before generating a quotation.",
        },
        { status: 400 },
      );
    }

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

    const existing = await prisma.quotation.findUnique({
      where: { quotationNo },
      select: { id: true, createdById: true },
    });

    if (
      existing &&
      !canModifyResource(authUser, existing.createdById, ["ACCOUNTANT"])
    ) {
      return forbidden(
        "Forbidden: You cannot overwrite another user's quotation",
      );
    }

    const quotation = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let qId: string;

        if (existing) {
          await tx.quotationItem.deleteMany({
            where: { quotationId: existing.id },
          });

          const updated = await tx.quotation.update({
            where: { id: existing.id },
            data: {
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
              status: status as any,
              notes: notes || null,
              terms: terms || null,
              paymentTerms: paymentTerms || null,
            },
          });
          qId = updated.id;
        } else {
          const created = await tx.quotation.create({
            data: {
              quotationNo,
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
              status: status as any,
              notes: notes || null,
              terms: terms || null,
              paymentTerms: paymentTerms || null,
              createdById: authUser.id,
            },
          });
          qId = created.id;
        }

        if (Array.isArray(items) && items.length > 0) {
          const itemRows = items.map((it: any, index: number) => {
            const isItemFree = Boolean(
              it.isFree ||
              String(it.qty).toLowerCase() === "free" ||
              String(it.rate).toLowerCase() === "free",
            );

            return {
              quotationId: qId,
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
          where: { id: qId },
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

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/finance/quotations error:", error);
    return NextResponse.json(
      { error: "Failed to save quotation", details: error.message },
      { status: 500 },
    );
  }
}
