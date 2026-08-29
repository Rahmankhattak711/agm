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

    const requests = await prisma.purchaseRequest.findMany({
      where: {
        AND: [
          status && status !== "ALL" ? { status: status as any } : {},
          search
            ? {
                OR: [
                  { requestNumber: { contains: search, mode: "insensitive" } },
                  { requesterName: { contains: search, mode: "insensitive" } },
                  { department: { contains: search, mode: "insensitive" } },
                  { reason: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        purchaseOrders: true,
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

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET /api/commercial/purchase-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase requests" },
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
      requestNumber,
      requesterName,
      department,
      requestDate,
      requiredDate,
      reason,
      notes,
      items = [],
    } = body;

    let reqNo = requestNumber;
    if (!reqNo) {
      const count = await prisma.purchaseRequest.count();
      reqNo = `PR-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const pr = await prisma.purchaseRequest.create({
      data: {
        requestNumber: reqNo,
        requesterName: requesterName || authUser.email || "Employee",
        department: department || "Operations / Site",
        requestDate: requestDate ? new Date(requestDate) : new Date(),
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        reason: reason || "Site Material Requisition",
        notes,
        status: "PENDING_APPROVAL",
        createdById: authUser.id,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId || null,
            description: i.description || "Material item",
            quantity: parseFloat(i.quantity) || 1,
            unit: i.unit || "PCS",
            estimatedCost: parseFloat(i.estimatedCost || i.unitCost) || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(pr, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/purchase-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase request" },
      { status: 500 },
    );
  }
}
