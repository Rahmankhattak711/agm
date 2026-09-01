import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
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
    const body = await request.json().catch(() => ({}));
    const { supplierId } = body;

    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!pr) {
      return NextResponse.json(
        { error: "Purchase Request not found" },
        { status: 404 },
      );
    }

    let supId = supplierId;
    if (!supId) {
      const firstSupplier = await prisma.supplier.findFirst({
        where: { isActive: true },
      });
      supId = firstSupplier?.id;
    }

    if (!supId) {
      return NextResponse.json(
        { error: "A valid supplier is required to convert to Purchase Order" },
        { status: 400 },
      );
    }

    const poCount = await prisma.purchaseOrder.count();
    const poNumber = `PO-2026-${(poCount + 1).toString().padStart(4, "0")}`;

    let totalAmount = 0;
    const poItems = [];

    for (const item of pr.items) {
      let prodId = item.productId;
      if (!prodId) {
        const existingProd = await prisma.product.findFirst({
          where: { isActive: true },
        });
        if (existingProd) prodId = existingProd.id;
      }

      if (prodId) {
        const qty = Number(item.quantity);
        const cost = Number(item.estimatedCost) || 100;
        const lineTotal = qty * cost;
        totalAmount += lineTotal;

        poItems.push({
          productId: prodId,
          quantityOrdered: qty,
          quantityReceived: 0,
          unitCost: cost,
          totalCost: lineTotal,
        });
      }
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supId,
        purchaseRequestId: pr.id,
        orderDate: new Date(),
        status: "ORDERED",
        totalAmount,
        notes: `Converted from PR: ${pr.requestNumber} - ${pr.reason}`,
        createdBy: authUser.id,
        items: {
          create: poItems,
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    await prisma.purchaseRequest.update({
      where: { id },
      data: { status: "CONVERTED" },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST convert purchase request to PO error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert purchase request to PO" },
      { status: 500 },
    );
  }
}
