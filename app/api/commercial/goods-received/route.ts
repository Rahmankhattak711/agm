import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const grns = await prisma.goodsReceipt.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { grnNumber: { contains: search, mode: "insensitive" } },
                  {
                    deliveryNoteNumber: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  { notes: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        supplier: true,
        warehouse: true,
        purchaseOrder: true,
        items: {
          include: {
            product: true,
          },
        },
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

    return NextResponse.json(grns);
  } catch (error: any) {
    console.error("GET /api/commercial/goods-received error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goods receipts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      grnNumber,
      purchaseOrderId,
      supplierId,
      warehouseId,
      receiptDate,
      deliveryNoteNumber,
      notes,
      items = [],
    } = body;

    let supId = supplierId;
    let whId = warehouseId;

    if (purchaseOrderId && !supId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });
      if (po) supId = po.supplierId;
    }

    if (!whId) {
      const defaultWh = await prisma.warehouse.findFirst({
        where: { isActive: true },
      });
      whId = defaultWh?.id;
    }

    let grnNo = grnNumber;
    if (!grnNo) {
      const count = await prisma.goodsReceipt.count();
      grnNo = `GRN-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const recDate = receiptDate ? new Date(receiptDate) : new Date();

    // 1. Create Goods Receipt
    const grn = await prisma.goodsReceipt.create({
      data: {
        grnNumber: grnNo,
        purchaseOrderId: purchaseOrderId || null,
        supplierId: supId || null,
        warehouseId: whId || null,
        receiptDate: recDate,
        deliveryNoteNumber: deliveryNoteNumber || null,
        status: "COMPLETED",
        notes,
        createdById: authUser.id,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            quantityReceived: parseFloat(i.quantityReceived) || 1,
            quantityAccepted:
              parseFloat(i.quantityAccepted || i.quantityReceived) || 1,
            quantityDamaged: parseFloat(i.quantityDamaged) || 0,
            notes: i.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Update Inventory Stock Levels & Log Stock Movements
    for (const item of items) {
      const prodId = item.productId;
      const acceptedQty =
        parseFloat(item.quantityAccepted || item.quantityReceived) || 1;

      if (prodId && whId && acceptedQty > 0) {
        // Upsert stock level
        await prisma.stockLevel.upsert({
          where: {
            productId_warehouseId: {
              productId: prodId,
              warehouseId: whId,
            },
          },
          create: {
            productId: prodId,
            warehouseId: whId,
            quantityOnHand: acceptedQty,
          },
          update: {
            quantityOnHand: { increment: acceptedQty },
          },
        });

        // Record stock movement
        await prisma.stockMovement.create({
          data: {
            productId: prodId,
            warehouseId: whId,
            movementType: "PURCHASE_IN",
            quantity: acceptedQty,
            referenceNumber: grnNo,
            notes: `Received via GRN: ${grnNo}${deliveryNoteNumber ? ` (DN: ${deliveryNoteNumber})` : ""}`,
            createdBy: authUser.id,
          },
        });
      }

      if (purchaseOrderId && prodId) {
        const poItem = await prisma.purchaseOrderItem.findFirst({
          where: {
            purchaseOrderId,
            productId: prodId,
          },
        });

        if (poItem) {
          await prisma.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              quantityReceived: { increment: acceptedQty },
            },
          });
        }
      }
    }

    if (purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { items: true },
      });

      if (po) {
        const allReceived = po.items.every(
          (i) => Number(i.quantityReceived) >= Number(i.quantityOrdered),
        );
        const partiallyReceived = po.items.some(
          (i) => Number(i.quantityReceived) > 0,
        );

        await prisma.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: {
            status: allReceived
              ? "RECEIVED"
              : partiallyReceived
                ? "PARTIALLY_RECEIVED"
                : po.status,
          },
        });
      }
    }

    return NextResponse.json(grn, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/goods-received error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create goods receipt" },
      { status: 500 },
    );
  }
}
