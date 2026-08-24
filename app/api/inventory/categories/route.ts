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

    const categories = await prisma.productCategory.findMany({
      include: {
        parent: true,
        children: true,
        inventoryAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        cogsAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
        "Forbidden: Only Inventory Managers and Admins can create categories",
      );
    }

    const body = await request.json();
    const { name, parentId, inventoryAccountId, cogsAccountId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const created = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        inventoryAccountId: inventoryAccountId || null,
        cogsAccountId: cogsAccountId || null,
      },
      include: {
        parent: true,
        inventoryAccount: true,
        cogsAccount: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists" },
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
        "Forbidden: Only Inventory Managers and Admins can update categories",
      );
    }

    const body = await request.json();
    const { id, name, parentId, inventoryAccountId, cogsAccountId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing category ID" },
        { status: 400 },
      );
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (parentId !== undefined) data.parentId = parentId || null;
    if (inventoryAccountId !== undefined)
      data.inventoryAccountId = inventoryAccountId || null;
    if (cogsAccountId !== undefined) data.cogsAccountId = cogsAccountId || null;

    const updated = await prisma.productCategory.update({
      where: { id },
      data,
      include: {
        parent: true,
        inventoryAccount: true,
        cogsAccount: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating category:", error);
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
        "Forbidden: Only Inventory Managers and Admins can delete categories",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing category ID" },
        { status: 400 },
      );
    }

    await prisma.productCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
