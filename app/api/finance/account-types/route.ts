import {
  getAuthUser,
  unauthorized,
  hasRole,
  forbidden,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_ACCOUNT_SUBTYPES } from "./defaults";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};
    if (typeFilter && ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].includes(typeFilter.toUpperCase())) {
      where.type = typeFilter.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let subtypes = await prisma.accountSubtype.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // If completely empty and no search/type filter, auto-seed defaults so system is never empty
    if (subtypes.length === 0 && !search && !typeFilter) {
      const totalInDb = await prisma.accountSubtype.count();
      if (totalInDb === 0) {
        for (const item of DEFAULT_ACCOUNT_SUBTYPES) {
          await prisma.accountSubtype.create({
            data: {
              name: item.name,
              nameAr: item.nameAr || null,
              type: item.type,
              cashFlowType: item.cashFlowType,
              parentCodePrefix: item.parentCodePrefix || null,
              enablePayments: Boolean(item.enablePayments),
              showInExpenseClaims: Boolean(item.showInExpenseClaims),
              description: item.description || null,
              isSystem: false,
            },
          });
        }
        subtypes = await prisma.accountSubtype.findMany({
          orderBy: [{ type: "asc" }, { name: "asc" }],
        });
      }
    }

    // Count usage for each subtype in Chart of Accounts
    const counts = await prisma.chartOfAccount.groupBy({
      by: ["accountSubtype"],
      _count: { _all: true },
      where: {
        accountSubtype: { not: null },
      },
    });

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.accountSubtype) {
        countMap.set(c.accountSubtype.toLowerCase(), c._count._all);
      }
    }

    const result = subtypes.map((st) => ({
      ...st,
      usageCount: countMap.get(st.name.toLowerCase()) || 0,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/finance/account-types error, falling back to defaults:", error);
    return NextResponse.json(
      DEFAULT_ACCOUNT_SUBTYPES.map((st) => ({
        ...st,
        id: st.name.toLowerCase().replace(/\s+/g, "-"),
        usageCount: 0,
      })),
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden("Forbidden: Only Finance users can create account types");
    }

    const body = await request.json();

    // Check if user requested to restore default standard account types
    if (body.action === "restore-defaults" || body.seedDefaults) {
      let createdCount = 0;
      for (const item of DEFAULT_ACCOUNT_SUBTYPES) {
        const exists = await prisma.accountSubtype.findFirst({
          where: { name: { equals: item.name, mode: "insensitive" } },
        });
        if (!exists) {
          await prisma.accountSubtype.create({
            data: {
              name: item.name,
              nameAr: item.nameAr || null,
              type: item.type,
              cashFlowType: item.cashFlowType,
              parentCodePrefix: item.parentCodePrefix || null,
              enablePayments: Boolean(item.enablePayments),
              showInExpenseClaims: Boolean(item.showInExpenseClaims),
              description: item.description || null,
              isSystem: false,
            },
          });
          createdCount++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `Restored ${createdCount} standard default account types.`,
      });
    }

    const {
      name,
      nameAr,
      type,
      cashFlowType = "Operating",
      description,
      parentCodePrefix,
      enablePayments = false,
      showInExpenseClaims = false,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Account type name is required" },
        { status: 400 },
      );
    }

    if (!type || !["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Valid Account classification (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    const existing = await prisma.accountSubtype.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Account type "${trimmedName}" already exists.` },
        { status: 409 },
      );
    }

    const created = await prisma.accountSubtype.create({
      data: {
        name: trimmedName,
        nameAr: nameAr ? nameAr.trim() : null,
        type,
        cashFlowType: cashFlowType || "Operating",
        description: description ? description.trim() : null,
        parentCodePrefix: parentCodePrefix || null,
        enablePayments: Boolean(enablePayments),
        showInExpenseClaims: Boolean(showInExpenseClaims),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/finance/account-types error:", error);
    return NextResponse.json(
      { error: "Failed to create account type" },
      { status: 500 },
    );
  }
}
