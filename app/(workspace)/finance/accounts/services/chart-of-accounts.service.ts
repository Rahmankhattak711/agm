import prisma from "@/lib/prisma";
import { CreateAccountDTO, UpdateAccountDTO, HierarchicalAccount } from "../types";
import { AccountResolverService } from "./account-resolver.service";

export class ChartOfAccountsService {
  /**
   * Fetches all accounts and optionally computes rollup balances from JournalEntryLines
   */
  public static async getAllAccounts(): Promise<any[]> {
    const accounts = await prisma.chartOfAccount.findMany({
      include: {
        parent: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            level: true,
          },
        },
      },
      orderBy: { accountCode: "asc" },
    });

    // Compute line balances
    const lineAggregates = await prisma.journalEntryLine.groupBy({
      by: ["accountId"],
      where: {
        journalEntry: {
          isPosted: true,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const balanceMap = new Map<string, number>();
    lineAggregates.forEach((agg) => {
      const d = Number(agg._sum.debit || 0);
      const c = Number(agg._sum.credit || 0);
      balanceMap.set(agg.accountId, d - c);
    });

    // Attach direct balance based on normal debit/credit sign
    const accountsWithDirectBalances = accounts.map((acc) => {
      const raw = balanceMap.get(acc.id) || 0;
      let balance = raw;
      if (acc.type === "LIABILITY" || acc.type === "EQUITY" || acc.type === "REVENUE") {
        balance = -raw; // Normal credit balance
      }
      return {
        ...acc,
        balance,
      };
    });

    // Build rollup balances for parent nodes
    const childrenMap = new Map<string, string[]>();
    accounts.forEach((acc) => {
      if (acc.parentId) {
        const existing = childrenMap.get(acc.parentId) || [];
        existing.push(acc.id);
        childrenMap.set(acc.parentId, existing);
      }
    });

    const getRollupBalance = (accId: string): number => {
      const childIds = childrenMap.get(accId);
      if (!childIds || childIds.length === 0) {
        const found = accountsWithDirectBalances.find((a) => a.id === accId);
        return found ? found.balance : 0;
      }
      let sum = 0;
      for (const cid of childIds) {
        sum += getRollupBalance(cid);
      }
      return sum;
    };

    return accountsWithDirectBalances.map((acc) => {
      const hasChildren = (childrenMap.get(acc.id)?.length || 0) > 0;
      if (hasChildren) {
        return {
          ...acc,
          balance: getRollupBalance(acc.id),
        };
      }
      return acc;
    });
  }

  /**
   * Calculates the next sequential code for a new child under a parent account
   */
  public static async getNextAccountCode(parentId: string): Promise<string> {
    const parent = await prisma.chartOfAccount.findUnique({
      where: { id: parentId },
    });
    if (!parent) return "";

    const siblings = await prisma.chartOfAccount.findMany({
      where: { parentId: parent.id },
      orderBy: { accountCode: "desc" },
    });

    if (siblings.length === 0) {
      return `${parent.accountCode}1`;
    }

    // Try finding numerical suffixes
    const prefix = parent.accountCode;
    const suffixes: number[] = [];

    for (const sib of siblings) {
      if (sib.accountCode.startsWith(prefix)) {
        const suffixStr = sib.accountCode.slice(prefix.length);
        const parsed = parseInt(suffixStr, 10);
        if (!isNaN(parsed)) {
          suffixes.push(parsed);
        }
      }
    }

    if (suffixes.length > 0) {
      const maxSuffix = Math.max(...suffixes);
      return `${prefix}${maxSuffix + 1}`;
    }

    return `${prefix}${siblings.length + 1}`;
  }

  /**
   * Creates an account with systematic validation and role guard
   */
  public static async createAccount(dto: CreateAccountDTO, isSuperAdmin = false) {
    if (!dto.accountCode || !dto.accountName || !dto.type) {
      throw new Error("Missing required fields: accountCode, accountName, type");
    }

    if (!dto.parentId) {
      throw new Error("A parent Group (Level 2) or Sub-group (Level 3) is required. Root categories cannot be created.");
    }

    const parent = await prisma.chartOfAccount.findUnique({
      where: { id: dto.parentId },
    });

    if (!parent) {
      throw new Error("Selected parent account not found.");
    }

    if (parent.level === 1) {
      throw new Error("Cannot create accounts directly under Level 1 root categories. Please select a Level 2 Group or Level 3 Sub-group.");
    }

    const targetLevel = (parent.level || 1) + 1;
    const resolvedType = parent.type;

    if (targetLevel <= 2 && !isSuperAdmin) {
      throw new Error(`Level ${targetLevel} accounts are locked. Only Super Admin can create them.`);
    }

    const existing = await prisma.chartOfAccount.findUnique({
      where: { accountCode: dto.accountCode.trim() },
    });

    if (existing) {
      throw new Error(`Account code "${dto.accountCode}" already exists.`);
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        accountCode: dto.accountCode.trim(),
        accountName: dto.accountName.trim(),
        nameAr: dto.nameAr?.trim() || null,
        type: resolvedType,
        level: targetLevel,
        parentId: parent.id,
        isActive: dto.isActive ?? true,
        cashFlowType: dto.cashFlowType || parent.cashFlowType || "Operating",
        enablePayments: Boolean(dto.enablePayments),
        showInExpenseClaims: Boolean(dto.showInExpenseClaims),
        accountSubtype: dto.accountSubtype || null,
        allowPosting: targetLevel >= 3,
      },
      include: {
        parent: true,
      },
    });

    AccountResolverService.clearCache();
    return created;
  }

  /**
   * Updates an existing account
   */
  public static async updateAccount(id: string, dto: UpdateAccountDTO, isSuperAdmin = false) {
    const existing = await prisma.chartOfAccount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Account not found");
    }

    if (existing.level === 1) {
      throw new Error("Level 1 root categories cannot be edited.");
    }

    if (existing.level === 2 && !isSuperAdmin) {
      throw new Error("Level 2 accounts can only be edited by Super Admin.");
    }

    if (dto.accountCode && dto.accountCode.trim() !== existing.accountCode) {
      const codeTaken = await prisma.chartOfAccount.findUnique({
        where: { accountCode: dto.accountCode.trim() },
      });
      if (codeTaken) {
        throw new Error(`Account code "${dto.accountCode}" is already in use.`);
      }
    }

    const updated = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        accountCode: dto.accountCode ? dto.accountCode.trim() : undefined,
        accountName: dto.accountName ? dto.accountName.trim() : undefined,
        nameAr: dto.nameAr !== undefined ? (dto.nameAr ? dto.nameAr.trim() : null) : undefined,
        accountSubtype: dto.accountSubtype !== undefined ? dto.accountSubtype : undefined,
        cashFlowType: dto.cashFlowType !== undefined ? dto.cashFlowType : undefined,
        allowPosting: dto.allowPosting !== undefined ? dto.allowPosting : undefined,
        enablePayments: dto.enablePayments !== undefined ? dto.enablePayments : undefined,
        showInExpenseClaims: dto.showInExpenseClaims !== undefined ? dto.showInExpenseClaims : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: {
        parent: true,
      },
    });

    AccountResolverService.clearCache();
    return updated;
  }

  /**
   * Deletes or deactivates an account safely
   */
  public static async deleteAccount(id: string, isSuperAdmin = false) {
    const existing = await prisma.chartOfAccount.findUnique({
      where: { id },
      include: {
        children: true,
        journalLines: { take: 1 },
      },
    });

    if (!existing) {
      throw new Error("Account not found");
    }

    if (existing.level === 1) {
      throw new Error("Level 1 root categories cannot be deleted.");
    }

    if (existing.level === 2 && !isSuperAdmin) {
      throw new Error("Level 2 accounts can only be deleted by Super Admin.");
    }

    if (existing.isSystem) {
      throw new Error("System control accounts are locked and cannot be deleted.");
    }

    if (existing.children && existing.children.length > 0) {
      throw new Error("Cannot delete an account that has sub-accounts. Please delete or reassign child accounts first.");
    }

    // If account has journal transactions, safely deactivate it instead of hard delete
    if (existing.journalLines && existing.journalLines.length > 0) {
      const deactivated = await prisma.chartOfAccount.update({
        where: { id },
        data: { isActive: false },
      });
      AccountResolverService.clearCache();
      return { status: "DEACTIVATED", account: deactivated };
    }

    const deleted = await prisma.chartOfAccount.delete({
      where: { id },
    });

    AccountResolverService.clearCache();
    return { status: "DELETED", account: deleted };
  }
}
