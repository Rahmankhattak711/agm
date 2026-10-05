import { ChartOfAccount } from "@/lib/hooks/api-hooks";

export interface AccountTypeConfig {
  value: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  label: string;
  codeRange: string;
  color: string;
  accentColor: string;
  headerBg: string;
  badgeColor: string;
  drCr: "Dr" | "Cr";
}

export const ACCOUNT_TYPES: AccountTypeConfig[] = [
  {
    value: "ASSET",
    label: "Assets",
    codeRange: "1000 - 1999",
    color: "bg-sky-50 text-sky-800 border-sky-200",
    accentColor: "bg-sky-500",
    headerBg: "bg-sky-50/70 hover:bg-sky-100/60 border-sky-200/80",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    drCr: "Dr",
  },
  {
    value: "LIABILITY",
    label: "Liabilities",
    codeRange: "2000 - 2999",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    accentColor: "bg-amber-500",
    headerBg: "bg-amber-50/70 hover:bg-amber-100/60 border-amber-200/80",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    drCr: "Cr",
  },
  {
    value: "EQUITY",
    label: "Equity",
    codeRange: "3000 - 3999",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    accentColor: "bg-purple-500",
    headerBg: "bg-purple-50/70 hover:bg-purple-100/60 border-purple-200/80",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    drCr: "Cr",
  },
  {
    value: "REVENUE",
    label: "Revenue",
    codeRange: "4000 - 4999",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accentColor: "bg-emerald-500",
    headerBg: "bg-emerald-50/70 hover:bg-emerald-100/60 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    drCr: "Cr",
  },
  {
    value: "EXPENSE",
    label: "Expenses",
    codeRange: "5000 - 5999",
    color: "bg-rose-50 text-rose-800 border-rose-200",
    accentColor: "bg-rose-500",
    headerBg: "bg-rose-50/70 hover:bg-rose-100/60 border-rose-200/80",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    drCr: "Dr",
  },
];

export type HierarchicalAccount = ChartOfAccount & {
  subAccounts: ChartOfAccount[];
};
