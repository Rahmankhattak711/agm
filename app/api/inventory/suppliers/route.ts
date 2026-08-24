import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            products: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "INVENTORY_MANAGER")) {
      return forbidden(
        "Forbidden: Only Inventory Managers and Admins can create suppliers",
      );
    }

    const body = await request.json();
    const { supplierCode, name, contactPerson, phone, email, address, trn } =
      body;

    if (!supplierCode?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Supplier code and name are required" },
        { status: 400 },
      );
    }

    const created = await prisma.supplier.create({
      data: {
        supplierCode: supplierCode.trim().toUpperCase(),
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        trn: trn?.trim() || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A supplier with this code already exists" },
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
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "INVENTORY_MANAGER")) {
      return forbidden(
        "Forbidden: Only Inventory Managers and Admins can update suppliers",
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing supplier ID" },
        { status: 400 },
      );
    }

    if (data.supplierCode)
      data.supplierCode = data.supplierCode.trim().toUpperCase();
    if (data.name) data.name = data.name.trim();

    const updated = await prisma.supplier.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "INVENTORY_MANAGER")) {
      return forbidden(
        "Forbidden: Only Inventory Managers and Admins can delete suppliers",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing supplier ID" },
        { status: 400 },
      );
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
