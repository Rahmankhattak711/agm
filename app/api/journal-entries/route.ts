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

    let resolvedCreatedBy = createdBy;

    // Verify if createdBy exists, or fallback to first available user
    const existingUser = resolvedCreatedBy
      ? await prisma.user.findUnique({ where: { id: resolvedCreatedBy } })
      : null;

    if (!existingUser) {
      const fallbackUser = await prisma.user.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (fallbackUser) {
        resolvedCreatedBy = fallbackUser.id;
      } else {
        return NextResponse.json(
          { error: "No active user found to assign createdBy" },
          { status: 400 },
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(entryDate),
          description: description || null,
          reference: reference || null,
          createdBy: resolvedCreatedBy,
        },
      });

      const linesData = lines.map((l: any) => ({
        journalEntryId: je.id,
        accountId: l.accountId,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }));

      await tx.journalEntryLine.createMany({ data: linesData });

      return tx.journalEntry.findUnique({
        where: { id: je.id },
        include: {
          lines: {
            include: { account: true },
          },
          user: {
            select: { fullName: true },
          },
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry", details: error.message },
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, entryNumber, entryDate, description, reference, isPosted, lines } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing journal entry id" },
        { status: 400 },
      );
    }

    if (Array.isArray(lines) && lines.length > 0) {
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
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (entryNumber) updateData.entryNumber = entryNumber;
      if (entryDate) updateData.entryDate = new Date(entryDate);
      if (description !== undefined) updateData.description = description;
      if (reference !== undefined) updateData.reference = reference;
      if (typeof isPosted === "boolean") updateData.isPosted = isPosted;

      await tx.journalEntry.update({
        where: { id },
        data: updateData,
      });

      if (Array.isArray(lines) && lines.length > 0) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: id },
        });

        const linesData = lines.map((l: any) => ({
          journalEntryId: id,
          accountId: l.accountId,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        }));

        await tx.journalEntryLine.createMany({ data: linesData });
      }

      return tx.journalEntry.findUnique({
        where: { id },
        include: {
          lines: {
            include: { account: true },
          },
          user: {
            select: { fullName: true },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing journal entry id" },
        { status: 400 },
      );
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
