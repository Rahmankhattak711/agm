import prisma from "@/lib/prisma";
import { SYSTEM_ACCOUNT_CODES, STANDARD_SYSTEM_TEMPLATES } from "../constants/system-accounts";

export class AccountResolverService {
  private static cache: Map<string, any> = new Map();

  /**
   * Clears in-memory cache when accounts are created, updated, or deleted
   */
  public static clearCache() {
    this.cache.clear();
  }

  /**
   * Finds an account by code or initializes it systematically from standard templates
   */
  public static async findOrInitializeAccount(code: string) {
    if (this.cache.has(code)) {
      return this.cache.get(code);
    }

    let account = await prisma.chartOfAccount.findUnique({
      where: { accountCode: code },
    });

    if (!account) {
      // Find template
      const template = STANDARD_SYSTEM_TEMPLATES.find((t) => t.code === code);
      if (template) {
        // Resolve parent account
        const parent = await prisma.chartOfAccount.findUnique({
          where: { accountCode: template.parentCode },
        });

        account = await prisma.chartOfAccount.create({
          data: {
            accountCode: template.code,
            accountName: template.name,
            nameAr: template.nameAr || null,
            type: template.type,
            level: template.level,
            parentId: parent ? parent.id : null,
            accountSubtype: template.accountSubtype,
            cashFlowType: template.cashFlowType,
            allowPosting: template.allowPosting,
            enablePayments: template.enablePayments,
            showInExpenseClaims: template.showInExpenseClaims,
            isSystem: template.isSystem,
            isActive: true,
          },
        });
      } else {
        // Fallback search by partial or name
        account = await prisma.chartOfAccount.findFirst({
          where: {
            OR: [
              { accountCode: { startsWith: code.slice(0, 2) } },
              { accountName: { contains: code, mode: "insensitive" } },
            ],
          },
        });
      }
    }

    if (account) {
      this.cache.set(code, account);
    }

    return account;
  }

  /**
   * Retrieves all standard accounts required for commercial invoicing and billing
   */
  public static async getCommercialSystemAccounts() {
    const [
      ar,
      ap,
      bank,
      cash,
      outputVat,
      inputVat,
      salesRevenue,
      salesDiscount,
      materialCost,
      expenseDiscount,
    ] = await Promise.all([
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.BANK_RAK),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.CASH_ON_HAND),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.VAT_OUTPUT_TAX),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.VAT_INPUT_TAX),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.SALES_REVENUE),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.SALES_DISCOUNT),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.COST_OF_SALES_MATERIALS),
      this.findOrInitializeAccount(SYSTEM_ACCOUNT_CODES.OPERATING_EXPENSE_DISCOUNT),
    ]);

    return {
      ar,
      ap,
      bank,
      cash,
      outputVat,
      inputVat,
      salesRevenue,
      salesDiscount,
      materialCost,
      expenseDiscount,
    };
  }

  /**
   * Resolves double-entry posting accounts specifically for a Sales Invoice
   */
  public static async resolveSalesInvoiceAccounts() {
    const accounts = await this.getCommercialSystemAccounts();
    return {
      receivableAccount: accounts.ar,
      revenueAccount: accounts.salesRevenue,
      discountAccount: accounts.salesDiscount,
      vatAccount: accounts.outputVat,
    };
  }

  /**
   * Resolves double-entry posting accounts specifically for a Supplier Bill
   */
  public static async resolveSupplierBillAccounts() {
    const accounts = await this.getCommercialSystemAccounts();
    return {
      payableAccount: accounts.ap,
      expenseAccount: accounts.materialCost,
      discountAccount: accounts.expenseDiscount,
      vatAccount: accounts.inputVat,
    };
  }
}
