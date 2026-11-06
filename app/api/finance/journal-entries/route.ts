import { microCache } from "@/lib/modules/accounting/cache/micro-cache";
import {
  canModifyResource,
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { NextResponse } from "next/server";
import { LedgerPostingService } from "@/lib/services/accounting/ledger-posting.service";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Accountants and Admins can create journal entries"
      );
    }

    const body = await request.json();
    let { entryNumber, entryDate, description, reference, isPosted, lines } = body;

    if (!entryDate || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: entryDate and lines are required" },
        { status: 400 }
      );
    }

    // Auto-generate SYS-MJ-x if not provided
    if (!entryNumber) {
      entryNumber = await LedgerPostingService.generateEntryNumber();
    }

    const totalDebit = lines.reduce(
      (s: number, l: any) => s + (Number(l.debit || 0) * (Number(l.fxRate) || 1)),
      0
    );
    const totalCredit = lines.reduce(
      (s: number, l: any) => s + (Number(l.credit || 0) * (Number(l.fxRate) || 1)),
      0
    );

    const diff = Math.abs(totalDebit - totalCredit);
    if (isPosted && diff > 0.001) {
      return NextResponse.json(
        {
          error: `Debits must equal credits to post. Total Debit: AED ${totalDebit.toFixed(2)}, Total Credit: AED ${totalCredit.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const resolvedCreatedBy = authUser.id;

    const linesCreateData = lines.map((l: any) => {
      const fx = Number(l.fxRate) > 0 ? Number(l.fxRate) : 1;
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);

      return {
        account: {
          connect: { id: l.accountId },
        },
        description: l.description || null,
        debit,
        credit,
        currency: l.currency || "AED",
        fxRate: fx,
        debitAed: Math.round(debit * fx * 100) / 100,
        creditAed: Math.round(credit * fx * 100) / 100,
        taxRate: Number(l.taxRate || 0),
        taxType: l.taxType || "OUT_OF_SCOPE",
        taxAmount: Number(l.taxAmount || 0),
        ...(l.projectId ? { project: { connect: { id: l.projectId } } } : {}),
        contactId: l.contactId || null,
        contactName: l.contactName || null,
        branch: l.branch || null,
        costCenter: l.costCenter || null,
      };
    });

    const created = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(entryDate),
        description,
        reference,
        isPosted: Boolean(isPosted),
        createdBy: resolvedCreatedBy,
        lines: {
          create: linesCreateData,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
            project: true,
          },
        },
        user: {
          select: { fullName: true },
        },
      },
    });

    microCache.invalidatePrefix("journal-entries:");
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const isPostedParam = searchParams.get("isPosted");
    const search = searchParams.get("search");

    const whereClause: Prisma.JournalEntryWhereInput = {};
    if (isPostedParam !== null && isPostedParam !== undefined) {
      whereClause.isPosted = isPostedParam === "true";
    }

    if (search) {
      whereClause.OR = [
        { entryNumber: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const cacheKey = `journal-entries:${isPostedParam ?? "all"}:${search ?? ""}`;
    const cached = microCache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      orderBy: { entryDate: "desc" },
      include: {
        lines: {
          include: {
            account: true,
            project: true,
          },
        },
        user: {
          select: { fullName: true },
        },
      },
    });

    microCache.set(cacheKey, entries, 45);
    return NextResponse.json(entries);
  } catch (error: any) {
    console.error("GET /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return handleUpdate(request);
}

export async function PUT(request: Request) {
  return handleUpdate(request);
}

async function handleUpdate(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const {
      id,
      entryNumber,
      entryDate,
      description,
      reference,
      isPosted,
      lines,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing journal entry id" },
        { status: 400 }
      );
    }

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: { id: true, createdBy: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    if (!canModifyResource(authUser, existing.createdBy, ["ACCOUNTANT"])) {
      return forbidden(
        "Forbidden: You cannot edit another user's journal entry"
      );
    }

    if (Array.isArray(lines) && lines.length > 0) {
      const totalDebit = lines.reduce(
        (s: number, l: any) => s + (Number(l.debit || 0) * (Number(l.fxRate) || 1)),
        0
      );
      const totalCredit = lines.reduce(
        (s: number, l: any) => s + (Number(l.credit || 0) * (Number(l.fxRate) || 1)),
        0
      );

      if (isPosted && Math.abs(totalDebit - totalCredit) > 0.001) {
        return NextResponse.json(
          { error: "Debits must equal credits to post" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updateData: any = {};
        if (entryNumber) updateData.entryNumber = entryNumber;
        if (entryDate) updateData.entryDate = new Date(entryDate);
        if (description !== undefined) updateData.description = description;
        if (reference !== undefined) updateData.reference = reference;
        if (typeof isPosted === "boolean") updateData.isPosted = isPosted;

        if (Array.isArray(lines)) {
          await tx.journalEntryLine.deleteMany({
            where: { journalEntryId: id },
          });

          updateData.lines = {
            create: lines.map((l: any) => {
              const fx = Number(l.fxRate) > 0 ? Number(l.fxRate) : 1;
              const debit = Number(l.debit || 0);
              const credit = Number(l.credit || 0);

              return {
                accountId: l.accountId,
                description: l.description || null,
                debit,
                credit,
                currency: l.currency || "AED",
                fxRate: fx,
                debitAed: Math.round(debit * fx * 100) / 100,
                creditAed: Math.round(credit * fx * 100) / 100,
                taxRate: Number(l.taxRate || 0),
                taxType: l.taxType || "OUT_OF_SCOPE",
                taxAmount: Number(l.taxAmount || 0),
                projectId: l.projectId || null,
                contactId: l.contactId || null,
                contactName: l.contactName || null,
                branch: l.branch || null,
                costCenter: l.costCenter || null,
              };
            }),
          };
        }

        return await tx.journalEntry.update({
          where: { id },
          data: updateData,
          include: {
            lines: {
              include: {
                account: true,
                project: true,
              },
            },
            user: {
              select: { fullName: true },
            },
          },
        });
      }
    );

    microCache.invalidatePrefix("journal-entries:");
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing journal entry id" },
        { status: 400 }
      );
    }

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      select: { id: true, createdBy: true, isPosted: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    if (!canModifyResource(authUser, existing.createdBy, ["ACCOUNTANT"])) {
      return forbidden("Forbidden: You cannot delete this journal entry");
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    microCache.invalidatePrefix("journal-entries:");
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    return NextResponse.json({ success: true, message: "Journal entry deleted" });
  } catch (error: any) {
    console.error("DELETE /api/journal-entries error:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry", details: error.message },
      { status: 500 }
    );
  }
}
