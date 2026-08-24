import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

const INCOMING_TYPES = [
  "PURCHASE_IN",
  "ADJUSTMENT_IN",
  "TRANSFER_IN",
  "RETURN_IN",
];
const OUTGOING_TYPES = [
  "SALE_OUT",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
  "RETURN_OUT",
  "PROJECT_CONSUMPTION",
];

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");
    const movementType = searchParams.get("movementType");

    const where: any = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (movementType) where.movementType = movementType;

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        creator: { select: { fullName: true, email: true } },
      },
      orderBy: { movementDate: "desc" },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
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
    if (!hasRole(user, "INVENTORY_MANAGER")) {
      return forbidden(
        "Forbidden: Only Inventory Managers and Admins can record stock movements",
      );
    }

    const body = await request.json();
    const {
      productId,
      warehouseId,
      movementType,
      quantity,
      unitCost,
      referenceNumber,
      notes,
      movementDate,
    } = body;

    if (!productId || !warehouseId || !movementType || !quantity) {
      return NextResponse.json(
        {
          error: "Product, Warehouse, Movement Type, and Quantity are required",
        },
        { status: 400 },
      );
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const movement = await tx.stockMovement.create({
          data: {
            productId,
            warehouseId,
            movementType,
            quantity: qty,
            unitCost: unitCost !== undefined ? Number(unitCost) : null,
            referenceNumber: referenceNumber?.trim() || null,
            notes: notes?.trim() || null,
            movementDate: movementDate ? new Date(movementDate) : new Date(),
            createdBy: user.id,
          },
          include: {
            product: true,
            warehouse: true,
          },
        });

        const existingLevel = await tx.stockLevel.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId,
            },
          },
        });

        const isIncoming = INCOMING_TYPES.includes(movementType);
        const isOutgoing = OUTGOING_TYPES.includes(movementType);

        let delta = 0;
        if (isIncoming) delta = qty;
        if (isOutgoing) delta = -qty;

        if (existingLevel) {
          const newQty = Number(existingLevel.quantityOnHand) + delta;
          await tx.stockLevel.update({
            where: { id: existingLevel.id },
            data: { quantityOnHand: newQty },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              productId,
              warehouseId,
              quantityOnHand: Math.max(0, delta),
            },
          });
        }

        return movement;
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
