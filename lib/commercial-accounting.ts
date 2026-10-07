import prisma from "@/lib/prisma";

export async function findOrCreateAccount(
  code: string,
  name: string,
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
) {
  let account = await prisma.chartOfAccount.findFirst({
    where: {
      OR: [
        { accountCode: code },
        { accountName: { equals: name, mode: "insensitive" } },
      ],
    },
  });

  if (!account) {
    account = await prisma.chartOfAccount.create({
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

let cachedStandardAccounts: any = null;

export async function getStandardAccounts() {
  if (cachedStandardAccounts) {
    return cachedStandardAccounts;
  }
  const [ar, ap, bank, cash, outputVat, inputVat, salesRevenue, materialCost] =
    await Promise.all([
      findOrCreateAccount("1200", "Account Recievable", "ASSET"),
      findOrCreateAccount("2000", "Accounts Payable", "LIABILITY"),
      findOrCreateAccount("1020", "RAK Bank", "ASSET"),
      findOrCreateAccount("1010", "Cash on Hand", "ASSET"),
      findOrCreateAccount("2210", "VAT Output Tax Payable", "LIABILITY"),
      findOrCreateAccount("2200", "VAT Input Tax Payable", "LIABILITY"),
      findOrCreateAccount("4000", "Service Income", "REVENUE"),
      findOrCreateAccount("5010", "Purchase Materials", "EXPENSE"),
    ]);

  cachedStandardAccounts = {
    ar,
    ap,
    bank,
    cash,
    outputVat,
    inputVat,
    salesRevenue,
    materialCost,
  };
  return cachedStandardAccounts;
}

export async function postSalesInvoiceJournalEntry(params: {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}) {
  const accounts = await getStandardAccounts();

  const entryNumber = `JE-INV-${params.invoiceNumber}-${Date.now().toString().slice(-4)}`;

  const lines: any[] = [
    {
      accountId: accounts.ar.id,
      debit: params.totalAmount,
      credit: 0,
    },
    {
      accountId: accounts.salesRevenue.id,
      debit: 0,
      credit: params.subtotal,
    },
  ];

  if (params.vatAmount > 0) {
    lines.push({
      accountId: accounts.outputVat.id,
      debit: 0,
      credit: params.vatAmount,
    });
  }

  const journalEntry = await prisma.journalEntry.create({
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
  });

  return journalEntry;
}

export async function postCustomerPaymentJournalEntry(params: {
  paymentId: string;
  receiptNumber: string;
  paymentDate: Date;
  customerName: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber?: string;
  userId: string;
}) {
  const accounts = await getStandardAccounts();
  const debitAccount =
    params.paymentMethod === "CASH" ? accounts.cash : accounts.bank;

  const entryNumber = `JE-REC-${params.receiptNumber}-${Date.now().toString().slice(-4)}`;

  const journalEntry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.paymentDate,
      description: `Customer Receipt ${params.receiptNumber} - ${params.customerName}${params.invoiceNumber ? ` (Inv: ${params.invoiceNumber})` : ""}`,
      reference: params.receiptNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: [
          {
            accountId: debitAccount.id,
            debit: params.amount,
            credit: 0,
          },
          {
            accountId: accounts.ar.id,
            debit: 0,
            credit: params.amount,
          },
        ],
      },
    },
  });

  return journalEntry;
}

export async function postSupplierBillJournalEntry(params: {
  billId: string;
  billNumber: string;
  billDate: Date;
  supplierName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}) {
  const accounts = await getStandardAccounts();
  const entryNumber = `JE-BILL-${params.billNumber}-${Date.now().toString().slice(-4)}`;

  const lines: any[] = [
    {
      accountId: accounts.materialCost.id,
      debit: params.subtotal,
      credit: 0,
    },
  ];

  if (params.vatAmount > 0) {
    lines.push({
      accountId: accounts.inputVat.id,
      debit: params.vatAmount,
      credit: 0,
    });
  }

  lines.push({
    accountId: accounts.ap.id,
    debit: 0,
    credit: params.totalAmount,
  });

  const journalEntry = await prisma.journalEntry.create({
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
  });

  return journalEntry;
}

export async function postSupplierPaymentJournalEntry(params: {
  paymentId: string;
  paymentNumber: string;
  paymentDate: Date;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  billNumber?: string;
  userId: string;
}) {
  const accounts = await getStandardAccounts();
  const creditAccount =
    params.paymentMethod === "CASH" ? accounts.cash : accounts.bank;

  const entryNumber = `JE-PAY-${params.paymentNumber}-${Date.now().toString().slice(-4)}`;

  const journalEntry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      entryDate: params.paymentDate,
      description: `Supplier Payment ${params.paymentNumber} - ${params.supplierName}${params.billNumber ? ` (Bill: ${params.billNumber})` : ""}`,
      reference: params.paymentNumber,
      isPosted: true,
      createdBy: params.userId,
      lines: {
        create: [
          {
            accountId: accounts.ap.id,
            debit: params.amount,
            credit: 0,
          },
          {
            accountId: creditAccount.id,
            debit: 0,
            credit: params.amount,
          },
        ],
      },
    },
  });

  return journalEntry;
}

export async function postCreditNoteJournalEntry(params: {
  creditNoteId: string;
  creditNoteNumber: string;
  returnDate: Date;
  customerName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}) {
  const accounts = await getStandardAccounts();
  const entryNumber = `JE-CN-${params.creditNoteNumber}-${Date.now().toString().slice(-4)}`;

  const lines: any[] = [
    {
      accountId: accounts.salesRevenue.id,
      debit: params.subtotal,
      credit: 0,
    },
  ];

  if (params.vatAmount > 0) {
    lines.push({
      accountId: accounts.outputVat.id,
      debit: params.vatAmount,
      credit: 0,
    });
  }

  lines.push({
    accountId: accounts.ar.id,
    debit: 0,
    credit: params.totalAmount,
  });

  const journalEntry = await prisma.journalEntry.create({
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
  });

  return journalEntry;
}

export async function postDebitNoteJournalEntry(params: {
  debitNoteId: string;
  debitNoteNumber: string;
  returnDate: Date;
  supplierName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}) {
  const accounts = await getStandardAccounts();
  const entryNumber = `JE-DN-${params.debitNoteNumber}-${Date.now().toString().slice(-4)}`;

  const lines: any[] = [
    {
      accountId: accounts.ap.id,
      debit: params.totalAmount,
      credit: 0,
    },
    {
      accountId: accounts.materialCost.id,
      debit: 0,
      credit: params.subtotal,
    },
  ];

  if (params.vatAmount > 0) {
    lines.push({
      accountId: accounts.inputVat.id,
      debit: 0,
      credit: params.vatAmount,
    });
  }

  const journalEntry = await prisma.journalEntry.create({
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
  });

  return journalEntry;
}
