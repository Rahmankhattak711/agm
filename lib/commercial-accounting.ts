import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma";
import { AccountResolverService } from "@/app/(workspace)/finance/accounts/services/account-resolver.service";
import { FiscalLockService } from "./modules/accounting/services/fiscal-lock.service";

export async function findOrCreateAccount(
  code: string,
  name: string,
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;
  let account = await db.chartOfAccount.findFirst({
    where: {
      OR: [
        { accountCode: code },
        { accountName: { equals: name, mode: "insensitive" } },
      ],
    },
  });

  if (!account) {
    account = await db.chartOfAccount.create({
      data: {
        accountCode: code,
        accountName: name,
        type,
        isActive: true,
      },
    });
  }

  return account;
}

export function extractCleanSeq(val: string): string {
  if (!val) return "0001";
  const match = val.match(/(\d+)$/);
  return match ? match[1].padStart(4, "0") : val.replace(/[^a-zA-Z0-9]/g, "").slice(-4);
}

export async function getStandardAccounts() {
  return await AccountResolverService.getCommercialSystemAccounts();
}

/**
 * Posts Sales Invoice to General Ledger:
 * Dr. Accounts Receivable (Total Gross Amount)
 * Dr. Sales Discount (Discount Amount, if applicable)
 *   Cr. Sales Revenue (Gross Subtotal)
 *   Cr. VAT Output Tax (VAT 5% Amount, if applicable)
 */
export async function postSalesInvoiceJournalEntry(params: {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerId?: string | null;
  projectId?: string | null;
  subtotal: number;
  discount?: number;
  discountAccountId?: string | null;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.invoiceDate);

  const accounts = await getStandardAccounts();

  const cleanInv = extractCleanSeq(params.invoiceNumber);
  const entryNumber = `JE-INV-${cleanInv}`;

  const discountAmount = Math.max(0, Math.round(Number(params.discount || 0) * 100) / 100);
  const vatAmount = Math.max(0, Math.round(Number(params.vatAmount || 0) * 100) / 100);
  const totalAmount = Math.round(Number(params.totalAmount || 0) * 100) / 100;
  const netSubtotal = Math.round((totalAmount - vatAmount) * 100) / 100;
  const grossSubtotal = Math.round((netSubtotal + discountAmount) * 100) / 100;

  const lines: any[] = [];

  // 1. Debit Accounts Receivable (Full Total Amount Owed)
  lines.push({
    accountId: accounts.ar.id,
    debit: totalAmount,
    credit: 0,
    currency: "AED",
    fxRate: 1,
    debitAed: totalAmount,
    creditAed: 0,
    contactId: params.customerId || null,
    contactName: params.customerName || null,
    projectId: params.projectId || null,
    description: `Sales Invoice ${params.invoiceNumber} - ${params.customerName}`,
  });

  // 2. Debit Sales Discount (if applicable)
  let discountApplied = false;
  if (discountAmount > 0) {
    const discountAcc = params.discountAccountId
      ? await db.chartOfAccount.findUnique({ where: { id: params.discountAccountId } })
      : accounts.salesDiscount;
    const targetAccountId = discountAcc?.id || accounts.salesDiscount?.id || accounts.expenseDiscount?.id;

    if (targetAccountId) {
      lines.push({
        accountId: targetAccountId,
        debit: discountAmount,
        credit: 0,
        currency: "AED",
        fxRate: 1,
        debitAed: discountAmount,
        creditAed: 0,
        contactId: params.customerId || null,
        contactName: params.customerName || null,
        projectId: params.projectId || null,
        description: `Sales Discount granted on Invoice ${params.invoiceNumber}`,
      });
      discountApplied = true;
    }
  }

  // 3. Credit Sales Revenue
  // If discount was linked, credit grossSubtotal (Revenue - Discount = Net)
  // If no discount or unlinked, credit netSubtotal so Double-Entry is strictly balanced
  const revenueCredit = discountApplied ? grossSubtotal : netSubtotal;
  lines.push({
    accountId: accounts.salesRevenue.id,
    debit: 0,
    credit: revenueCredit,
    currency: "AED",
    fxRate: 1,
    debitAed: 0,
    creditAed: revenueCredit,
    contactId: params.customerId || null,
    contactName: params.customerName || null,
    projectId: params.projectId || null,
    description: `Gross Sales Revenue - Invoice ${params.invoiceNumber}`,
  });

  // 4. Credit Output VAT (if applicable)
  if (vatAmount > 0) {
    lines.push({
      accountId: accounts.outputVat.id,
      debit: 0,
      credit: vatAmount,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: vatAmount,
      taxRate: 5,
      taxType: "STANDARD_SALES",
      taxAmount: vatAmount,
      contactId: params.customerId || null,
      contactName: params.customerName || null,
      projectId: params.projectId || null,
      description: `Output VAT 5% for ${params.invoiceNumber}`,
    });
  }

  // Strict double-entry balancing validation
  const totalDebit = lines.reduce((s, l) => s + Number(l.debitAed), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.creditAed), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    throw new Error(
      `Cannot post unbalanced journal entry for Invoice ${params.invoiceNumber}. Total Debit: AED ${totalDebit.toFixed(2)}, Total Credit: AED ${totalCredit.toFixed(2)} (Diff: ${diff.toFixed(2)})`
    );
  }

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.invoiceDate,
      description: `Sales Invoice ${params.invoiceNumber} - ${params.customerName}`,
      reference: params.invoiceNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Post Customer Payment to General Ledger:
 * Dr. Bank / Cash (Amount)
 *   Cr. Accounts Receivable (Amount)
 */
export async function postCustomerPaymentJournalEntry(params: {
  paymentId: string;
  receiptNumber: string;
  paymentDate: Date;
  customerName: string;
  customerId?: string | null;
  projectId?: string | null;
  amount: number;
  paymentMethod: string;
  invoiceNumber?: string;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.paymentDate);

  const accounts = await getStandardAccounts();
  const debitAccount =
    params.paymentMethod === "CASH" ? accounts.cash : accounts.bank;

  const cleanRec = extractCleanSeq(params.receiptNumber);
  const entryNumber = `JE-REC-${cleanRec}`;
  const amt = Math.round(Number(params.amount) * 100) / 100;

  const lines = [
    {
      accountId: debitAccount.id,
      debit: amt,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: amt,
      creditAed: 0,
      contactId: params.customerId || null,
      contactName: params.customerName || null,
      projectId: params.projectId || null,
      description: `Receipt ${params.receiptNumber} - Payment received (${params.paymentMethod})`,
    },
    {
      accountId: accounts.ar.id,
      debit: 0,
      credit: amt,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: amt,
      contactId: params.customerId || null,
      contactName: params.customerName || null,
      projectId: params.projectId || null,
      description: `Customer payment applied: ${params.receiptNumber}${params.invoiceNumber ? ` (Inv: ${params.invoiceNumber})` : ""}`,
    },
  ];

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.paymentDate,
      description: `Customer Receipt ${params.receiptNumber} - ${params.customerName}${params.invoiceNumber ? ` (Inv: ${params.invoiceNumber})` : ""}`,
      reference: params.receiptNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Post Supplier Bill to General Ledger:
 * Dr. Purchase Materials / Expense (Gross Subtotal)
 * Dr. Input VAT (VAT 5% Amount, if applicable)
 *   Cr. Accounts Payable (Total Amount)
 *   Cr. Purchase Discount (Discount, if applicable)
 */
export async function postSupplierBillJournalEntry(params: {
  billId: string;
  billNumber: string;
  billDate: Date;
  supplierName: string;
  supplierId?: string | null;
  projectId?: string | null;
  subtotal: number;
  discount?: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.billDate);

  const accounts = await getStandardAccounts();
  const cleanBill = extractCleanSeq(params.billNumber);
  const entryNumber = `JE-BILL-${cleanBill}`;

  const discountAmount = Math.max(0, Math.round(Number(params.discount || 0) * 100) / 100);
  const vatAmount = Math.max(0, Math.round(Number(params.vatAmount || 0) * 100) / 100);
  const totalAmount = Math.round(Number(params.totalAmount || 0) * 100) / 100;
  const netSubtotal = Math.round((totalAmount - vatAmount) * 100) / 100;
  const grossSubtotal = Math.round((netSubtotal + discountAmount) * 100) / 100;

  const lines: any[] = [];

  // 1. Debit Purchase Materials / Expense
  const expenseDebit = discountAmount > 0 ? grossSubtotal : netSubtotal;
  lines.push({
    accountId: accounts.materialCost.id,
    debit: expenseDebit,
    credit: 0,
    currency: "AED",
    fxRate: 1,
    debitAed: expenseDebit,
    creditAed: 0,
    contactId: params.supplierId || null,
    contactName: params.supplierName || null,
    projectId: params.projectId || null,
    description: `Purchase Materials / Expenses - Bill ${params.billNumber}`,
  });

  // 2. Debit Input VAT (if applicable)
  if (vatAmount > 0) {
    lines.push({
      accountId: accounts.inputVat.id,
      debit: vatAmount,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: vatAmount,
      creditAed: 0,
      taxRate: 5,
      taxType: "STANDARD_PURCHASES",
      taxAmount: vatAmount,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Input VAT 5% on Bill ${params.billNumber}`,
    });
  }

  // 3. Credit Accounts Payable
  lines.push({
    accountId: accounts.ap.id,
    debit: 0,
    credit: totalAmount,
    currency: "AED",
    fxRate: 1,
    debitAed: 0,
    creditAed: totalAmount,
    contactId: params.supplierId || null,
    contactName: params.supplierName || null,
    projectId: params.projectId || null,
    description: `Accounts Payable - Bill ${params.billNumber} (${params.supplierName})`,
  });

  // 4. Credit Purchase Discount (if applicable)
  if (discountAmount > 0) {
    lines.push({
      accountId: accounts.expenseDiscount.id,
      debit: 0,
      credit: discountAmount,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: discountAmount,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Purchase Discount received on Bill ${params.billNumber}`,
    });
  }

  // Double-entry validation
  const totalDebit = lines.reduce((s, l) => s + Number(l.debitAed), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.creditAed), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    throw new Error(
      `Cannot post unbalanced journal entry for Bill ${params.billNumber}. Total Debit: AED ${totalDebit.toFixed(2)}, Total Credit: AED ${totalCredit.toFixed(2)}`
    );
  }

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.billDate,
      description: `Supplier Bill ${params.billNumber} - ${params.supplierName}`,
      reference: params.billNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Post Supplier Payment to General Ledger:
 * Dr. Accounts Payable (Amount)
 *   Cr. Bank / Cash (Amount)
 */
export async function postSupplierPaymentJournalEntry(params: {
  paymentId: string;
  paymentNumber: string;
  paymentDate: Date;
  supplierName: string;
  supplierId?: string | null;
  projectId?: string | null;
  amount: number;
  paymentMethod: string;
  billNumber?: string;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.paymentDate);

  const accounts = await getStandardAccounts();
  const creditAccount =
    params.paymentMethod === "CASH" ? accounts.cash : accounts.bank;

  const cleanPay = extractCleanSeq(params.paymentNumber);
  const entryNumber = `JE-PAY-${cleanPay}`;
  const amt = Math.round(Number(params.amount) * 100) / 100;

  const lines = [
    {
      accountId: accounts.ap.id,
      debit: amt,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: amt,
      creditAed: 0,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Accounts payable settlement: ${params.paymentNumber}`,
    },
    {
      accountId: creditAccount.id,
      debit: 0,
      credit: amt,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: amt,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Supplier payment disbursement: ${params.paymentNumber}${params.billNumber ? ` (Bill: ${params.billNumber})` : ""}`,
    },
  ];

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.paymentDate,
      description: `Supplier Payment ${params.paymentNumber} - ${params.supplierName}${params.billNumber ? ` (Bill: ${params.billNumber})` : ""}`,
      reference: params.paymentNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Post Credit Note (Sales Return) to General Ledger:
 * Dr. Sales Revenue (Subtotal)
 * Dr. Output VAT (VAT Amount, if applicable)
 *   Cr. Accounts Receivable (Total Amount)
 */
export async function postCreditNoteJournalEntry(params: {
  creditNoteId: string;
  creditNoteNumber: string;
  returnDate: Date;
  customerName: string;
  customerId?: string | null;
  projectId?: string | null;
  subtotal: number;
  discount?: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.returnDate);

  const accounts = await getStandardAccounts();
  const cleanCn = extractCleanSeq(params.creditNoteNumber);
  const entryNumber = `JE-CN-${cleanCn}`;

  const vatAmount = Math.max(0, Math.round(Number(params.vatAmount || 0) * 100) / 100);
  const totalAmount = Math.round(Number(params.totalAmount || 0) * 100) / 100;
  const netSubtotal = Math.round((totalAmount - vatAmount) * 100) / 100;

  const lines: any[] = [
    {
      accountId: accounts.salesRevenue.id,
      debit: netSubtotal,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: netSubtotal,
      creditAed: 0,
      contactId: params.customerId || null,
      contactName: params.customerName || null,
      projectId: params.projectId || null,
      description: `Credit Note revenue reversal: ${params.creditNoteNumber}`,
    },
  ];

  if (vatAmount > 0) {
    lines.push({
      accountId: accounts.outputVat.id,
      debit: vatAmount,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: vatAmount,
      creditAed: 0,
      taxRate: 5,
      taxType: "STANDARD_SALES",
      taxAmount: vatAmount,
      contactId: params.customerId || null,
      contactName: params.customerName || null,
      projectId: params.projectId || null,
      description: `Output VAT reversal on Credit Note ${params.creditNoteNumber}`,
    });
  }

  lines.push({
    accountId: accounts.ar.id,
    debit: 0,
    credit: totalAmount,
    currency: "AED",
    fxRate: 1,
    debitAed: 0,
    creditAed: totalAmount,
    contactId: params.customerId || null,
    contactName: params.customerName || null,
    projectId: params.projectId || null,
    description: `Credit Note receivable reduction: ${params.creditNoteNumber} - ${params.customerName}`,
  });

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.returnDate,
      description: `Credit Note ${params.creditNoteNumber} - ${params.customerName}`,
      reference: params.creditNoteNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Post Debit Note (Purchase Return) to General Ledger:
 * Dr. Accounts Payable (Total Amount)
 *   Cr. Purchase Materials / Expense (Subtotal)
 *   Cr. Input VAT (VAT Amount, if applicable)
 */
export async function postDebitNoteJournalEntry(params: {
  debitNoteId: string;
  debitNoteNumber: string;
  returnDate: Date;
  supplierName: string;
  supplierId?: string | null;
  projectId?: string | null;
  subtotal: number;
  discount?: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  await FiscalLockService.assertPeriodNotLocked(params.returnDate);

  const accounts = await getStandardAccounts();
  const cleanDn = extractCleanSeq(params.debitNoteNumber);
  const entryNumber = `JE-DN-${cleanDn}`;

  const vatAmount = Math.max(0, Math.round(Number(params.vatAmount || 0) * 100) / 100);
  const totalAmount = Math.round(Number(params.totalAmount || 0) * 100) / 100;
  const netSubtotal = Math.round((totalAmount - vatAmount) * 100) / 100;

  const lines: any[] = [
    {
      accountId: accounts.ap.id,
      debit: totalAmount,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: totalAmount,
      creditAed: 0,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Debit Note payable reduction: ${params.debitNoteNumber} - ${params.supplierName}`,
    },
    {
      accountId: accounts.materialCost.id,
      debit: 0,
      credit: netSubtotal,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: netSubtotal,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Debit Note material purchase return: ${params.debitNoteNumber}`,
    },
  ];

  if (vatAmount > 0) {
    lines.push({
      accountId: accounts.inputVat.id,
      debit: 0,
      credit: vatAmount,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: vatAmount,
      taxRate: 5,
      taxType: "STANDARD_PURCHASES",
      taxAmount: vatAmount,
      contactId: params.supplierId || null,
      contactName: params.supplierName || null,
      projectId: params.projectId || null,
      description: `Input VAT reversal on Debit Note ${params.debitNoteNumber}`,
    });
  }

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.returnDate,
      description: `Debit Note ${params.debitNoteNumber} - ${params.supplierName}`,
      reference: params.debitNoteNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: lines,
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Converts a Received Purchase Order into a Supplier Bill and automatically posts the Journal Entry:
 * Dr. 5010 Purchase Materials (Net subtotal)
 * Dr. 2200 Input VAT (5% tax)
 *   Cr. 2000 Accounts Payable (Gross total)
 */
export async function convertPurchaseOrderToBill(poId: string, userId: string, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  const po = await db.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      supplier: true,
      items: {
        include: { product: true },
      },
      supplierBills: {
        include: { journalEntry: true },
      },
    },
  });

  if (!po) {
    throw new Error("Purchase order not found");
  }

  // Idempotency: If a posted bill already exists for this PO, return it
  const existingBill = po.supplierBills.find((b) => b.status === "POSTED" || b.journalEntryId);
  if (existingBill) {
    return {
      success: true,
      alreadyConverted: true,
      bill: existingBill,
      journalEntryId: existingBill.journalEntryId,
    };
  }

  let subtotal = 0;
  const billItems = po.items.map((item) => {
    const qty = Math.max(1, Number(item.quantityOrdered) || 1);
    const unitCost = Number(item.unitCost) || 0;
    const total = Math.round(qty * unitCost * 100) / 100;
    subtotal += total;

    return {
      productId: item.productId,
      description: item.product?.name || item.itemNotes || `Item from PO ${po.poNumber}`,
      quantity: qty,
      unit: item.product?.unit || "PCS",
      unitCost,
      totalAmount: total,
    };
  });

  // Calculate 5% UAE VAT
  const vatRate = 5.0;
  const vatAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  const cleanSeq = extractCleanSeq(po.poNumber);
  const billNumber = `BILL-${cleanSeq}`;

  const billDate = po.orderDate ? new Date(po.orderDate) : new Date();

  // Create SupplierBill
  const bill = await db.supplierBill.create({
    data: {
      billNumber,
      supplierId: po.supplierId,
      supplierName: po.supplier?.name || po.shopName || "Vendor",
      supplierTrn: po.supplier?.trn || null,
      purchaseOrderId: po.id,
      billDate,
      dueDate: new Date(billDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "POSTED",
      subtotal,
      discount: 0,
      vatRate,
      vatAmount,
      totalAmount,
      paidAmount: 0,
      remainingBalance: totalAmount,
      createdById: userId,
      items: {
        create: billItems,
      },
    },
  });

  // Post Journal Entry
  const je = await postSupplierBillJournalEntry({
    billId: bill.id,
    billNumber: bill.billNumber,
    billDate: bill.billDate,
    supplierName: bill.supplierName,
    supplierId: bill.supplierId,
    subtotal: Number(bill.subtotal),
    vatAmount: Number(bill.vatAmount),
    totalAmount: Number(bill.totalAmount),
    userId,
  }, tx);

  // Link Journal Entry back to the bill
  const updatedBill = await db.supplierBill.update({
    where: { id: bill.id },
    data: {
      journalEntryId: je.id,
      postedAt: new Date(),
    },
    include: {
      items: true,
      journalEntry: true,
    },
  });

  return {
    success: true,
    alreadyConverted: false,
    bill: updatedBill,
    journalEntryId: je.id,
  };
}
