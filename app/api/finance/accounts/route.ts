import { ChartOfAccountsService, AccountResolverService } from "@/app/(workspace)/finance/accounts";
import {
  forbidden,
  getAuthUser,
  hasRole,
  isSuperAdmin,
  isFinancialUser,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_ACCOUNTS = [
  {
    accountCode: "1010",
    accountName: "Petty Cash (Head Office)",
    type: "ASSET",
  },
  { accountCode: "1020", accountName: "RAK Bank Current A/C", type: "ASSET" },
  {
    accountCode: "1030",
    accountName: "Mr. MD Assem - Site Float",
    type: "ASSET",
  },
  {
    accountCode: "1200",
    accountName: "Accounts Receivable (A/R)",
    type: "ASSET",
  },
  { accountCode: "1210", accountName: "Staff Salary Advances", type: "ASSET" },
  { accountCode: "1300", accountName: "Prepaid Office Rent", type: "ASSET" },
  {
    accountCode: "1310",
    accountName: "Prepaid Staff Visa & Labor Cards",
    type: "ASSET",
  },
  {
    accountCode: "1500",
    accountName: "Office IT & Computer Equipment",
    type: "ASSET",
  },
  {
    accountCode: "1501",
    accountName: "Company Vehicle 1 (Fitout Van)",
    type: "ASSET",
  },
  {
    accountCode: "1502",
    accountName: "Company Vehicle 2 (Fitout Van)",
    type: "ASSET",
  },
  {
    accountCode: "1503",
    accountName: "Company Vehicle 3 (Site Pickup)",
    type: "ASSET",
  },
  {
    accountCode: "1504",
    accountName: "Company Vehicle 4 (Executive Car)",
    type: "ASSET",
  },
  {
    accountCode: "1520",
    accountName: "Office Furniture & Fixtures",
    type: "ASSET",
  },
  {
    accountCode: "1521",
    accountName: "Office Printing Machinery",
    type: "ASSET",
  },
  {
    accountCode: "1599",
    accountName: "Other Fixed Assets & Tools",
    type: "ASSET",
  },

  {
    accountCode: "2000",
    accountName: "Accounts Payable (A/P)",
    type: "LIABILITY",
  },
  {
    accountCode: "2100",
    accountName: "Accrued Staff Salaries & Wages",
    type: "LIABILITY",
  },
  {
    accountCode: "2200",
    accountName: "VAT Input Tax (5% Recoverable)",
    type: "LIABILITY",
  },
  {
    accountCode: "2210",
    accountName: "VAT Output Tax (5% Collected)",
    type: "LIABILITY",
  },
  {
    accountCode: "2220",
    accountName: "FTA Net VAT Payable / (Refund)",
    type: "LIABILITY",
  },

  {
    accountCode: "3000",
    accountName: "Managing Partner Capital",
    type: "EQUITY",
  },
  {
    accountCode: "3100",
    accountName: "Retained Earnings / Current Year Profit",
    type: "EQUITY",
  },

  {
    accountCode: "4000",
    accountName: "Fitout Contracting & Turnkey Revenue",
    type: "REVENUE",
  },
  {
    accountCode: "4010",
    accountName: "Supplier Early Settlement Discounts",
    type: "REVENUE",
  },
  {
    accountCode: "4020",
    accountName: "Other Operating & Scrap Income",
    type: "REVENUE",
  },
  {
    accountCode: "4030",
    accountName: "Design & Architectural Consulting",
    type: "REVENUE",
  },

  {
    accountCode: "5010",
    accountName: "Direct Raw Materials Procurement (COGS)",
    type: "EXPENSE",
  },
  {
    accountCode: "5000",
    accountName: "Permanent Staff Salaries",
    type: "EXPENSE",
  },
  {
    accountCode: "5001",
    accountName: "Direct Site Labor & Wages",
    type: "EXPENSE",
  },
  {
    accountCode: "5002",
    accountName: "Staff Visa & Labor Ministry Fees",
    type: "EXPENSE",
  },
  {
    accountCode: "5003",
    accountName: "End of Service Indemnity Provision",
    type: "EXPENSE",
  },
  {
    accountCode: "5004",
    accountName: "Leave Salary & Travel Allowance",
    type: "EXPENSE",
  },
  {
    accountCode: "5100",
    accountName: "Office & Workshop Rent Expense",
    type: "EXPENSE",
  },
  {
    accountCode: "5200",
    accountName: "Fixed Assets Depreciation Expense",
    type: "EXPENSE",
  },
  {
    accountCode: "5300",
    accountName: "Site Waste Management & Debris Disposal",
    type: "EXPENSE",
  },
  {
    accountCode: "5310",
    accountName: "Vehicle Maintenance, Fuel & Servicing",
    type: "EXPENSE",
  },
  {
    accountCode: "5320",
    accountName: "Bank Charges & POS Card Fees",
    type: "EXPENSE",
  },
  {
    accountCode: "5330",
    accountName: "Commercial Client Discounts Allowed",
    type: "EXPENSE",
  },
  {
    accountCode: "5340",
    accountName: "Etisalat / DU Telecom & Internet",
    type: "EXPENSE",
  },
  {
    accountCode: "5360",
    accountName: "Staff Meals & Hospitality Expense",
    type: "EXPENSE",
  },
  {
    accountCode: "5370",
    accountName: "Staff Medical Insurance & Health Cards",
    type: "EXPENSE",
  },
  {
    accountCode: "5380",
    accountName: "Office Stationery & Printing Supplies",
    type: "EXPENSE",
  },
  {
    accountCode: "5390",
    accountName: "Municipality Parking & Permit Fees",
    type: "EXPENSE",
  },
  {
    accountCode: "5400",
    accountName: "Vehicle Petrol & Fuel Cards",
    type: "EXPENSE",
  },
  { accountCode: "5430", accountName: "Salik Toll Charges", type: "EXPENSE" },
  {
    accountCode: "5440",
    accountName: "General Commercial & CAR Insurance",
    type: "EXPENSE",
  },
];

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const nextCodeForParent = searchParams.get("nextCodeForParent");
    if (nextCodeForParent) {
      const nextCode = await ChartOfAccountsService.getNextAccountCode(nextCodeForParent);
      return NextResponse.json({ nextCode });
    }

    const totalCount = await prisma.chartOfAccount.count();
    if (totalCount === 0) {
      await prisma.chartOfAccount.createMany({
        data: DEFAULT_ACCOUNTS.map((a) => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          type: a.type as any,
          isActive: true,
        })),
      });
    }

    const includeInactive = searchParams.get("includeInactive") === "true";

    let accounts = await prisma.chartOfAccount.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
        children: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            type: true,
          },
        },
        journalLines: {
          select: {
            debit: true,
            credit: true,
          },
        },
        _count: {
          select: {
            journalLines: true,
          },
        },
      },
      orderBy: { accountCode: "asc" },
    });

    const enrichedAccounts = accounts.map((acc) => {
      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of acc.journalLines) {
        totalDebit += Number(line.debit || 0);
        totalCredit += Number(line.credit || 0);
      }

      let netBalance = 0;
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        netBalance = totalDebit - totalCredit;
      } else {
        netBalance = totalCredit - totalDebit;
      }

      const isSystem = acc.level === 1;

      const { journalLines, ...rest } = acc;

      return {
        ...rest,
        totalDebit,
        totalCredit,
        balance: netBalance,
        isSystem,
      };
    });

    // Rollup balances for parent / group accounts (Level 1, 2, 3)
    const accountMap = new Map();
    enrichedAccounts.forEach((acc) => {
      accountMap.set(acc.id, { id: acc.id, balance: acc.balance, childrenIds: [] });
    });

    enrichedAccounts.forEach((acc) => {
      if (acc.parentId && accountMap.has(acc.parentId)) {
        accountMap.get(acc.parentId).childrenIds.push(acc.id);
      }
    });

    function getRollupBalance(id: string): number {
      const item = accountMap.get(id);
      if (!item) return 0;
      if (!item.childrenIds || item.childrenIds.length === 0) {
        return item.balance;
      }
      let sum = item.balance;
      for (const childId of item.childrenIds) {
        sum += getRollupBalance(childId);
      }
      return sum;
    }

    const finalAccounts = enrichedAccounts.map((acc) => {
      const item = accountMap.get(acc.id);
      if (item && item.childrenIds && item.childrenIds.length > 0) {
        return {
          ...acc,
          balance: getRollupBalance(acc.id),
        };
      }
      return acc;
    });

    return NextResponse.json(finalAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const isSuper = isSuperAdmin(authUser);
    const isFinancial = isFinancialUser(authUser);

    if (!isFinancial) {
      return forbidden(
        "Forbidden: Only authorized Financial users or Super Admin can create accounts",
      );
    }

    const body = await request.json();
    const {
      accountCode,
      accountName,
      nameAr,
      type,
      parentId,
      isActive,
      cashFlowType,
      enablePayments,
      showInExpenseClaims,
      accountSubtype,
    } = body;

    if (!accountCode || !accountName || !type) {
      return NextResponse.json(
        { error: "Missing required fields: accountCode, accountName, type" },
        { status: 400 },
      );
    }

    if (!parentId) {
      return NextResponse.json(
        { error: "A parent Group (Level 2) or Sub-group (Level 3) is required. Root categories cannot be created." },
        { status: 400 },
      );
    }

    const parentAcc = await prisma.chartOfAccount.findUnique({
      where: { id: parentId },
    });

    if (!parentAcc) {
      return NextResponse.json(
        { error: "Selected parent account not found." },
        { status: 400 },
      );
    }

    // Disallow creating direct children under Level 1 categories
    if (parentAcc.level === 1) {
      return NextResponse.json(
        { error: "Cannot create accounts directly under Level 1 root categories (Assets, Liabilities, Equity, etc.). Please select a Level 2 Group or Level 3 Sub-group." },
        { status: 400 },
      );
    }

    const targetLevel = (parentAcc.level || 1) + 1;
    const resolvedType = parentAcc.type; // Inherit parent category type

    // Role Enforcement for Levels:
    // Only Super Admin can create Level 2 accounts
    if (targetLevel <= 2 && !isSuper) {
      return forbidden(
        `Forbidden: Level ${targetLevel} accounts are locked. Only Super Admin can create them.`,
      );
    }

    const existing = await prisma.chartOfAccount.findUnique({
      where: { accountCode: accountCode.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Account code ${accountCode} already exists.` },
        { status: 409 },
      );
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        nameAr: nameAr ? nameAr.trim() : null,
        type: resolvedType,
        level: targetLevel,
        parentId: parentId || null,
        isActive: isActive ?? true,
        cashFlowType: cashFlowType || "Operating",
        enablePayments: Boolean(enablePayments),
        showInExpenseClaims: Boolean(showInExpenseClaims),
        accountSubtype: accountSubtype || null,
        allowPosting: targetLevel >= 3,
      },
      include: {
        parent: true,
      },
    });

    AccountResolverService.clearCache();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}