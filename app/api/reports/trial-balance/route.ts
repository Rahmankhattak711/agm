import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStandardAccounts } from "@/lib/commercial-accounting";
import { getAccountTransactionDetails } from "@/lib/report-helpers";
import { TrialBalanceRow } from "@/lib/hooks/types";
import { microCache } from "@/lib/modules/accounting/cache/micro-cache";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";

type Account = Awaited<
  ReturnType<typeof prisma.chartOfAccount.findMany>
>[number];

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) return forbidden();

    const cacheKey = "tb:all";
    const cached = microCache.get<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const std = await getStandardAccounts();

    const [
      accounts,
      groups,
      lines,
      invoices,
      payments,
      bills,
      supplierPayments,
      expenses,
      projects,
      customers,
      users,
    ] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.groupBy({
        where: { journalEntry: { isPosted: true } },
        by: ["accountId"],
        _sum: { debit: true, credit: true },
      }),
      prisma.journalEntryLine.findMany({
        where: { journalEntry: { isPosted: true } },
        include: { account: true, journalEntry: true },
      }),
      prisma.salesInvoice.findMany({
        include: {
          customerRel: {
            select: { id: true, name: true, companyName: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.customerPayment.findMany({
        include: {
          customerRel: {
            select: { id: true, name: true, companyName: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.supplierBill.findMany({
        include: {
          supplier: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { billDate: "desc" },
      }),
      prisma.supplierPayment.findMany({
        select: {
          id: true,
          amount: true,
          createdById: true,
        },
      }),
      prisma.expense.findMany({
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
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
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const groupMap = new Map<string, { debit: number; credit: number }>();
    let hasJournalEntries = false;

    for (const g of groups) {
      const d = Number(g._sum.debit || 0);
      const c = Number(g._sum.credit || 0);
      if (d > 0 || c > 0) hasJournalEntries = true;
      groupMap.set(g.accountId, { debit: d, credit: c });
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

    if (!hasJournalEntries) {
      groupMap.set(std.ar.id, { debit: openAR, credit: 0 });
      groupMap.set(std.salesRevenue.id, { debit: 0, credit: subtotalInvoiced });

      if (vatOutput > 0) {
        groupMap.set(std.outputVat.id, { debit: 0, credit: vatOutput });
      }

      if (openAP > 0) {
        groupMap.set(std.ap.id, { debit: 0, credit: openAP });
      }

      const totalDirectCost = subtotalBilled + totalExpenses;
      if (totalDirectCost > 0) {
        groupMap.set(std.materialCost.id, {
          debit: totalDirectCost,
          credit: 0,
        });
      }

      if (vatInput > 0) {
        groupMap.set(std.inputVat.id, { debit: vatInput, credit: 0 });
      }

      if (netCash >= 0) {
        groupMap.set(std.bank.id, { debit: netCash, credit: 0 });
      } else {
        groupMap.set(std.bank.id, { debit: 0, credit: Math.abs(netCash) });
      }
    }

    let rows: TrialBalanceRow[] = accounts.map((acct: Account) => {
      const g = groupMap.get(acct.id) || { debit: 0, credit: 0 };
      const debit = Number(g.debit || 0);
      const credit = Number(g.credit || 0);
      const netBalance =
        acct.type === "ASSET" || acct.type === "EXPENSE"
          ? debit - credit
          : credit - debit;
      return {
        accountId: acct.id,
        accountCode: acct.accountCode,
        accountName: acct.accountName,
        type: acct.type,
        debit,
        credit,
        netBalance,
        details: getAccountTransactionDetails(
          acct,
          Math.abs(netBalance),
          lines,
          invoices,
          payments,
          bills,
          expenses,
          projects,
          std,
        ),
      };
    });

    let nonZeroRows = rows.filter((r) => r.debit > 0 || r.credit > 0);

    if (nonZeroRows.length === 0) {
      nonZeroRows = accounts.slice(0, 10).map((acct) => ({
        accountId: acct.id,
        accountCode: acct.accountCode,
        accountName: acct.accountName,
        type: acct.type,
        debit: 0,
        credit: 0,
        netBalance: 0,
      }));
    }

    const totalDebit =
      Math.round(
        nonZeroRows.reduce((s: number, r: TrialBalanceRow) => s + r.debit, 0) * 100,
      ) / 100;
    const totalCredit =
      Math.round(
        nonZeroRows.reduce((s: number, r: TrialBalanceRow) => s + r.credit, 0) * 100,
      ) / 100;
    const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
    const isBalanced = difference < 0.01;

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

    const userSummaries = users.map((u) => {
      const uInvoices = invoices.filter((inv) => inv.createdById === u.id);
      const uBills = bills.filter((b) => b.createdById === u.id);
      const uPayments = payments.filter((p) => p.createdById === u.id);
      const uExpenses = expenses.filter((e) => e.createdById === u.id);

      const invVolume = uInvoices.reduce(
        (s, i) => s + Number(i.totalAmount || 0),
        0,
      );
      const billVolume = uBills.reduce(
        (s, b) => s + Number(b.totalAmount || 0),
        0,
      );
      const payVolume = uPayments.reduce(
        (s, p) => s + Number(p.amount || 0),
        0,
      );
      const expVolume = uExpenses.reduce(
        (s, e) => s + Number(e.amount || 0),
        0,
      );

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        invoicesCount: uInvoices.length,
        billsCount: uBills.length,
        paymentsCount: uPayments.length,
        expensesCount: uExpenses.length,
        totalRecordedVolume: invVolume + billVolume + payVolume + expVolume,
      };
    });

    const responsePayload = {
      rows: nonZeroRows,
      totalDebit,
      totalCredit,
      difference,
      isBalanced,
      projects: projectSummaries,
      customers: customerSummaries,
      users: userSummaries,
      summary: {
        totalRevenue: subtotalInvoiced,
        totalDirectCosts: subtotalBilled + totalExpenses,
        totalGrossProfit: subtotalInvoiced - (subtotalBilled + totalExpenses),
        totalReceivables: openAR,
        totalPayables: openAP,
        netCashFlow: netCash,
      },
    };

    microCache.set(cacheKey, responsePayload, 60_000);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("GET /api/reports/trial-balance error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
