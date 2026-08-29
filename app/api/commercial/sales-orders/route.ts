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
    const status = searchParams.get("status") || "";

    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        AND: [
          status && status !== "ALL" ? { status: status as any } : {},
          search
            ? {
                OR: [
                  { orderNumber: { contains: search, mode: "insensitive" } },
                  { customerName: { contains: search, mode: "insensitive" } },
                  { projectScope: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        customerRel: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
        },
        salesInvoices: true,
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

    return NextResponse.json(salesOrders);
  } catch (error: any) {
    console.error("GET /api/commercial/sales-orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales orders" },
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
      orderNumber,
      customerId,
      customerName,
      quotationId,
      orderDate,
      deliveryDate,
      projectScope,
      items = [],
      discount = 0,
      notes,
      terms,
    } = body;

    if (!customerName && !customerId) {
      return NextResponse.json(
        { error: "Customer is required" },
        { status: 400 },
      );
    }

    let custName = customerName;
    if (customerId && !custName) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      if (c) custName = c.name;
    }

    let orderNo = orderNumber;
    if (!orderNo) {
      const count = await prisma.salesOrder.count();
      orderNo = `SO-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    // Calculate totals
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.unitPrice || item.unitRate) || 0;
      const itemDisc = parseFloat(item.discount) || 0;
      const total = qty * rate - itemDisc;
      subtotal += total;

      return {
        productId: item.productId || null,
        description: item.description || "Scope item",
        quantity: qty,
        unit: item.unit || "SQM",
        unitPrice: rate,
        discount: itemDisc,
        totalAmount: total,
      };
    });

    const discTotal = parseFloat(discount) || 0;
    const netSubtotal = Math.max(0, subtotal - discTotal);
    const vatRate = 5.0;
    const vatAmount = (netSubtotal * vatRate) / 100;
    const totalAmount = netSubtotal + vatAmount;

    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: orderNo,
        customerId: customerId || null,
        customerName: custName || "Valued Customer",
        quotationId: quotationId || null,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        projectScope: projectScope || "Commercial Fitout Contract",
        status: "CONFIRMED",
        subtotal: netSubtotal,
        discount: discTotal,
        vatRate,
        vatAmount,
        totalAmount,
        notes,
        terms,
        createdById: authUser.id,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: true,
        customerRel: true,
      },
    });

    // If linked to quotation, mark quotation as ACCEPTED
    if (quotationId) {
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: "ACCEPTED" },
      });
    }

    return NextResponse.json(salesOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/sales-orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sales order" },
      { status: 500 },
    );
  }
}
