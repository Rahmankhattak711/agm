import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma";
import { TaxCategoryType } from "./tax-engine.service";

export interface CreateJournalLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  currency?: string;
  fxRate?: number;
  taxRate?: number;
  taxType?: TaxCategoryType;
  taxAmount?: number;
  projectId?: string | null;
  contactId?: string | null;
  contactName?: string | null;
  branch?: string | null;
  costCenter?: string | null;
}

export interface CreateJournalEntryInput {
  entryDate: Date | string;
  reference?: string;
  description?: string; // Solid main notes
  isPosted?: boolean;
  createdBy: string;
  lines: CreateJournalLineInput[];
}

export class LedgerPostingService {
  /**
   * Generates sequential SYS-MJ-x numbering
   */
  static async generateEntryNumber(): Promise<string> {
    const count = await prisma.journalEntry.count();
    return `JE-${(count + 1).toString().padStart(4, "0")}`;
  }

  /**
   * Validates double-entry balancing rule: Total Debit === Total Credit
   */
  static validateDoubleEntry(lines: CreateJournalLineInput[]): {
    isValid: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const fx = line.fxRate && line.fxRate > 0 ? Number(line.fxRate) : 1;
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;
      totalDebit += d * fx;
      totalCredit += c * fx;
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;
    const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;

    return {
      isValid: difference === 0,
      totalDebit,
      totalCredit,
      difference,
    };
  }

  /**
   * Creates a full double-entry journal entry with line-level project & tax dimensions
   */
  static async createJournalEntry(input: CreateJournalEntryInput, tx?: Prisma.TransactionClient) {
    const { isValid, totalDebit, totalCredit, difference } = this.validateDoubleEntry(input.lines);

    if (input.isPosted && !isValid) {
      throw new Error(
        `Cannot post unbalanced journal entry. Total Debit: ${totalDebit} AED, Total Credit: ${totalCredit} AED (Difference: ${difference} AED)`
      );
    }

    const entryNumber = await this.generateEntryNumber();
    const entryDate = new Date(input.entryDate);

    const executeCreate = async (client: Prisma.TransactionClient | typeof prisma) => {
      return await client.journalEntry.create({
        data: {
          entryNumber,
          entryDate,
          description: input.description,
          reference: input.reference,
          isPosted: input.isPosted ?? false,
          createdBy: input.createdBy,
          lines: {
            create: input.lines.map((line) => {
              const fx = line.fxRate && line.fxRate > 0 ? Number(line.fxRate) : 1;
              const d = Number(line.debit) || 0;
              const c = Number(line.credit) || 0;

              return {
                accountId: line.accountId,
                description: line.description,
                debit: d,
                credit: c,
                currency: line.currency || "AED",
                fxRate: fx,
                debitAed: Math.round(d * fx * 100) / 100,
                creditAed: Math.round(c * fx * 100) / 100,
                taxRate: line.taxRate || 0,
                taxType: line.taxType || "OUT_OF_SCOPE",
                taxAmount: line.taxAmount || 0,
                projectId: line.projectId || null,
                contactId: line.contactId || null,
                contactName: line.contactName || null,
                branch: line.branch || null,
                costCenter: line.costCenter || null,
              };
            }),
          },
        },
        include: {
          lines: {
            include: {
              account: true,
              project: true,
            },
          },
        },
      });
    };

    if (tx) {
      return await executeCreate(tx);
    }

    return await prisma.$transaction(async (innerTx) => {
      return await executeCreate(innerTx);
    });
  }

  /**
   * Posts an approved Sales Invoice to General Ledger
   */
  static async postSalesInvoiceToLedger(invoiceId: string, createdBy: string, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    const invoice = await db.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
      },
    });

    if (!invoice) throw new Error("Sales Invoice not found");
    if (invoice.journalEntryId) return invoice.journalEntryId; // Already posted

    // 1. Find Accounts Receivable account (112 or code 1200)
    const arAccount = await db.chartOfAccount.findFirst({
      where: {
        OR: [
          { accountCode: "112" },
          { accountCode: "1200" },
          { accountName: { contains: "Receivable", mode: "insensitive" } },
        ],
      },
    });

    // 2. Find Sales Revenue account (411 or code 4000)
    const revenueAccount = await db.chartOfAccount.findFirst({
      where: {
        OR: [
          { accountCode: "411" },
          { accountCode: "4000" },
          { accountName: { contains: "Revenue", mode: "insensitive" } },
        ],
      },
    });

    // 3. Find VAT Output account (218 or code 2210)
    const vatAccount = await db.chartOfAccount.findFirst({
      where: {
        OR: [
          { accountCode: "218" },
          { accountCode: "2210" },
          { accountName: { contains: "VAT", mode: "insensitive" } },
        ],
      },
    });

    if (!arAccount || !revenueAccount) {
      throw new Error("Standard AR or Revenue account not configured in Chart of Accounts");
    }

    const grossAmount = Number(invoice.totalAmount);
    const vatAmount = Number(invoice.vatAmount);
    const subtotal = Number(invoice.subtotal);

    const lines: CreateJournalLineInput[] = [
      // Debit Accounts Receivable (Full Gross Amount)
      {
        accountId: arAccount.id,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        debit: grossAmount,
        credit: 0,
        contactId: invoice.customerId,
        contactName: invoice.customerName,
      },
      // Credit Sales Revenue (Net Subtotal)
      {
        accountId: revenueAccount.id,
        description: `Sales revenue for ${invoice.invoiceNumber}`,
        debit: 0,
        credit: subtotal,
        contactId: invoice.customerId,
        contactName: invoice.customerName,
      },
    ];

    // Credit VAT Output if applicable
    if (vatAmount > 0 && vatAccount) {
      lines.push({
        accountId: vatAccount.id,
        description: `Output VAT for ${invoice.invoiceNumber}`,
        debit: 0,
        credit: vatAmount,
        taxRate: 5,
        taxType: "STANDARD_SALES",
        taxAmount: vatAmount,
      });
    }

    const journal = await this.createJournalEntry({
      entryDate: invoice.invoiceDate,
      reference: invoice.invoiceNumber,
      description: `Sales Invoice ${invoice.invoiceNumber} posted to Ledger`,
      isPosted: true,
      createdBy,
      lines,
    }, tx);

    await db.salesInvoice.update({
      where: { id: invoiceId },
      data: { journalEntryId: journal.id },
    });

    return journal.id;
  }
}
