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
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        creator: { select: { fullName: true, email: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      poNumber,
      supplierId,
      orderDate,
      expectedDate,
      status,
      notes,
      items,
    } = body;

    if (
      !poNumber?.trim() ||
      !supplierId ||
      !orderDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "PO Number, Supplier, Order Date, and at least one item are required",
        },
        { status: 400 },
      );
    }

    let totalAmount = 0;
    for (const item of items) {
      const qty = Number(item.quantityOrdered || 0);
      const cost = Number(item.unitCost || 0);
      totalAmount += qty * cost;
    }

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber.trim().toUpperCase(),
        supplierId,
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: status || "DRAFT",
        totalAmount,
        notes: notes?.trim() || null,
        createdBy: user.id,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantityOrdered: Number(item.quantityOrdered),
            unitCost: Number(item.unitCost),
            totalCost:
              Number(item.quantityOrdered) * Number(item.unitCost),
          })),
        },
      },
      include: {
        supplier: true,
        creator: { select: { fullName: true, email: true } },
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A purchase order with this PO number already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();
    const { id, status, expectedDate, notes, warehouseIdToReceive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing purchase order ID" },
        { status: 400 },
      );
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    // Ownership check: User A cannot edit User B's purchase order unless INVENTORY_MANAGER / ADMIN / SUPER_ADMIN
    if (!canModifyResource(user, existing.createdBy, ["INVENTORY_MANAGER"])) {
      return forbidden("Forbidden: You cannot edit another user's purchase order");
    }

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (expectedDate !== undefined)
          updateData.expectedDate = expectedDate
            ? new Date(expectedDate)
            : null;
        if (notes !== undefined) updateData.notes = notes?.trim() || null;

        if (
          status === "RECEIVED" &&
          warehouseIdToReceive &&
          existing.status !== "RECEIVED"
        ) {
          for (const item of existing.items) {
            const qty = Number(item.quantityOrdered);

            await tx.purchaseOrderItem.update({
              where: { id: item.id },
              data: { quantityReceived: qty },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                warehouseId: warehouseIdToReceive,
                movementType: "PURCHASE_IN",
                quantity: qty,
                unitCost: item.unitCost,
                referenceNumber: existing.poNumber,
                notes: `Received from PO ${existing.poNumber}`,
                createdBy: user.id,
              },
            });

            const existingLevel = await tx.stockLevel.findUnique({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: warehouseIdToReceive,
                },
              },
            });

            if (existingLevel) {
              await tx.stockLevel.update({
                where: { id: existingLevel.id },
                data: {
                  quantityOnHand: Number(existingLevel.quantityOnHand) + qty,
                },
              });
            } else {
              await tx.stockLevel.create({
                data: {
                  productId: item.productId,
                  warehouseId: warehouseIdToReceive,
                  quantityOnHand: qty,
                },
              });
            }
          }
        }

        const po = await tx.purchaseOrder.update({
          where: { id },
          data: updateData,
          include: {
            supplier: true,
            items: { include: { product: true } },
          },
        });

        return po;
      },
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing purchase order ID" },
        { status: 400 },
      );
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, createdBy: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    // Ownership check: User A cannot delete User B's purchase order unless INVENTORY_MANAGER / ADMIN / SUPER_ADMIN
    if (!canModifyResource(user, existing.createdBy, ["INVENTORY_MANAGER"])) {
      return forbidden("Forbidden: You cannot delete another user's purchase order");
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
