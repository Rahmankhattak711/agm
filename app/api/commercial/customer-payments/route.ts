import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { RecordCustomerPaymentCommandHandler } from "@/lib/modules/accounting";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.customerPayment.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { receiptNumber: { contains: search, mode: "insensitive" } },
                  { customerName: { contains: search, mode: "insensitive" } },
                  {
                    referenceNumber: { contains: search, mode: "insensitive" },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        customerRel: true,
        salesInvoice: true,
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

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("GET /api/commercial/customer-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer payments" },
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
      customerId,
      customerName,
      salesInvoiceId,
      paymentDate,
      amount,
      paymentMethod = "BANK_TRANSFER",
      referenceNumber,
      notes,
      settlementDiscount,
      discountAccountId,
    } = body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 },
      );
    }

    const payment = await RecordCustomerPaymentCommandHandler.execute({
      salesInvoiceId,
      customerId,
      customerName,
      amount: payAmount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
      settlementDiscount: settlementDiscount ? parseFloat(settlementDiscount) : 0,
      discountAccountId: discountAccountId || null,
      userId: authUser.id,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/customer-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record customer payment" },
      { status: 500 },
    );
  }
}
