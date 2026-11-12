import { getAuthUser, unauthorized } from "@/lib/auth-server";
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
    const bill = await prisma.supplierBill.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: true,
        items: {
          include: { product: true },
        },
        payments: true,
        journalEntry: {
          include: {
            lines: {
              include: { account: true },
            },
          },
        },
        createdBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error("GET bill error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 },
    );
  }
}
