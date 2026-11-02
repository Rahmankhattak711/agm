import { AccountClass } from "../types";

export interface SystemAccountTemplate {
  code: string;
  name: string;
  nameAr?: string;
  type: AccountClass;
  level: number;
  parentCode: string;
  accountSubtype: string;
  cashFlowType: string;
  allowPosting: boolean;
  enablePayments: boolean;
  showInExpenseClaims: boolean;
  isSystem: boolean;
}

export const SYSTEM_ACCOUNT_CODES = {
  // Asset Accounts
  CASH_ON_HAND: "1010",
  BANK_RAK: "1020",
  ACCOUNTS_RECEIVABLE: "1200",
  INVENTORY_ASSET: "1141",

  // Liability Accounts
  ACCOUNTS_PAYABLE: "2000",
  VAT_INPUT_TAX: "2200",  // 5% Recoverable on purchases
  VAT_OUTPUT_TAX: "2210", // 5% Collected on sales

  // Equity Accounts
  OWNER_CAPITAL: "3000",
  RETAINED_EARNINGS: "3100",

  // Revenue Accounts
  SERVICE_INCOME: "4000",
  SALES_REVENUE: "4110",
  SALES_DISCOUNT: "4112", // Contra-revenue discount account

  // Expense Accounts
  COST_OF_SALES_MATERIALS: "5010",
  PURCHASE_DISCOUNT: "5115",
  OPERATING_EXPENSE_DISCOUNT: "5215",
} as const;

export const STANDARD_SYSTEM_TEMPLATES: SystemAccountTemplate[] = [
  {
    code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    name: "Account Receivable",
    nameAr: "المدينون التجاريون",
    type: "ASSET",
    level: 4,
    parentCode: "112",
    accountSubtype: "Accounts receivable",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE,
    name: "Accounts Payable",
    nameAr: "الدائنون والموردون",
    type: "LIABILITY",
    level: 4,
    parentCode: "211",
    accountSubtype: "Accounts payable",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.BANK_RAK,
    name: "RAK Bank",
    nameAr: "بنك رأس الخيمة",
    type: "ASSET",
    level: 4,
    parentCode: "111",
    accountSubtype: "Bank",
    cashFlowType: "Cash",
    allowPosting: true,
    enablePayments: true,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.CASH_ON_HAND,
    name: "Cash on Hand",
    nameAr: "النقدية في الخزينة",
    type: "ASSET",
    level: 4,
    parentCode: "111",
    accountSubtype: "Bank",
    cashFlowType: "Cash",
    allowPosting: true,
    enablePayments: true,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.VAT_OUTPUT_TAX,
    name: "VAT Output Tax (5% Collected)",
    nameAr: "ضريبة القيمة المضافة المحصلة",
    type: "LIABILITY",
    level: 4,
    parentCode: "212",
    accountSubtype: "Taxes payable",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.VAT_INPUT_TAX,
    name: "VAT Input Tax (5% Recoverable)",
    nameAr: "ضريبة القيمة المضافة المستردة",
    type: "LIABILITY",
    level: 4,
    parentCode: "212",
    accountSubtype: "Taxes payable",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.SERVICE_INCOME,
    name: "Service Income",
    nameAr: "إيرادات الخدمات",
    type: "REVENUE",
    level: 4,
    parentCode: "411",
    accountSubtype: "Operating income",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.SALES_REVENUE,
    name: "Sales Revenue",
    nameAr: "إيرادات المبيعات",
    type: "REVENUE",
    level: 4,
    parentCode: "411",
    accountSubtype: "Operating income",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.SALES_DISCOUNT,
    name: "Sales Discounts",
    nameAr: "خصم المبيعات الممنوح",
    type: "REVENUE",
    level: 4,
    parentCode: "411",
    accountSubtype: "Operating income",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.COST_OF_SALES_MATERIALS,
    name: "Purchase Materials",
    nameAr: "مشتريات مواد ومهمات المشاريع",
    type: "EXPENSE",
    level: 4,
    parentCode: "511",
    accountSubtype: "Cost of sales",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: false,
    isSystem: true,
  },
  {
    code: SYSTEM_ACCOUNT_CODES.OPERATING_EXPENSE_DISCOUNT,
    name: "Discounts and Allowances",
    nameAr: "الخصومات والتسويات",
    type: "EXPENSE",
    level: 4,
    parentCode: "521",
    accountSubtype: "Operating expenses",
    cashFlowType: "Operating",
    allowPosting: true,
    enablePayments: false,
    showInExpenseClaims: true,
    isSystem: false,
  },
];
