import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type JournalLine = Awaited<
  ReturnType<typeof prisma.journalEntryLine.findMany>
>[number];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const [account, lines] = await Promise.all([
      prisma.chartOfAccount.findUnique({
        where: { id: accountId },
      }),
      prisma.journalEntryLine.findMany({
        where: { accountId },
        include: {
          journalEntry: {
            include: {
              user: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: [{ journalEntry: { entryDate: "asc" } }, { id: "asc" }],
      }),
    ]);

    let runningBalance = 0;
    const isDebitNormal =
      account?.type === "ASSET" || account?.type === "EXPENSE";

    const formattedLines = lines.map((l: JournalLine) => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);

      if (isDebitNormal) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        id: l.id,
        journalEntryId: l.journalEntryId,
        accountId: l.accountId,
        debit,
        credit,
        runningBalance,
        journalEntry: {
          entryNumber: (l as any).journalEntry?.entryNumber || "—",
          entryDate: (l as any).journalEntry?.entryDate || "",
          description: (l as any).journalEntry?.description || "—",
          reference: (l as any).journalEntry?.reference || "—",
          createdByName:
            (l as any).journalEntry?.user?.fullName || "Accountant",
        },
      };
    });

    const totalDebit = lines.reduce(
      (s: number, l: JournalLine) => s + Number(l.debit || 0),
      0,
    );
    const totalCredit = lines.reduce(
      (s: number, l: JournalLine) => s + Number(l.credit || 0),
      0,
    );
    const netBalance = isDebitNormal
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

    return NextResponse.json({
      account,
      lines: formattedLines,
      totalDebit,
      totalCredit,
      balance: netBalance,
      netBalance,
      isDebitNormal,
    });
  } catch (error: any) {
    console.error("GET /api/reports/ledger error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
