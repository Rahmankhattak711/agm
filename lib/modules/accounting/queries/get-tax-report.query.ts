import prisma from "@/lib/prisma";
import { microCache } from "../cache/micro-cache";

export interface TaxReportCategorySummary {
  taxType: "Out of Scope" | "Reverse Charge" | "Purchases" | "Sales";
  taxName: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
  transactionCount: number;
}

export interface TaxReportTransactionDetail {
  id: string;
  date: string;
  type: "INVOICE" | "BILL" | "EXPENSE" | "CREDIT_NOTE" | "DEBIT_NOTE" | "JOURNAL";
  referenceNumber: string;
  contactName: string;
  description: string;
  taxCategory: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface TaxReportResult {
  period: {
    startDate: string;
    endDate: string;
    year: number;
  };
  summary: TaxReportCategorySummary[];
  details: TaxReportTransactionDetail[];
  totals: {
    totalTaxableAmount: number;
    totalTaxAmount: number;
  };
}

export class GetTaxReportQueryHandler {
  static async execute(params?: {
    startDate?: string;
    endDate?: string;
    year?: number;
  }): Promise<TaxReportResult> {
    const currentYear = new Date().getFullYear();
    const year = params?.year || currentYear;

    const startDate = params?.startDate
      ? new Date(params.startDate)
      : new Date(`${year}-01-01T00:00:00.000Z`);

    const endDate = params?.endDate
      ? new Date(params.endDate)
      : new Date(`${year}-12-31T23:59:59.999Z`);

    const cacheKey = `vat:tax-report:${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`;
    const cached = microCache.get<TaxReportResult>(cacheKey);
    if (cached) return cached;

    const [invoices, bills, expenses, creditNotes, debitNotes] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: {
          status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
          invoiceDate: { gte: startDate, lte: endDate },
        },
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.supplierBill.findMany({
        where: {
          status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
          billDate: { gte: startDate, lte: endDate },
        },
        orderBy: { billDate: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.creditNote.findMany({
        where: {
          status: "POSTED",
          returnDate: { gte: startDate, lte: endDate },
        },
        orderBy: { returnDate: "desc" },
      }),
      prisma.debitNote.findMany({
        where: {
          status: "POSTED",
          returnDate: { gte: startDate, lte: endDate },
        },
        include: {
          supplier: {
            select: { name: true },
          },
        },
        orderBy: { returnDate: "desc" },
      }),
    ]);

    const details: TaxReportTransactionDetail[] = [];

    let outOfScopeTaxable = 0;
    let reverseChargeTaxable = 0;
    let reverseChargeTax = 0;
    let purchasesTaxable = 0;
    let purchasesTax = 0;
    let exemptSalesTaxable = 0;
    let zeroRatedSalesTaxable = 0;
    let standardSalesTaxable = 0;
    let standardSalesTax = 0;

    let outOfScopeCount = 0;
    let reverseChargeCount = 0;
    let purchasesCount = 0;
    let exemptCount = 0;
    let zeroRatedCount = 0;
    let standardSalesCount = 0;

    // 1. Process Sales Invoices
    for (const inv of invoices) {
      const rate = Number(inv.vatRate || 5);
      const sub = Number(inv.subtotal || 0);
      const vat = Number(inv.vatAmount || 0);
      const tot = Number(inv.totalAmount || 0);

      let cat = "VAT on Sales (5.00%)";
      if (rate === 0) {
        cat = "Zero-Rated Sales (0.00%)";
        zeroRatedSalesTaxable += sub;
        zeroRatedCount++;
      } else {
        standardSalesTaxable += sub;
        standardSalesTax += vat;
        standardSalesCount++;
      }

      details.push({
        id: inv.id,
        date: new Date(inv.invoiceDate).toISOString().slice(0, 10),
        type: "INVOICE",
        referenceNumber: inv.invoiceNumber,
        contactName: inv.customerName,
        description: `Tax Invoice - ${inv.projectScope || "General Fitout"}`,
        taxCategory: cat,
        taxRate: rate,
        taxableAmount: sub,
        taxAmount: vat,
        totalAmount: tot,
      });
    }

    // 2. Process Credit Notes (reverses sales)
    for (const cn of creditNotes) {
      const sub = Number(cn.subtotal || 0);
      const vat = Number(cn.vatAmount || 0);
      const tot = Number(cn.totalAmount || 0);

      standardSalesTaxable -= sub;
      standardSalesTax -= vat;

      details.push({
        id: cn.id,
        date: new Date(cn.returnDate).toISOString().slice(0, 10),
        type: "CREDIT_NOTE",
        referenceNumber: cn.creditNoteNumber,
        contactName: cn.customerName,
        description: `Credit Note - ${cn.reason || "Sales Reversal"}`,
        taxCategory: "VAT on Sales (5.00%)",
        taxRate: 5,
        taxableAmount: -sub,
        taxAmount: -vat,
        totalAmount: -tot,
      });
    }

    // 3. Process Supplier Bills
    for (const bill of bills) {
      const rate = Number(bill.vatRate || 5);
      const sub = Number(bill.subtotal || 0);
      const vat = Number(bill.vatAmount || 0);
      const tot = Number(bill.totalAmount || 0);

      purchasesTaxable += sub;
      purchasesTax += vat;
      purchasesCount++;

      details.push({
        id: bill.id,
        date: new Date(bill.billDate).toISOString().slice(0, 10),
        type: "BILL",
        referenceNumber: bill.billNumber,
        contactName: bill.supplierName,
        description: `Supplier Bill - Material/Services`,
        taxCategory: "VAT on Purchases (5.00%)",
        taxRate: rate,
        taxableAmount: sub,
        taxAmount: vat,
        totalAmount: tot,
      });
    }

    // 4. Process Expenses
    for (const exp of expenses) {
      const amt = Number(exp.amount || 0);
      const tax = Number(exp.taxAmount || 0);
      const taxable = tax > 0 ? amt - tax : amt;

      if (tax > 0) {
        purchasesTaxable += taxable;
        purchasesTax += tax;
        purchasesCount++;
        details.push({
          id: exp.id,
          date: new Date(exp.expenseDate).toISOString().slice(0, 10),
          type: "EXPENSE",
          referenceNumber: exp.expenseNumber,
          contactName: exp.payee || "Expense Payee",
          description: exp.description || exp.category,
          taxCategory: "VAT on Purchases (5.00%)",
          taxRate: 5,
          taxableAmount: taxable,
          taxAmount: tax,
          totalAmount: amt,
        });
      } else {
        outOfScopeTaxable += amt;
        outOfScopeCount++;
        details.push({
          id: exp.id,
          date: new Date(exp.expenseDate).toISOString().slice(0, 10),
          type: "EXPENSE",
          referenceNumber: exp.expenseNumber,
          contactName: exp.payee || "Expense Payee",
          description: exp.description || exp.category,
          taxCategory: "Out of Scope (0.00%)",
          taxRate: 0,
          taxableAmount: amt,
          taxAmount: 0,
          totalAmount: amt,
        });
      }
    }

    // 5. Process Debit Notes (reduces purchases)
    for (const dn of debitNotes) {
      const sub = Number(dn.subtotal || 0);
      const vat = Number(dn.vatAmount || 0);
      const tot = Number(dn.totalAmount || 0);

      purchasesTaxable -= sub;
      purchasesTax -= vat;

      details.push({
        id: dn.id,
        date: new Date(dn.returnDate).toISOString().slice(0, 10),
        type: "DEBIT_NOTE",
        referenceNumber: dn.debitNoteNumber,
        contactName: dn.supplier?.name || "Supplier",
        description: `Debit Note - Purchase Return`,
        taxCategory: "VAT on Purchases (5.00%)",
        taxRate: 5,
        taxableAmount: -sub,
        taxAmount: -vat,
        totalAmount: -tot,
      });
    }

    const summary: TaxReportCategorySummary[] = [
      {
        taxType: "Out of Scope",
        taxName: "Out of Scope (0.00%)",
        rate: 0,
        taxableAmount: Math.round(outOfScopeTaxable * 100) / 100,
        taxAmount: 0,
        transactionCount: outOfScopeCount,
      },
      {
        taxType: "Reverse Charge",
        taxName: "Reverse Charge (5.00%)",
        rate: 5,
        taxableAmount: Math.round(reverseChargeTaxable * 100) / 100,
        taxAmount: Math.round(reverseChargeTax * 100) / 100,
        transactionCount: reverseChargeCount,
      },
      {
        taxType: "Purchases",
        taxName: "VAT on Purchases (5.00%)",
        rate: 5,
        taxableAmount: Math.round(purchasesTaxable * 100) / 100,
        taxAmount: Math.round(purchasesTax * 100) / 100,
        transactionCount: purchasesCount,
      },
      {
        taxType: "Sales",
        taxName: "Exempt (0.00%)",
        rate: 0,
        taxableAmount: Math.round(exemptSalesTaxable * 100) / 100,
        taxAmount: 0,
        transactionCount: exemptCount,
      },
      {
        taxType: "Sales",
        taxName: "Zero-Rated Sales (0.00%)",
        rate: 0,
        taxableAmount: Math.round(zeroRatedSalesTaxable * 100) / 100,
        taxAmount: 0,
        transactionCount: zeroRatedCount,
      },
      {
        taxType: "Sales",
        taxName: "VAT on Sales (5.00%)",
        rate: 5,
        taxableAmount: Math.round(standardSalesTaxable * 100) / 100,
        taxAmount: Math.round(standardSalesTax * 100) / 100,
        transactionCount: standardSalesCount,
      },
    ];

    const totalTaxable = summary.reduce((s, r) => s + r.taxableAmount, 0);
    const totalTax = summary.reduce((s, r) => s + r.taxAmount, 0);

    const result: TaxReportResult = {
      period: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        year,
      },
      summary,
      details,
      totals: {
        totalTaxableAmount: Math.round(totalTaxable * 100) / 100,
        totalTaxAmount: Math.round(totalTax * 100) / 100,
      },
    };

    microCache.set(cacheKey, result, 60_000);
    return result;
  }
}
