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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const productOrigin = searchParams.get("productOrigin");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;
    if (type) where.type = type;
    if (productOrigin) where.productOrigin = productOrigin;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { supplierSku: { contains: search, mode: "insensitive" } },
        { originCompany: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        stockLevels: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = products.map((p: (typeof products)[number]) => {
      const totalOnHand = p.stockLevels.reduce(
        (acc: number, sl: (typeof p.stockLevels)[number]) =>
          acc + Number(sl.quantityOnHand),
        0,
      );
      const isLowStock =
        Number(p.reorderLevel) > 0 && totalOnHand <= Number(p.reorderLevel);
      return {
        ...p,
        totalOnHand,
        isLowStock,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching products:", error);
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
    if (!hasRole(authUser, "INVENTORY_MANAGER") && !hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Inventory Managers, Accountants and Admins can create products",
      );
    }

    const body = await request.json();
    const {
      sku,
      name,
      description,
      type,
      unit,
      barcode,
      imageUrl,
      brand,
      supplierSku,
      originCompany,
      shopLocation,
      productOrigin,
      categoryId,
      supplierId,
      costPrice,
      sellingPrice,
      reorderLevel,
      reorderQty,
      initialWarehouseId,
      initialQuantity,
    } = body;

    if (!sku?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "SKU and Product Name are required" },
        { status: 400 },
      );
    }

    const created = await prisma.product.create({
      data: {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "RAW_MATERIAL",
        unit: unit?.trim() || "PCS",
        barcode: barcode?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        brand: brand?.trim() || null,
        supplierSku: supplierSku?.trim() || null,
        originCompany: originCompany?.trim() || null,
        shopLocation: shopLocation?.trim() || null,
        productOrigin: productOrigin || "PURCHASED_EXTERNAL",
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        costPrice: costPrice !== undefined ? Number(costPrice) : 0,
        sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : 0,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 0,
        reorderQty: reorderQty !== undefined ? Number(reorderQty) : 0,
      },
      include: {
        category: true,
        supplier: true,
        stockLevels: true,
      },
    });

    if (initialWarehouseId && initialQuantity && Number(initialQuantity) > 0) {
      await prisma.stockLevel.create({
        data: {
          productId: created.id,
          warehouseId: initialWarehouseId,
          quantityOnHand: Number(initialQuantity),
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          warehouseId: initialWarehouseId,
          movementType: "ADJUSTMENT_IN",
          quantity: Number(initialQuantity),
          unitCost: created.costPrice,
          referenceNumber: "INITIAL_STOCK",
          notes: "Initial inventory setup",
          createdBy: authUser.id,
        },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "SKU / Barcode";
      return NextResponse.json(
        { error: `A product with this ${field} already exists` },
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
        "Forbidden: Only Inventory Managers and Admins can update products",
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 },
      );
    }

    if (data.sku) data.sku = data.sku.trim().toUpperCase();
    if (data.name) data.name = data.name.trim();
    if (data.costPrice !== undefined) data.costPrice = Number(data.costPrice);
    if (data.sellingPrice !== undefined)
      data.sellingPrice = Number(data.sellingPrice);
    if (data.reorderLevel !== undefined)
      data.reorderLevel = Number(data.reorderLevel);
    if (data.reorderQty !== undefined)
      data.reorderQty = Number(data.reorderQty);

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
        stockLevels: { include: { warehouse: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating product:", error);
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
        "Forbidden: Only Inventory Managers and Admins can delete products",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 },
      );
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
