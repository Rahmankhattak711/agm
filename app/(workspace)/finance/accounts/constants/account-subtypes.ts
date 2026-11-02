import { AccountSubtypeDef } from "../types";

export const ACCOUNT_SUBTYPES: AccountSubtypeDef[] = [
  // ==========================================
  // ASSET SUBTYPES
  // ==========================================
  {
    label: "Cash and Cash Equivalents",
    type: "ASSET",
    cashFlow: "Cash",
    enablePayments: true,
    parentPrefixes: ["11", "111"],
    description: "Physical cash on hand, bank petty cash registers, till balances",
  },
  {
    label: "Bank Account",
    type: "ASSET",
    cashFlow: "Cash",
    enablePayments: true,
    parentPrefixes: ["11", "111"],
    description: "Corporate checking accounts, local/foreign currency bank accounts",
  },
  {
    label: "Accounts Receivable",
    type: "ASSET",
    cashFlow: "Operating",
    enablePayments: false,
    parentPrefixes: ["11", "112"],
    description: "Trade receivables from invoiced clients awaiting settlement",
  },
  {
    label: "Prepayments and Advances",
    type: "ASSET",
    cashFlow: "Operating",
    parentPrefixes: ["11", "113"],
    description: "Advance payments to subcontractors, advance office rent, insurance",
  },
  {
    label: "Inventory Asset",
    type: "ASSET",
    cashFlow: "Operating",
    parentPrefixes: ["11", "114"],
    description: "Raw material stocks, warehouse goods, job-site materials",
  },
  {
    label: "Fixed Assets",
    type: "ASSET",
    cashFlow: "Investing",
    parentPrefixes: ["12", "121"],
    description: "Office equipment, fabrication machinery, company vehicles",
  },
  {
    label: "Accumulated Depreciation",
    type: "ASSET",
    cashFlow: "Investing",
    parentPrefixes: ["12", "121"],
    description: "Cumulative depreciation write-downs of plant, vehicles & equipment",
  },
  {
    label: "Security Deposits",
    type: "ASSET",
    cashFlow: "Investing",
    parentPrefixes: ["12", "122"],
    description: "Refundable commercial lease deposits, tender bonds, DEWA deposits",
  },

  // ==========================================
  // LIABILITY SUBTYPES
  // ==========================================
  {
    label: "Accounts Payable",
    type: "LIABILITY",
    cashFlow: "Operating",
    parentPrefixes: ["21", "211"],
    description: "Trade vendor bills and contractor payables awaiting payment",
  },
  {
    label: "VAT Output Tax",
    type: "LIABILITY",
    cashFlow: "Operating",
    parentPrefixes: ["21", "212"],
    description: "5% standard VAT collected on sales invoices for UAE FTA filing",
  },
  {
    label: "VAT Input Tax",
    type: "LIABILITY",
    cashFlow: "Operating",
    parentPrefixes: ["21", "212"],
    description: "5% recoverable VAT paid on vendor bills and materials",
  },
  {
    label: "Payroll and Staff Payable",
    type: "LIABILITY",
    cashFlow: "Operating",
    parentPrefixes: ["21", "213"],
    description: "Accrued salaries, unpaid staff commissions, end of service gratuity",
  },
  {
    label: "Accrued Expenses",
    type: "LIABILITY",
    cashFlow: "Operating",
    parentPrefixes: ["21", "213"],
    description: "Expenses incurred in period but invoice not yet received",
  },
  {
    label: "Long-Term Loans and Financing",
    type: "LIABILITY",
    cashFlow: "Financing",
    parentPrefixes: ["22", "221"],
    description: "Commercial term loans and facilities due beyond 12 months",
  },

  // ==========================================
  // EQUITY SUBTYPES
  // ==========================================
  {
    label: "Owner's Capital",
    type: "EQUITY",
    cashFlow: "Financing",
    parentPrefixes: ["32", "321"],
    description: "Paid-in capital contributions by owners or partners",
  },
  {
    label: "Owner's Drawings",
    type: "EQUITY",
    cashFlow: "Financing",
    parentPrefixes: ["32", "321"],
    description: "Direct withdrawals by business owners for personal use",
  },
  {
    label: "Retained Earnings",
    type: "EQUITY",
    cashFlow: "Financing",
    parentPrefixes: ["33", "331"],
    description: "Accumulated net profit retained in company over time",
  },

  // ==========================================
  // REVENUE SUBTYPES
  // ==========================================
  {
    label: "Sales Revenue",
    type: "REVENUE",
    cashFlow: "Operating",
    parentPrefixes: ["41", "411"],
    description: "Commercial sales of products and contracting services",
  },
  {
    label: "Service Income",
    type: "REVENUE",
    cashFlow: "Operating",
    parentPrefixes: ["41", "411"],
    description: "Contracting, design, turnkey fitout, and consultancy services",
  },
  {
    label: "Sales Discount",
    type: "REVENUE",
    cashFlow: "Operating",
    parentPrefixes: ["41", "411"],
    description: "Trade discounts granted to customers on sales invoices",
  },
  {
    label: "Other Income",
    type: "REVENUE",
    cashFlow: "Operating",
    parentPrefixes: ["42", "421"],
    description: "Incidental non-core earnings and miscellaneous receipts",
  },

  // ==========================================
  // EXPENSE SUBTYPES
  // ==========================================
  {
    label: "Cost of Goods Sold",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["51", "511"],
    description: "Direct costs required to deliver project contracts or products",
  },
  {
    label: "Purchase Materials",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["51", "511"],
    description: "Project materials, finishes, timber, gypsum, glass",
  },
  {
    label: "Subcontractor Costs",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["51", "511"],
    description: "Specialized trades, MEP, flooring, glass installation contractors",
  },
  {
    label: "General and Administrative",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["52", "521"],
    description: "Standard daily operating overhead of running the company",
  },
  {
    label: "Office Supplies",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["52", "521"],
    description: "Paper, printing consumables, stationery, pantry supplies",
  },
  {
    label: "Marketing and Advertising",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["52", "521"],
    description: "Social media ads, print campaigns, exhibitions, branding",
  },
  {
    label: "Travel and Entertainment",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["52", "521"],
    description: "Staff flight tickets, client entertainment, lodging",
  },
  {
    label: "Salaries and Employee Wages",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["52", "522"],
    description: "Monthly staff payroll, overtime, incentives, commissions",
  },
  {
    label: "Staff Visa and Medical Insurance",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["52", "522"],
    description: "Government residency processing, MOHRE fees, health cards",
  },
  {
    label: "Rent Expense",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["52", "523"],
    description: "Office, warehouse, and showroom commercial lease rentals",
  },
  {
    label: "Utilities Expense",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["52", "523"],
    description: "Electricity (DEWA), water, municipal utility services",
  },
  {
    label: "Telecom and Internet",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["52", "523"],
    description: "Fiber internet lines, cloud phone PBX, company SIM plans",
  },
  {
    label: "Discount",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["51", "511", "52", "521", "522", "523"],
    description: "Discounts and allowances, settlement discounts or promotional allowances",
  },
  {
    label: "Software and IT Subscriptions",
    type: "EXPENSE",
    cashFlow: "Operating",
    showInExpenseClaims: true,
    parentPrefixes: ["52", "521"],
    description: "Cloud apps, ERP, Microsoft 365, SaaS software subscriptions",
  },
  {
    label: "Bank Fees and Charges",
    type: "EXPENSE",
    cashFlow: "Operating",
    parentPrefixes: ["53", "531"],
    description: "Bank transfer charges, credit card processing commissions",
  },
];
