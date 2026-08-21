export type ReportTab =
  | "summary"
  | "quotation"
  | "profit-loss"
  | "balance-sheet"
  | "trial-balance"
  | "ledger"
  | "vat-summary";

export type QuarterTab = "ALL" | "Q1" | "Q2" | "Q3" | "Q4";

export const formatCurrency = (val: number | string | undefined) => {
  const num = Number(val || 0);
  return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (val: number | string | undefined) => {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
