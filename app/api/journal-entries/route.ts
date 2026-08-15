import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entryNumber, entryDate, description, reference, createdBy, lines } =
      body;

    if (
      !entryNumber ||
      !entryDate ||
      !createdBy ||
      !Array.isArray(lines) ||
      lines.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const totalDebit = lines.reduce(
      (s: number, l: any) => s + Number(l.debit || 0),
      0,
    );
    const totalCredit = lines.reduce(
      (s: number, l: any) => s + Number(l.credit || 0),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      return NextResponse.json(
        { error: "Debits must equal credits" },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(entryDate),
          description,
          reference,
          createdBy,
        },
      });

      const linesData = lines.map((l: any) => ({
        journalEntryId: je.id,
        accountId: l.accountId,
        debit: l.debit || 0,
        credit: l.credit || 0,
      }));

      await tx.journalEntryLine.createMany({ data: linesData });

      return tx.journalEntry.findUnique({
        where: { id: je.id },
        include: { lines: true },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: { entryDate: "desc" },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        user: {
          select: { fullName: true },
        },
      },
    });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
