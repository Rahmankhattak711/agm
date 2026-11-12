import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { microCache } from "@/lib/modules/accounting/cache/micro-cache";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT", "HR")) {
      return forbidden(
        "Forbidden: Only Accountants, HR, and Admins can create fixed assets",
      );
    }

    const body = await request.json();
    const {
      assetCode,
      assetName,
      category = "OFFICE_EQUIPMENT",
      purchaseDate,
      cost,
      salvageValue,
      depreciationRate,
      assetAccountId,
      accumulatedDeprAccountId,
      deprExpenseAccountId,
      paymentAccountId,
      autoCapitalize = true,
      serialNumber,
      assignedTo,
      imageUrl,
      fileName,
      fileType,
      notes,
    } = body;

    if (!assetCode || !assetName || !purchaseDate || !cost) {
      return NextResponse.json(
        { error: "Asset Code, Name, Acquisition Date, and Cost are required" },
        { status: 400 },
      );
    }

    // Auto-resolve fallback accounts if not provided by user
    let finalAssetAccId = assetAccountId || null;
    let finalAccumDeprAccId = accumulatedDeprAccountId || null;
    let finalDeprExpenseAccId = deprExpenseAccountId || null;

    if (!finalAssetAccId) {
      const assetAcc = await prisma.chartOfAccount.findFirst({
        where: {
          OR: [
            { accountCode: "1213" },
            { accountCode: { startsWith: "15" } },
            { accountName: { contains: "Equipment", mode: "insensitive" } },
            { accountName: { contains: "Fixed Asset", mode: "insensitive" } },
            { type: "ASSET" },
          ],
        },
      });
      if (assetAcc) finalAssetAccId = assetAcc.id;
    }

    if (!finalAccumDeprAccId) {
      const accumAcc = await prisma.chartOfAccount.findFirst({
        where: {
          OR: [
            { accountName: { contains: "Accumulated Depreciation", mode: "insensitive" } },
            { accountCode: { startsWith: "159" } },
            { type: "ASSET" },
          ],
        },
      });
      if (accumAcc) finalAccumDeprAccId = accumAcc.id;
    }

    if (!finalDeprExpenseAccId) {
      const deprExpAcc = await prisma.chartOfAccount.findFirst({
        where: {
          OR: [
            { accountName: { contains: "Depreciation Expense", mode: "insensitive" } },
            { accountCode: { startsWith: "62" } },
            { type: "EXPENSE" },
          ],
        },
      });
      if (deprExpAcc) finalDeprExpenseAccId = deprExpAcc.id;
    }

    if (!finalAssetAccId || !finalAccumDeprAccId || !finalDeprExpenseAccId) {
      return NextResponse.json(
        { error: "Could not resolve default Chart of Accounts for Fixed Assets. Please ensure Asset and Depreciation accounts exist." },
        { status: 400 },
      );
    }

    // Auto-post double-entry Journal Entry to capitalize asset to General Ledger
    if (autoCapitalize && paymentAccountId) {
      const cleanSeq = assetCode.replace(/[^a-zA-Z0-9]/g, "").slice(-4) || Date.now().toString().slice(-4);
      const entryNumber = `JE-AST-${cleanSeq}`;
      const assetCost = Math.round(Number(cost) * 100) / 100;

      await prisma.journalEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(purchaseDate),
          reference: `Asset Capitalization: ${assetCode}`,
          description: `Acquisition & Capitalization of Fixed Asset: ${assetName} (${assetCode})`,
          isPosted: true,
          createdBy: authUser.id,
          lines: {
            create: [
              {
                accountId: finalAssetAccId,
                debit: assetCost,
                credit: 0,
                currency: "AED",
                fxRate: 1,
                debitAed: assetCost,
                creditAed: 0,
                description: `Capitalize Fixed Asset: ${assetName}`,
              },
              {
                accountId: paymentAccountId,
                debit: 0,
                credit: assetCost,
                currency: "AED",
                fxRate: 1,
                debitAed: 0,
                creditAed: assetCost,
                description: `Payment source for Asset: ${assetCode}`,
              },
            ],
          },
        },
      });
    }

    const created = await prisma.fixedAsset.create({
      data: {
        assetCode,
        assetName,
        category: category as any,
        purchaseDate: new Date(purchaseDate),
        cost: Number(cost),
        salvageValue: salvageValue ? Number(salvageValue) : 0,
        depreciationRate: depreciationRate ? Number(depreciationRate) : 20.0,
        assetAccountId: finalAssetAccId,
        accumulatedDeprAccountId: finalAccumDeprAccId,
        deprExpenseAccountId: finalDeprExpenseAccId,
        assignedTo: assignedTo || null,
        registrationNumber: serialNumber || null,
      },
      include: {
        schedules: true,
        assetAccount: true,
        accumulatedDeprAccount: true,
        deprExpenseAccount: true,
      },
    });

    if (imageUrl || fileName || fileType || notes) {
      await prisma.$executeRaw`
        UPDATE fixed_assets
        SET image_url = ${imageUrl || null},
            file_name = ${fileName || null},
            file_type = ${fileType || null},
            notes = ${notes || null}
        WHERE id = ${created.id}::uuid
      `;
    }

    // Invalidate accounting report caches so Balance Sheet & Trial Balance update immediately
    microCache.invalidatePrefix("assets:");
    microCache.invalidatePrefix("bs:");
    microCache.invalidatePrefix("tb:");

    return NextResponse.json(
      {
        ...created,
        imageUrl: imageUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        notes: notes || null,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/assets error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const cacheKey = "assets:all";
    const cached = microCache.get<any>(cacheKey);
    if (cached && !forceRefresh) {
      return NextResponse.json(cached);
    }

    const assets = await prisma.fixedAsset.findMany({
      orderBy: { purchaseDate: "desc" },
      include: {
        schedules: true,
        assetAccount: { select: { accountCode: true, accountName: true } },
        accumulatedDeprAccount: { select: { accountCode: true, accountName: true } },
        deprExpenseAccount: { select: { accountCode: true, accountName: true } },
      },
    });

    const extraRows = await prisma.$queryRaw<
      Array<{
        id: string;
        image_url: string | null;
        file_name: string | null;
        file_type: string | null;
        notes: string | null;
      }>
    >`SELECT id::text, image_url, file_name, file_type, notes FROM fixed_assets`;

    const extraMap = new Map(extraRows.map((r) => [r.id, r]));
    const enrichedAssets = assets.map((a) => {
      const extra = extraMap.get(a.id);
      return {
        ...a,
        imageUrl: extra?.image_url ?? null,
        fileName: extra?.file_name ?? null,
        fileType: extra?.file_type ?? null,
        notes: extra?.notes ?? null,
      };
    });

    microCache.set(cacheKey, enrichedAssets, 45);
    return NextResponse.json(enrichedAssets);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
