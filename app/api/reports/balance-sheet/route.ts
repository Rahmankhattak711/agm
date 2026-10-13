import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStandardAccounts } from "@/lib/commercial-accounting";
import { getAccountTransactionDetails } from "@/lib/report-helpers";
import { BalanceSheetItem } from "@/lib/hooks/types";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";

type Account = Awaited<
  ReturnType<typeof prisma.chartOfAccount.findMany>
>[number];

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) return forbidden();

    const std = await getStandardAccounts();
    const { searchParams } = new URL(req.url);
    const endDateStr =
      searchParams.get("endDate") || searchParams.get("asOfDate");

    const whereCondition: any = {};
    if (endDateStr) {
      const eParts = endDateStr.split("-").map(Number);
      if (eParts.length === 3) {
        const endDate = new Date(
          Date.UTC(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59, 999),
        );
        whereCondition.journalEntry = { entryDate: { lte: endDate } };
      }
    }

    const [
      accounts,
      lines,
      invoices,
      payments,
      bills,
      supplierPayments,
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
      prisma.supplierPayment.findMany({
        select: {
          id: true,
          amount: true,
        },
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
    let netRevenue = 0;
    let netExpense = 0;
    let hasJournalEntries = false;

    for (const l of lines) {
      const type = l.account?.type;
      const current = balanceMap.get(l.accountId) || 0;
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      if (debit > 0 || credit > 0) hasJournalEntries = true;

      if (type === "ASSET") {
        balanceMap.set(l.accountId, current + debit - credit);
      } else if (type === "LIABILITY" || type === "EQUITY") {
        balanceMap.set(l.accountId, current + credit - debit);
      } else if (type === "REVENUE") {
        netRevenue += credit - debit;
      } else if (type === "EXPENSE") {
        netExpense += debit - credit;
      }
    }

    const totalInvoiced = invoices.reduce(
      (s, inv) => s + Number(inv.totalAmount || 0),
      0,
    );
    const subtotalInvoiced = invoices.reduce(
      (s, inv) => s + Number(inv.subtotal || 0),
      0,
    );
    const vatOutput = invoices.reduce(
      (s, inv) => s + Number(inv.vatAmount || 0),
      0,
    );

    const totalCollected = payments.reduce(
      (s, p) => s + Number(p.amount || 0),
      0,
    );

    const totalBilled = bills.reduce(
      (s, b) => s + Number(b.totalAmount || 0),
      0,
    );
    const subtotalBilled = bills.reduce(
      (s, b) => s + Number(b.subtotal || 0),
      0,
    );
    const vatInputBills = bills.reduce(
      (s, b) => s + Number(b.vatAmount || 0),
      0,
    );

    const totalPaidSuppliers = supplierPayments.reduce(
      (s, sp) => s + Number(sp.amount || 0),
      0,
    );

    const totalExpenses = expenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0,
    );
    const vatInputExpenses = expenses.reduce(
      (s, e) => s + Number(e.taxAmount || 0),
      0,
    );
    const vatInput = vatInputBills + vatInputExpenses;

    const openAR = Math.max(0, totalInvoiced - totalCollected);
    const openAP = Math.max(0, totalBilled - totalPaidSuppliers);
    const netCash = totalCollected - totalPaidSuppliers - totalExpenses;
    const computedNetProfit =
      subtotalInvoiced - (subtotalBilled + totalExpenses);

    if (!hasJournalEntries) {
      balanceMap.set(std.ar.id, openAR);
      balanceMap.set(std.ap.id, openAP);
      if (vatOutput > 0) {
        balanceMap.set(std.outputVat.id, vatOutput);
      }
      if (vatInput > 0) {
        balanceMap.set(std.inputVat.id, vatInput);
      }
      if (netCash >= 0) {
        balanceMap.set(std.bank.id, netCash);
      } else {
        balanceMap.set(std.bank.id, 0);
      }
      netRevenue = subtotalInvoiced;
      netExpense = subtotalBilled + totalExpenses;
    }

    const currentYearEarnings = hasJournalEntries
      ? netRevenue - netExpense
      : computedNetProfit;

    const assetAccounts = accounts.filter((a: Account) => a.type === "ASSET");
    const liabilityAccounts = accounts.filter(
      (a: Account) => a.type === "LIABILITY",
    );
    const equityAccounts = accounts.filter((a: Account) => a.type === "EQUITY");

    const isFixedAsset = (acc: {
      accountCode: string;
      accountName: string;
    }) => {
      const code = parseInt(acc.accountCode, 10);
      const name = acc.accountName.toLowerCase();
      return (
        (code >= 1500 && code < 2000) ||
        name.includes("car") ||
        name.includes("chair") ||
        name.includes("computer") ||
        name.includes("printer") ||
        name.includes("table") ||
        name.includes("fixed asset") ||
        name.includes("equipment") ||
        name.includes("vehicle")
      );
    };

    const isVatInputAccount = (acc: Account) =>
      acc.accountCode === "2200" ||
      acc.accountCode === "1210" ||
      acc.accountName.toLowerCase().includes("vat input") ||
      acc.id === std.inputVat?.id;

    const currentAssetCandidates = [
      ...assetAccounts.filter((acc: Account) => !isFixedAsset(acc)),
      ...accounts.filter(
        (acc: Account) => isVatInputAccount(acc) && acc.type !== "ASSET",
      ),
    ];

    const currentAssetItems: BalanceSheetItem[] = currentAssetCandidates
      .map((acc: Account) => {
        let amount = 0;
        if (isVatInputAccount(acc)) {
          const jl = lines.filter((l) => l.accountId === acc.id);
          const dr = jl.reduce((s, l) => s + Number(l.debit || 0), 0);
          const cr = jl.reduce((s, l) => s + Number(l.credit || 0), 0);
          amount = Math.max(0, dr - cr);
          if (amount === 0 && vatInput > 0) amount = vatInput;
        } else {
          amount = Math.max(0, balanceMap.get(acc.id) || 0);
        }

        return {
          id: acc.id,
          section: "Current Asset",
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount,
          details: getAccountTransactionDetails(
            acc,
            amount,
            lines,
            invoices,
            payments,
            bills,
            expenses,
            projects,
            std,
          ),
        };
      })
      .filter(
        (item) =>
          item.amount > 0 ||
          item.accountCode === "1200" ||
          item.accountCode === "1020",
      );

    const fixedAssetItems: BalanceSheetItem[] = assetAccounts
      .filter(isFixedAsset)
      .map((acc: Account) => {
        const amount = Math.max(0, balanceMap.get(acc.id) || 0);
        return {
          id: acc.id,
          section: "Fixed Asset",
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount,
          details: getAccountTransactionDetails(
            acc,
            amount,
            lines,
            invoices,
            payments,
            bills,
            expenses,
            projects,
            std,
          ),
        };
      })
      .filter((item) => item.amount > 0);

    const currentLiabilityItems: BalanceSheetItem[] = liabilityAccounts
      .filter((acc: Account) => !isVatInputAccount(acc))
      .map((acc: Account) => {
        const amount = Math.max(0, balanceMap.get(acc.id) || 0);
        return {
          id: acc.id,
          section: "Current Liability",
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount,
          details: getAccountTransactionDetails(
            acc,
            amount,
            lines,
            invoices,
            payments,
            bills,
            expenses,
            projects,
            std,
          ),
        };
      })
      .filter(
        (item) =>
          item.amount > 0 ||
          item.accountCode === "2000" ||
          item.accountCode === "2210",
      );

    let totalCurrentAssets = currentAssetItems.reduce(
      (s: number, i: BalanceSheetItem) => s + i.amount,
      0,
    );
    const totalFixedAssets = fixedAssetItems.reduce(
      (s: number, i: BalanceSheetItem) => s + i.amount,
      0,
    );
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = currentLiabilityItems.reduce(
      (s: number, i: BalanceSheetItem) => s + i.amount,
      0,
    );
    const totalLiabilities = totalCurrentLiabilities;

    const calculatedRetainedProfit = Math.max(
      0,
      totalAssets - totalLiabilities,
    );

    const equityItems: BalanceSheetItem[] = equityAccounts.map(
      (acc: Account) => {
        let amt = balanceMap.get(acc.id) || 0;
        let section = "Capital";
        if (
          acc.accountCode === "3100" ||
          acc.accountName.toLowerCase().includes("earning") ||
          acc.accountName.toLowerCase().includes("retained") ||
          acc.accountName.toLowerCase().includes("profit")
        ) {
          amt =
            calculatedRetainedProfit > 0
              ? calculatedRetainedProfit
              : currentYearEarnings;
          section = "Retained Earnings";
        }
        return {
          id: acc.id,
          section,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          amount: amt,
          details: getAccountTransactionDetails(
            acc,
            amt,
            lines,
            invoices,
            payments,
            bills,
            expenses,
            projects,
            std,
          ),
        };
      },
    );

    if (
      !equityItems.some(
        (e: BalanceSheetItem) => e.section === "Retained Earnings",
      )
    ) {
      equityItems.push({
        id: "current-year-earnings",
        section: "Retained Earnings",
        accountCode: "3100",
        accountName: "Current Year Earnings",
        amount: currentYearEarnings,
      });
    }

    let totalEquity = equityItems.reduce(
      (s: number, i: BalanceSheetItem) => s + i.amount,
      0,
    );
    let totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    let balanceCheck =
      Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

    if (Math.abs(balanceCheck) > 0.01) {
      const retainedItem = equityItems.find(
        (e) => e.section === "Retained Earnings" || e.accountCode === "3100",
      );
      if (retainedItem) {
        retainedItem.amount += balanceCheck;
      } else {
        equityItems.push({
          id: "equity-adjustment",
          section: "Capital",
          accountCode: "3000",
          accountName: "Owner Capital / Financial Equalization",
          amount: balanceCheck,
        });
      }
      totalEquity = equityItems.reduce(
        (s: number, i: BalanceSheetItem) => s + i.amount,
        0,
      );
      totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
      balanceCheck =
        Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;
    }

    const balanced = Math.abs(balanceCheck) < 0.01;

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
      reportTitle: "Balance Sheet",
      currentAssets: currentAssetItems,
      totalCurrentAssets,
      fixedAssets: fixedAssetItems,
      totalFixedAssets,
      totalAssets,
      currentLiabilities: currentLiabilityItems,
      totalCurrentLiabilities,
      totalLiabilities,
      equity: equityItems,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanceCheck,
      balanced,
      assets: totalAssets,
      liabilities: totalLiabilities,
      equityAmount: totalEquity,
      projects: projectSummaries,
      customers: customerSummaries,
    });
  } catch (error: any) {
    console.error("GET /api/reports/balance-sheet error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
