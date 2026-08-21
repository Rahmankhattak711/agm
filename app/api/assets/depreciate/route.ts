import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fiscalYear, createdBy } = body;

    const assets = await prisma.fixedAsset.findMany();

    const results: any[] = [];

    for (const asset of assets) {
      const agg = await prisma.depreciationSchedule.aggregate({
        where: { assetId: asset.id },
        _sum: { depreciationAmount: true },
      });
      const accumulated = Number(agg._sum.depreciationAmount || 0);
      const openingBookValue = Number(asset.cost) - accumulated;
      const rate = Number(asset.depreciationRate || 20);
      const depreciationAmount = +(openingBookValue * (rate / 100));

      if (depreciationAmount <= 0) continue;

      const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const entryNumber = `DEP-${asset.assetCode}-${fiscalYear || new Date().getFullYear()}`;
        const je = await tx.journalEntry.create({
          data: {
            entryNumber,
            entryDate: new Date(),
            description: `Depreciation for ${asset.assetName} (${fiscalYear || new Date().getFullYear()})`,
            createdBy: createdBy || "",
          },
        });

        const lines = [
          {
            journalEntryId: je.id,
            accountId: asset.deprExpenseAccountId,
            debit: depreciationAmount,
            credit: 0,
          },
          {
            journalEntryId: je.id,
            accountId: asset.accumulatedDeprAccountId,
            debit: 0,
            credit: depreciationAmount,
          },
        ];

        await tx.journalEntryLine.createMany({ data: lines });

        const schedule = await tx.depreciationSchedule.create({
          data: {
            assetId: asset.id,
            fiscalYear: fiscalYear || new Date().getFullYear(),
            openingBookValue: openingBookValue,
            depreciationAmount: depreciationAmount,
            closingBookValue: openingBookValue - depreciationAmount,
            journalEntryId: je.id,
          },
        });

        return { je, schedule };
      });

      results.push(created);
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
