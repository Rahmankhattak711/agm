import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { AccountResolverService } from "@/app/(workspace)/finance/accounts";
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

    const isSystem = account.level === 1;

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
    const { accountCode, accountName, nameAr, type, parentId, accountSubtype, cashFlowType, allowPosting, enablePayments, showInExpenseClaims, level, isActive } = body;

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
        accountSubtype: accountSubtype !== undefined ? (accountSubtype?.trim() || null) : (existing as any).accountSubtype,
        cashFlowType: cashFlowType ?? (existing as any).cashFlowType ?? "Operating",
        allowPosting: allowPosting !== undefined ? allowPosting : (existing as any).allowPosting ?? true,
        enablePayments: enablePayments !== undefined ? enablePayments : (existing as any).enablePayments ?? false,
        showInExpenseClaims: showInExpenseClaims !== undefined ? showInExpenseClaims : (existing as any).showInExpenseClaims ?? false,
        level: level ?? existing.level,
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
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden("Forbidden: Only Finance users or Admins can delete accounts");
    }

    const { id } = await params;

    const account = await prisma.chartOfAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // ONLY Level 1 Root Categories (1 Assets, 2 Liabilities, etc.) cannot be deleted
    if (account.level === 1) {
      return NextResponse.json(
        {
          error:
            "Level 1 Root categories (Assets, Liabilities, Equity, Revenue, Expenses) are protected and cannot be deleted.",
        },
        { status: 400 },
      );
    }

    // Check if account or any of its sub-accounts have journal entry lines
    async function collectAllDescendantIds(targetId: string): Promise<string[]> {
      const children = await prisma.chartOfAccount.findMany({
        where: { parentId: targetId },
        select: { id: true },
      });
      let ids = [targetId];
      for (const child of children) {
        const subIds = await collectAllDescendantIds(child.id);
        ids = ids.concat(subIds);
      }
      return ids;
    }

    const allTargetIds = await collectAllDescendantIds(id);
    const existingLinesCount = await prisma.journalEntryLine.count({
      where: { accountId: { in: allTargetIds } },
    });

    if (existingLinesCount > 0) {
      return NextResponse.json(
        {
          error:
            `Cannot delete "${account.accountName}". It or its sub-accounts have ${existingLinesCount} journal transaction(s) recorded in the General Ledger. Deleting it would corrupt financial reports. Please deactivate it instead.`,
        },
        { status: 400 },
      );
    }

    // Safe deletion recursive helper for unused accounts
    async function deleteAccountRecursive(targetId: string) {
      const children = await prisma.chartOfAccount.findMany({
        where: { parentId: targetId },
        select: { id: true },
      });

      for (const child of children) {
        await deleteAccountRecursive(child.id);
      }

      await prisma.salesInvoice.updateMany({
        where: { discountAccountId: targetId },
        data: { discountAccountId: null },
      });

      await prisma.chartOfAccount.delete({
        where: { id: targetId },
      });
    }

    await deleteAccountRecursive(id);

    AccountResolverService.clearCache();

    return NextResponse.json({ message: "Account deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
