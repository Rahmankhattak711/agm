import prisma from "@/lib/prisma";

/**
 * Acquires a PostgreSQL transaction-level advisory lock to serialize concurrent sequence generation.
 * When inside a $transaction, the lock is automatically released upon COMMIT or ROLLBACK.
 * Gracefully degrades in Vitest mocks, SQLite, or non-Postgres environments.
 */
export async function acquireAdvisoryLock(tx: any, key: string): Promise<void> {
  if (typeof tx?.$executeRawUnsafe === "function") {
    try {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        key,
      );
    } catch {
      // In SQLite, Vitest unit tests, or environments where pg_advisory_xact_lock is unavailable,
      // silently fallback to the in-memory uniqueness loop.
    }
  }
}

export async function getNextInvoiceNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_sales_invoice");
  const existing = await tx.salesInvoice.findMany({
    select: { invoiceNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.invoiceNumber.match(/(?:INV-)?(?:20\d{2}-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `INV-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.salesInvoice.findUnique({ where: { invoiceNumber: candidate } })
  ) {
    nextNum++;
    candidate = `INV-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextProjectCode(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_project_code");
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;
  const existing = await tx.project.findMany({
    where: { projectCode: { startsWith: prefix } },
    select: { projectCode: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const numPart = item.projectCode.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  while (await tx.project.findUnique({ where: { projectCode: candidate } })) {
    nextNum++;
    candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextReceiptNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_customer_receipt");
  const existing = await tx.customerPayment.findMany({
    select: { receiptNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.receiptNumber?.match(/(?:REC-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `REC-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.customerPayment.findUnique({ where: { receiptNumber: candidate } })
  ) {
    nextNum++;
    candidate = `REC-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextPaymentNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_supplier_payment");
  const existing = await tx.supplierPayment.findMany({
    select: { paymentNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.paymentNumber?.match(/(?:(?:SPAY|PAY)-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `SPAY-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.supplierPayment.findUnique({ where: { paymentNumber: candidate } })
  ) {
    nextNum++;
    candidate = `SPAY-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextBillNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_supplier_bill");
  const existing = await tx.supplierBill.findMany({
    select: { billNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.billNumber?.match(/(?:BILL-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `BILL-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.supplierBill.findUnique({ where: { billNumber: candidate } })
  ) {
    nextNum++;
    candidate = `BILL-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextCreditNoteNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_credit_note");
  const existing = await tx.creditNote.findMany({
    select: { creditNoteNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.creditNoteNumber?.match(/(?:CN-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `CN-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.creditNote.findUnique({ where: { creditNoteNumber: candidate } })
  ) {
    nextNum++;
    candidate = `CN-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextDebitNoteNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_debit_note");
  const existing = await tx.debitNote.findMany({
    select: { debitNoteNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const match = item.debitNoteNumber?.match(/(?:DN-)?(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `DN-${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.debitNote.findUnique({ where: { debitNoteNumber: candidate } })
  ) {
    nextNum++;
    candidate = `DN-${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}

export async function getNextExpenseNumber(tx: any = prisma): Promise<string> {
  await acquireAdvisoryLock(tx, "sequence_expense");
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const existing = await tx.expense.findMany({
    where: { expenseNumber: { startsWith: prefix } },
    select: { expenseNumber: true },
  });

  let maxNum = 0;
  for (const item of existing) {
    const numPart = item.expenseNumber?.slice(prefix.length);
    if (numPart) {
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  while (
    await tx.expense.findUnique({ where: { expenseNumber: candidate } })
  ) {
    nextNum++;
    candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
  }

  return candidate;
}
