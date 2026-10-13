import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getStandardAccounts } from "@/lib/commercial-accounting";
import { getAccountTransactionDetails } from "@/lib/report-helpers";
import { ProfitLossItem } from "@/lib/hooks/types";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";

type Account = Awaited<
  ReturnType<typeof prisma.chartOfAccount.findMany>
>[number];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) return forbidden();

    const std = await getStandardAccounts();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const compare = searchParams.get("compare") === "true";

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;
    let periodLabel = "All Time";

    if (customStart && customEnd) {
      const sParts = customStart.split("-").map(Number);
      const eParts = customEnd.split("-").map(Number);
      if (sParts.length === 3 && eParts.length === 3) {
        startDate = new Date(
          Date.UTC(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0, 0),
        );
        endDate = new Date(
          Date.UTC(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59, 999),
        );
      } else {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }

      const durationMs = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - durationMs);

      periodLabel = `Custom Range (${customStart} - ${customEnd})`;
    } else if (period === "daily") {
      const targetDate = customStart ? new Date(customStart) : new Date(now);
      startDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        0,
        0,
        0,
      );
      endDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
      );

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);

      periodLabel = `Daily (${startDate.toLocaleDateString("en-GB")})`;
    } else if (period === "weekly") {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday,
        0,
        0,
        0,
      );
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 7);

      periodLabel = `Weekly (${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")})`;
    } else if (period === "monthly") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      const month = customStart
        ? new Date(customStart).getMonth()
        : now.getMonth();
      startDate = new Date(year, month, 1, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);

      prevStartDate = new Date(year, month - 1, 1, 0, 0, 0);
      prevEndDate = new Date(year, month, 0, 23, 59, 59);

      periodLabel = `Monthly (${startDate.toLocaleString("default", { month: "long", year: "numeric" })})`;
    } else if (period === "quarterly" || period === "quarter") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      const month = customStart
        ? new Date(customStart).getMonth()
        : now.getMonth();
      const qMonth = Math.floor(month / 3) * 3;
      startDate = new Date(year, qMonth, 1, 0, 0, 0);
      endDate = new Date(year, qMonth + 3, 0, 23, 59, 59);

      const qNum = Math.floor(qMonth / 3) + 1;
      const prevQMonth = qMonth - 3;
      const prevYear = prevQMonth < 0 ? year - 1 : year;
      const normalizedPrevQMonth = (prevQMonth + 12) % 12;
      prevStartDate = new Date(prevYear, normalizedPrevQMonth, 1, 0, 0, 0);
      prevEndDate = new Date(prevYear, normalizedPrevQMonth + 3, 0, 23, 59, 59);

      periodLabel = `Quarter Q${qNum} (${year})`;
    } else if (period === "yearly") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);

      prevStartDate = new Date(year - 1, 0, 1, 0, 0, 0);
      prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59);

      periodLabel = `Yearly / Fiscal Year (${year})`;
    }

    const whereCondition: any = {};
    if (startDate && endDate) {
      whereCondition.journalEntry = {
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const prevWhereCondition: any = {};
    if (compare && prevStartDate && prevEndDate) {
      prevWhereCondition.journalEntry = {
        entryDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      };
    }

    const [
      accounts,
      currentLines,
      prevLines,
      invoices,
      payments,
      bills,
      expenses,
      projects,
      customers,
    ] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.findMany({
        where: whereCondition,
        include: { account: true, journalEntry: true },
      }),
      compare && prevStartDate && prevEndDate
        ? prisma.journalEntryLine.findMany({
            where: prevWhereCondition,
            include: { account: true, journalEntry: true },
          })
        : Promise.resolve([]),
      prisma.salesInvoice.findMany({
        include: {
          customerRel: {
            select: { id: true, name: true, companyName: true },
          },
        },
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.customerPayment.findMany({
        include: {
          customerRel: {
            select: { id: true, name: true, companyName: true },
          },
        },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.supplierBill.findMany({
        include: {
          supplier: {
            select: { id: true, name: true },
          },
        },
        orderBy: { billDate: "desc" },
      }),
      prisma.expense.findMany({
        select: {
          id: true,
          expenseNumber: true,
          expenseDate: true,
          category: true,
          payee: true,
          description: true,
          amount: true,
          taxAmount: true,
          reference: true,
        },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.project.findMany({
        include: {
          customer: {
            select: { id: true, name: true, companyName: true },
          },
          manager: {
            select: { id: true, fullName: true, email: true },
          },
          costs: {
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.findMany({
        include: {
          projects: {
            select: {
              id: true,
              projectCode: true,
              name: true,
              status: true,
              contractValue: true,
            },
          },
          salesInvoices: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              totalAmount: true,
              paidAmount: true,
              status: true,
            },
            orderBy: { invoiceDate: "desc" },
          },
          customerPayments: {
            select: {
              id: true,
              receiptNumber: true,
              paymentDate: true,
              amount: true,
              paymentMethod: true,
            },
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const balanceMap = new Map<string, number>();
    let hasJournalEntries = false;

    for (const l of currentLines) {
      const type = l.account?.type;
      const current = balanceMap.get(l.accountId) || 0;
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      if (debit > 0 || credit > 0) hasJournalEntries = true;

      if (type === "REVENUE") {
        balanceMap.set(l.accountId, current + credit - debit);
      } else if (type === "EXPENSE") {
        balanceMap.set(l.accountId, current + debit - credit);
      }
    }

    const subtotalInvoiced = invoices.reduce(
      (s, inv) => s + Number(inv.subtotal || 0),
      0,
    );
    const subtotalBilled = bills.reduce(
      (s, b) => s + Number(b.subtotal || 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0,
    );

    const totalProjectCosts = projects.reduce(
      (s, p) =>
        s +
        Number(p.materialCost || 0) +
        Number(p.laborCost || 0) +
        Number(p.actualCost || 0) +
        Number(p.otherExpenses || 0) +
        (p.costs || []).reduce((cs, c) => cs + Number(c.amount || 0), 0),
      0,
    );

    const totalDirectExpensesAmount = subtotalBilled + totalProjectCosts;

    const expenseAccounts = accounts.filter(
      (a: Account) => a.type === "EXPENSE",
    );

    if (!hasJournalEntries) {
      if (!balanceMap.get(std.salesRevenue.id) && subtotalInvoiced > 0) {
        balanceMap.set(std.salesRevenue.id, subtotalInvoiced);
      }

      if (
        !balanceMap.get(std.materialCost.id) &&
        totalDirectExpensesAmount > 0
      ) {
        balanceMap.set(std.materialCost.id, totalDirectExpensesAmount);
      }

      const opAccount =
        expenseAccounts.find(
          (a) =>
            a.accountCode.startsWith("6") ||
            a.accountName.toLowerCase().includes("operational") ||
            a.accountName.toLowerCase().includes("administrative") ||
            a.accountName.toLowerCase().includes("general"),
        ) || expenseAccounts[0];

      if (opAccount && totalExpenses > 0 && !balanceMap.get(opAccount.id)) {
        balanceMap.set(opAccount.id, totalExpenses);
      }
    }

    const prevBalanceMap = new Map<string, number>();
    for (const l of prevLines) {
      const type = l.account?.type;
      const current = prevBalanceMap.get(l.accountId) || 0;
      if (type === "REVENUE") {
        prevBalanceMap.set(
          l.accountId,
          current + Number(l.credit || 0) - Number(l.debit || 0),
        );
      } else if (type === "EXPENSE") {
        prevBalanceMap.set(
          l.accountId,
          current + Number(l.debit || 0) - Number(l.credit || 0),
        );
      }
    }

    const incomeAccounts = accounts.filter(
      (a: Account) => a.type === "REVENUE",
    );

    const isDirectExpense = (acc: {
      accountCode: string;
      accountName: string;
    }) => {
      const name = acc.accountName.toLowerCase();
      return (
        acc.accountCode === "5010" ||
        name.includes("purchase material") ||
        name.includes("direct material") ||
        name.includes("direct expense") ||
        name.includes("cogs") ||
        name.includes("cost of goods")
      );
    };

    const createItem = (acc: Account, section: string): ProfitLossItem => {
      const amount = Math.max(0, balanceMap.get(acc.id) || 0);
      const prevAmount = Math.max(0, prevBalanceMap.get(acc.id) || 0);
      const variance = amount - prevAmount;
      const variancePct =
        prevAmount !== 0
          ? ((amount - prevAmount) / Math.abs(prevAmount)) * 100
          : 0;

      return {
        id: acc.id,
        section,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount,
        prevAmount,
        variance,
        variancePct,
        details: getAccountTransactionDetails(
          acc,
          amount,
          currentLines,
          invoices,
          payments,
          bills,
          expenses,
          projects,
          std,
        ),
      };
    };

    const incomeItems: ProfitLossItem[] = incomeAccounts
      .map((acc: Account) => createItem(acc, "Income"))
      .filter((i) => i.amount > 0 || i.accountCode === "4000");

    const directExpenseItems: ProfitLossItem[] = expenseAccounts
      .filter(isDirectExpense)
      .map((acc: Account) => createItem(acc, "Direct Material Expense"))
      .filter((i) => i.amount > 0 || i.accountCode === "5010");

    const operatingExpenseItems: ProfitLossItem[] = expenseAccounts
      .filter((acc: Account) => !isDirectExpense(acc))
      .map((acc: Account) => createItem(acc, "Operating Expense"))
      .filter((i) => i.amount > 0);

    const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
    const totalDirectExpenses = directExpenseItems.reduce(
      (s, i) => s + i.amount,
      0,
    );
    const grossProfit = totalIncome - totalDirectExpenses;
    const totalOperatingExpenses = operatingExpenseItems.reduce(
      (s, i) => s + i.amount,
      0,
    );
    const totalExpensesCalc = totalDirectExpenses + totalOperatingExpenses;
    const netProfit = grossProfit - totalOperatingExpenses;

    const projectSummaries = projects.map((p) => {
      const pInvoices = invoices.filter(
        (inv) =>
          inv.customerId === p.customerId ||
          (inv.projectScope &&
            inv.projectScope.toLowerCase().includes(p.name.toLowerCase())),
      );

      const invoicedAmount = pInvoices.reduce(
        (s, inv) => s + Number(inv.totalAmount || 0),
        0,
      );
      const paidAmount = pInvoices.reduce(
        (s, inv) =>
          inv.status === "PAID" ? s + Number(inv.totalAmount || 0) : s,
        0,
      );

      const materialCost = Number(p.materialCost || 0);
      const laborCost = Number(p.laborCost || 0);
      const actualCost = Number(p.actualCost || 0);
      const otherExpenses = Number(p.otherExpenses || 0);
      const projectCostRecordsSum = p.costs.reduce(
        (s, c) => s + Number(c.amount || 0),
        0,
      );

      const directCost =
        materialCost +
        laborCost +
        actualCost +
        otherExpenses +
        projectCostRecordsSum;

      const contractVal = Number(p.contractValue || p.budget || 0);
      const revenue = invoicedAmount > 0 ? invoicedAmount : contractVal;
      const grossMargin = revenue - directCost;
      const marginPercent =
        revenue > 0 ? Math.round((grossMargin / revenue) * 100) : 0;

      const costsList = p.costs.map((c) => ({
        id: c.id,
        description: c.description,
        costType: c.costType,
        amount: Number(c.amount || 0),
        unitRate: c.unitRate ? Number(c.unitRate) : null,
        quantity: c.quantity ? Number(c.quantity) : null,
        date: c.date ? new Date(c.date).toISOString().split("T")[0] : "",
        reference: c.reference,
      }));

      const invoicesList = pInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toISOString().split("T")[0]
          : "",
        totalAmount: Number(inv.totalAmount || 0),
        paidAmount: Number(inv.paidAmount || 0),
        status: inv.status,
      }));

      return {
        id: p.id,
        code: p.projectCode,
        name: p.name,
        customerName:
          p.customer?.companyName || p.customer?.name || "Private Client",
        contractValue: contractVal,
        budget: Number(p.budget || 0),
        invoicedAmount,
        paidAmount,
        directCost,
        materialCost,
        laborCost,
        actualCost,
        otherExpenses,
        grossMargin,
        marginPercent,
        status: p.status,
        managerName: p.manager?.fullName || "Unassigned",
        costs: costsList,
        invoices: invoicesList,
      };
    });

    const customerSummaries = customers.map((c) => {
      const cInvoices = invoices.filter((inv) => inv.customerId === c.id);
      const cPayments = payments.filter((p) => p.customerId === c.id);

      const totalInvoicedAmount = cInvoices.reduce(
        (s, inv) => s + Number(inv.totalAmount || 0),
        0,
      );
      const totalPaidAmount = cPayments.reduce(
        (s, p) => s + Number(p.amount || 0),
        0,
      );
      const currentBalance =
        totalInvoicedAmount > 0
          ? totalInvoicedAmount - totalPaidAmount
          : Number(c.currentBalance || 0);

      const invoicesList = c.salesInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toISOString().split("T")[0]
          : "",
        totalAmount: Number(inv.totalAmount || 0),
        paidAmount: Number(inv.paidAmount || 0),
        status: inv.status,
      }));

      const paymentsList = c.customerPayments.map((pay) => ({
        id: pay.id,
        receiptNumber: pay.receiptNumber,
        paymentDate: pay.paymentDate
          ? new Date(pay.paymentDate).toISOString().split("T")[0]
          : "",
        amount: Number(pay.amount || 0),
        paymentMethod: pay.paymentMethod,
      }));

      const projectsList = c.projects.map((proj) => ({
        id: proj.id,
        code: proj.projectCode,
        name: proj.name,
        status: proj.status,
        contractValue: Number(proj.contractValue || 0),
      }));

      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName || c.name,
        phone: c.phone || "—",
        email: c.email || "—",
        totalInvoiced: totalInvoicedAmount,
        totalPaid: totalPaidAmount,
        currentBalance: Math.max(0, currentBalance),
        activeProjectsCount: c.projects.length,
        invoices: invoicesList,
        payments: paymentsList,
        projectsList,
      };
    });

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "Statement of Profit & Loss",
      period,
      periodLabel,
      startDate: startDate ? startDate.toISOString().split("T")[0] : null,
      endDate: endDate ? endDate.toISOString().split("T")[0] : null,
      prevStartDate: prevStartDate
        ? prevStartDate.toISOString().split("T")[0]
        : null,
      prevEndDate: prevEndDate ? prevEndDate.toISOString().split("T")[0] : null,
      compare,
      income: incomeItems,
      totalIncome,
      directExpenses: directExpenseItems,
      totalDirectExpenses,
      grossProfit,
      operatingExpenses: operatingExpenseItems,
      totalOperatingExpenses,
      totalExpenses: totalExpensesCalc,
      netProfit,
      netIncome: netProfit,
      revenue: totalIncome,
      expenses: totalExpensesCalc,
      projects: projectSummaries,
      customers: customerSummaries,
    });
  } catch (error: any) {
    console.error("GET /api/reports/profit-loss error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
