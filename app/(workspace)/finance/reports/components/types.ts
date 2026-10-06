export { formatNumber, formatCurrency } from "@/lib/utils/format";

export type ReportTab =
  | "hub"
  | "summary"
  | "statement-of-account"
  | "soa"
  | "tax-invoices"
  | "quotation"
  | "profit-loss"
  | "balance-sheet"
  | "trial-balance"
  | "receivables"
  | "payables"
  | "ledger"
  | "vat-summary";

export type QuarterTab = "ALL" | "Q1" | "Q2" | "Q3" | "Q4";
