import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        stockLevels: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            },
          },
        },
        _count: { select: { stockMovements: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, location } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Warehouse code and name are required" },
        { status: 400 },
      );
    }

    const created = await prisma.warehouse.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        location: location?.trim() || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating warehouse:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A warehouse with this code already exists" },
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
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing warehouse ID" },
        { status: 400 },
      );
    }

    if (data.code) data.code = data.code.trim().toUpperCase();
    if (data.name) data.name = data.name.trim();

    const updated = await prisma.warehouse.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating warehouse:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing warehouse ID" },
        { status: 400 },
      );
    }

    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
