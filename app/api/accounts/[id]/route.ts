import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        journalLines: {
          include: {
            journalEntry: {
              select: {
                id: true,
                entryNumber: true,
                entryDate: true,
                description: true,
                reference: true,
                isPosted: true,
              },
            },
          },
          orderBy: {
            journalEntry: {
              entryDate: "asc",
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let runningBalance = 0;
    const ledger = account.journalLines.map((line) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (account.type === "ASSET" || account.type === "EXPENSE") {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        id: line.id,
        journalEntryId: line.journalEntryId,
        entryNumber: line.journalEntry.entryNumber,
        entryDate: line.journalEntry.entryDate,
        description: line.journalEntry.description,
        reference: line.journalEntry.reference,
        isPosted: line.journalEntry.isPosted,
        debit,
        credit,
        runningBalance,
      };
    });

    const isSystem = [
      "1010",
      "1020",
      "1200",
      "2000",
      "2200",
      "2210",
      "2220",
      "3000",
      "3100",
      "4000",
      "5010",
    ].includes(account.accountCode);

    return NextResponse.json({
      id: account.id,
      accountCode: account.accountCode,
      accountName: account.accountName,
      type: account.type,
      isActive: account.isActive,
      parentId: account.parentId,
      parent: account.parent,
      children: account.children,
      isSystem,
      balance: runningBalance,
      ledger,
    });
  } catch (error) {
    console.error("Error fetching account ledger:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Accountants and Admins can modify accounts",
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { accountCode, accountName, type, parentId, isActive } = body;

    const existing = await prisma.chartOfAccount.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (accountCode && accountCode.trim() !== existing.accountCode) {
      const codeTaken = await prisma.chartOfAccount.findUnique({
        where: { accountCode: accountCode.trim() },
      });
      if (codeTaken) {
        return NextResponse.json(
          { error: `Account code ${accountCode} is already in use.` },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        accountCode: accountCode?.trim() ?? existing.accountCode,
        accountName: accountName?.trim() ?? existing.accountName,
        type: type ?? existing.type,
        parentId: parentId !== undefined ? parentId || null : existing.parentId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: {
        parent: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ADMIN")) {
      return forbidden("Forbidden: Only Admins can archive or delete accounts");
    }

    const { id } = await params;

    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journalLines: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Protected system accounts
    const isSystem = [
      "1010",
      "1020",
      "1200",
      "2000",
      "2200",
      "2210",
      "2220",
      "3000",
      "3100",
      "4000",
      "5010",
    ].includes(account.accountCode);

    if (isSystem) {
      return NextResponse.json(
        { error: "System control accounts cannot be deleted." },
        { status: 400 },
      );
    }

    // If transactions exist, soft-deactivate instead of hard deleting
    if (account._count.journalLines > 0) {
      const deactivated = await prisma.chartOfAccount.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message:
          "Account has transaction history and was archived (set to inactive).",
        account: deactivated,
      });
    }

    // If no transactions exist, permanently delete
    await prisma.chartOfAccount.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
