import prisma from "@/lib/prisma";
import { microCache } from "../cache/micro-cache";

export interface VatBoxTransaction {
  id: string;
  number: string;
  date: string;
  contactName: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  type: "INVOICE" | "BILL" | "EXPENSE" | "CREDIT_NOTE" | "DEBIT_NOTE";
  url: string;
}

export interface VatBoxRow {
  boxNumber: string;
  label: string;
  taxableAmount: number;
  taxAmount: number;
  adjustments: number;
  transactions?: VatBoxTransaction[];
}

export interface Vat201ReturnResult {
  period: {
    startDate: string;
    endDate: string;
    year: number;
  };
  outputVat: {
    boxes: VatBoxRow[];
    totalTaxableAmount: number;
    totalTaxAmount: number;
    totalAdjustments: number;
  };
  inputVat: {
    boxes: VatBoxRow[];
    totalTaxableAmount: number;
    totalTaxAmount: number;
    totalAdjustments: number;
  };
  netVat: {
    box12DueTax: number;
    box13RecoverableTax: number;
    box14NetVatPayable: number; // positive = payable to FTA, negative = reclaimable
    status: "PAYABLE" | "RECLAIMABLE";
  };
}

export class GetVatReturnQueryHandler {
  static async execute(params?: {
    startDate?: string;
    endDate?: string;
    year?: number;
  }): Promise<Vat201ReturnResult> {
    const currentYear = new Date().getFullYear();
    const year = params?.year || currentYear;

    const startDate = params?.startDate
      ? new Date(params.startDate)
      : new Date(`${year}-01-01T00:00:00.000Z`);

    const endDate = params?.endDate
      ? new Date(params.endDate)
      : new Date(`${year}-12-31T23:59:59.999Z`);

    const cacheKey = `vat:return:${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`;
    const cached = microCache.get<Vat201ReturnResult>(cacheKey);
    if (cached) return cached;

    // Parallel fetch all 5 data sources across a single roundtrip
    const [salesInvoices, creditNotes, supplierBills, expenses, debitNotes] =
      await Promise.all([
        prisma.salesInvoice.findMany({
          where: {
            status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
            invoiceDate: { gte: startDate, lte: endDate },
          },
          include: {
            customerRel: {
              select: { id: true, name: true, address: true },
            },
          },
        }),
        prisma.creditNote.findMany({
          where: {
            status: "POSTED",
            returnDate: { gte: startDate, lte: endDate },
          },
          include: {
            customerRel: {
              select: { id: true, name: true, address: true },
            },
          },
        }),
        prisma.supplierBill.findMany({
          where: {
            status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
            billDate: { gte: startDate, lte: endDate },
          },
        }),
        prisma.expense.findMany({
          where: {
            expenseDate: { gte: startDate, lte: endDate },
          },
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
        }),
      ]);

    // Emirates tracking map
    type EmirateKey = "abu_dhabi" | "dubai" | "sharjah" | "ajman" | "umm_al_quwain" | "ras_al_khaimah" | "fujairah";
    const emirateSales: Record<
      EmirateKey,
      { taxable: number; tax: number; adj: number; transactions: VatBoxTransaction[] }
    > = {
      abu_dhabi: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      dubai: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      sharjah: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      ajman: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      umm_al_quwain: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      ras_al_khaimah: { taxable: 0, tax: 0, adj: 0, transactions: [] },
      fujairah: { taxable: 0, tax: 0, adj: 0, transactions: [] },
    };

    const detectEmirate = (text?: string | null): EmirateKey => {
      if (!text) return "dubai";
      const t = text.toLowerCase();
      if (t.includes("abu dhabi") || t.includes("abudhabi")) return "abu_dhabi";
      if (t.includes("sharjah")) return "sharjah";
      if (t.includes("ajman")) return "ajman";
      if (t.includes("quwain") || t.includes("uaq")) return "umm_al_quwain";
      if (t.includes("khaimah") || t.includes("rak")) return "ras_al_khaimah";
      if (t.includes("fujairah")) return "fujairah";
      return "dubai"; // Default commercial registration of AGM Fitout
    };

    let zeroRatedSales = 0;
    let exemptSales = 0;
    let reverseChargeSales = 0;

    // Process Sales Invoices
    for (const inv of salesInvoices) {
      const vatRate = Number(inv.vatRate || 5);
      const vatAmount = Number(inv.vatAmount || 0);
      const taxable = Number(inv.subtotal || 0);

      if (vatRate === 0) {
        zeroRatedSales += taxable;
      } else {
        const em = detectEmirate(inv.projectScope || inv.customerRel?.address || inv.customerName);
        emirateSales[em].taxable += taxable;
        emirateSales[em].tax += vatAmount;
        emirateSales[em].transactions.push({
          id: inv.id,
          number: inv.invoiceNumber,
          date: new Date(inv.invoiceDate).toISOString().slice(0, 10),
          contactName: inv.customerName,
          taxableAmount: taxable,
          vatAmount,
          totalAmount: Number(inv.totalAmount || 0),
          type: "INVOICE",
          url: `/commercial/sales-invoices`,
        });
      }
    }

    // Process Credit Notes (reverses sales)
    for (const cn of creditNotes) {
      const vatAmt = Number(cn.vatAmount || 0);
      const taxable = Number(cn.subtotal || 0);
      const em = detectEmirate(cn.customerRel?.address || cn.customerName);

      emirateSales[em].taxable = Math.max(0, emirateSales[em].taxable - taxable);
      emirateSales[em].tax = Math.max(0, emirateSales[em].tax - vatAmt);
      emirateSales[em].adj += vatAmt; // Recorded as adjustment
      emirateSales[em].transactions.push({
        id: cn.id,
        number: cn.creditNoteNumber,
        date: new Date(cn.returnDate).toISOString().slice(0, 10),
        contactName: cn.customerName,
        taxableAmount: -taxable,
        vatAmount: -vatAmt,
        totalAmount: -Number(cn.totalAmount || 0),
        type: "CREDIT_NOTE",
        url: `/commercial/credit-notes`,
      });
    }

    // Construct Output VAT Boxes (1a to 8)
    const outputBoxes: VatBoxRow[] = [
      {
        boxNumber: "1a",
        label: "Standard rated supplies in Abu Dhabi",
        taxableAmount: Math.round(emirateSales.abu_dhabi.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.abu_dhabi.tax * 100) / 100,
        adjustments: Math.round(emirateSales.abu_dhabi.adj * 100) / 100,
        transactions: emirateSales.abu_dhabi.transactions,
      },
      {
        boxNumber: "1b",
        label: "Standard rated supplies in Dubai",
        taxableAmount: Math.round(emirateSales.dubai.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.dubai.tax * 100) / 100,
        adjustments: Math.round(emirateSales.dubai.adj * 100) / 100,
        transactions: emirateSales.dubai.transactions,
      },
      {
        boxNumber: "1c",
        label: "Standard rated supplies in Sharjah",
        taxableAmount: Math.round(emirateSales.sharjah.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.sharjah.tax * 100) / 100,
        adjustments: Math.round(emirateSales.sharjah.adj * 100) / 100,
        transactions: emirateSales.sharjah.transactions,
      },
      {
        boxNumber: "1d",
        label: "Standard rated supplies in Ajman",
        taxableAmount: Math.round(emirateSales.ajman.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.ajman.tax * 100) / 100,
        adjustments: Math.round(emirateSales.ajman.adj * 100) / 100,
        transactions: emirateSales.ajman.transactions,
      },
      {
        boxNumber: "1e",
        label: "Standard rated supplies in Umm Al Quwain",
        taxableAmount: Math.round(emirateSales.umm_al_quwain.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.umm_al_quwain.tax * 100) / 100,
        adjustments: Math.round(emirateSales.umm_al_quwain.adj * 100) / 100,
        transactions: emirateSales.umm_al_quwain.transactions,
      },
      {
        boxNumber: "1f",
        label: "Standard rated supplies in Ras Al Khaimah",
        taxableAmount: Math.round(emirateSales.ras_al_khaimah.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.ras_al_khaimah.tax * 100) / 100,
        adjustments: Math.round(emirateSales.ras_al_khaimah.adj * 100) / 100,
        transactions: emirateSales.ras_al_khaimah.transactions,
      },
      {
        boxNumber: "1g",
        label: "Standard rated supplies in Fujairah",
        taxableAmount: Math.round(emirateSales.fujairah.taxable * 100) / 100,
        taxAmount: Math.round(emirateSales.fujairah.tax * 100) / 100,
        adjustments: Math.round(emirateSales.fujairah.adj * 100) / 100,
        transactions: emirateSales.fujairah.transactions,
      },
      {
        boxNumber: "2",
        label: "Tax Refunds provided to Tourists under the Tax Refunds for Tourists Scheme",
        taxableAmount: 0,
        taxAmount: 0,
        adjustments: 0,
      },
      {
        boxNumber: "3",
        label: "Supplies subject to the reverse charge provisions",
        taxableAmount: reverseChargeSales,
        taxAmount: Math.round(reverseChargeSales * 0.05 * 100) / 100,
        adjustments: 0,
      },
      {
        boxNumber: "4",
        label: "Zero rated supplies",
        taxableAmount: Math.round(zeroRatedSales * 100) / 100,
        taxAmount: 0,
        adjustments: 0,
      },
      {
        boxNumber: "5",
        label: "Exempt supplies",
        taxableAmount: Math.round(exemptSales * 100) / 100,
        taxAmount: 0,
        adjustments: 0,
      },
      {
        boxNumber: "6",
        label: "Goods imported into the UAE",
        taxableAmount: 0,
        taxAmount: 0,
        adjustments: 0,
      },
      {
        boxNumber: "7",
        label: "Adjustments and additions to goods imported into the UAE",
        taxableAmount: 0,
        taxAmount: 0,
        adjustments: 0,
      },
    ];

    const totalOutputTaxable = outputBoxes.reduce((s, b) => s + b.taxableAmount, 0);
    const totalOutputTax = outputBoxes.reduce((s, b) => s + b.taxAmount, 0);
    const totalOutputAdj = outputBoxes.reduce((s, b) => s + b.adjustments, 0);

    const allOutputTransactions = outputBoxes.flatMap((b) => b.transactions || []);

    // Box 8: Total Output VAT
    outputBoxes.push({
      boxNumber: "8",
      label: "Total Output VAT",
      taxableAmount: Math.round(totalOutputTaxable * 100) / 100,
      taxAmount: Math.round(totalOutputTax * 100) / 100,
      adjustments: Math.round(totalOutputAdj * 100) / 100,
      transactions: allOutputTransactions,
    });

    // Process Purchases / Expenses (Box 9)
    let purchaseTaxable = 0;
    let purchaseTax = 0;
    let purchaseAdj = 0;
    const purchaseTransactions: VatBoxTransaction[] = [];

    for (const b of supplierBills) {
      const vat = Number(b.vatAmount || 0);
      const sub = Number(b.subtotal || 0);
      purchaseTaxable += sub;
      purchaseTax += vat;
      purchaseTransactions.push({
        id: b.id,
        number: b.billNumber,
        date: new Date(b.billDate).toISOString().slice(0, 10),
        contactName: b.supplierName,
        taxableAmount: sub,
        vatAmount: vat,
        totalAmount: Number(b.totalAmount || 0),
        type: "BILL",
        url: "/commercial/supplier-bills",
      });
    }

    for (const exp of expenses) {
      const tax = Number(exp.taxAmount || 0);
      const amt = Number(exp.amount || 0);
      const sub = tax > 0 ? amt - tax : amt;
      if (tax > 0) {
        purchaseTaxable += sub;
        purchaseTax += tax;
      } else {
        purchaseTaxable += amt;
      }
      purchaseTransactions.push({
        id: exp.id,
        number: exp.expenseNumber,
        date: new Date(exp.expenseDate).toISOString().slice(0, 10),
        contactName: exp.payee || "Payee",
        taxableAmount: sub,
        vatAmount: tax,
        totalAmount: amt,
        type: "EXPENSE",
        url: "/finance/expenses",
      });
    }

    // Debit notes reduce input tax
    for (const dn of debitNotes) {
      const vat = Number(dn.vatAmount || 0);
      const sub = Number(dn.subtotal || 0);
      purchaseTaxable = Math.max(0, purchaseTaxable - sub);
      purchaseTax = Math.max(0, purchaseTax - vat);
      purchaseAdj += vat;
      purchaseTransactions.push({
        id: dn.id,
        number: dn.debitNoteNumber,
        date: new Date(dn.returnDate).toISOString().slice(0, 10),
        contactName: dn.supplier?.name || "Supplier",
        taxableAmount: -sub,
        vatAmount: -vat,
        totalAmount: -Number(dn.totalAmount || 0),
        type: "DEBIT_NOTE",
        url: "/commercial/debit-notes",
      });
    }

    const inputBoxes: VatBoxRow[] = [
      {
        boxNumber: "9",
        label: "Standard rated expenses",
        taxableAmount: Math.round(purchaseTaxable * 100) / 100,
        taxAmount: Math.round(purchaseTax * 100) / 100,
        adjustments: Math.round(purchaseAdj * 100) / 100,
        transactions: purchaseTransactions,
      },
      {
        boxNumber: "10",
        label: "Supplies subject to the reverse charge provisions",
        taxableAmount: 0,
        taxAmount: 0,
        adjustments: 0,
      },
    ];

    const totalInputTaxable = inputBoxes.reduce((s, b) => s + b.taxableAmount, 0);
    const totalInputTax = inputBoxes.reduce((s, b) => s + b.taxAmount, 0);
    const totalInputAdj = inputBoxes.reduce((s, b) => s + b.adjustments, 0);

    // Box 11: Total Input VAT
    inputBoxes.push({
      boxNumber: "11",
      label: "Total Input VAT",
      taxableAmount: Math.round(totalInputTaxable * 100) / 100,
      taxAmount: Math.round(totalInputTax * 100) / 100,
      adjustments: Math.round(totalInputAdj * 100) / 100,
      transactions: purchaseTransactions,
    });

    // Box 12, 13, 14: Net VAT Due
    const box12 = Math.round(totalOutputTax * 100) / 100;
    const box13 = Math.round(totalInputTax * 100) / 100;
    const box14 = Math.round((box12 - box13) * 100) / 100;

    const result: Vat201ReturnResult = {
      period: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        year,
      },
      outputVat: {
        boxes: outputBoxes,
        totalTaxableAmount: Math.round(totalOutputTaxable * 100) / 100,
        totalTaxAmount: box12,
        totalAdjustments: Math.round(totalOutputAdj * 100) / 100,
      },
      inputVat: {
        boxes: inputBoxes,
        totalTaxableAmount: Math.round(totalInputTaxable * 100) / 100,
        totalTaxAmount: box13,
        totalAdjustments: Math.round(totalInputAdj * 100) / 100,
      },
      netVat: {
        box12DueTax: box12,
        box13RecoverableTax: box13,
        box14NetVatPayable: box14,
        status: box14 >= 0 ? "PAYABLE" : "RECLAIMABLE",
      },
    };

    microCache.set(cacheKey, result, 60); // 60 seconds TTL
    return result;
  }
}
