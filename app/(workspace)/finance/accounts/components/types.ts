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
    color: "bg-purple-50 text-purple-900 border-purple-200",
    accentColor: "bg-purple-600",
    headerBg: "bg-purple-100/70 hover:bg-purple-100/90 border-purple-200 text-purple-950",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    drCr: "Dr",
  },
  {
    value: "LIABILITY",
    label: "Liabilities",
    codeRange: "2000 - 2999",
    color: "bg-rose-50 text-rose-900 border-rose-200",
    accentColor: "bg-rose-600",
    headerBg: "bg-rose-100/70 hover:bg-rose-100/90 border-rose-200 text-rose-950",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    drCr: "Cr",
  },
  {
    value: "EQUITY",
    label: "Equity",
    codeRange: "3000 - 3999",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    accentColor: "bg-amber-600",
    headerBg: "bg-amber-100/70 hover:bg-amber-100/90 border-amber-200 text-amber-950",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    drCr: "Cr",
  },
  {
    value: "REVENUE",
    label: "Revenue",
    codeRange: "4000 - 4999",
    color: "bg-yellow-50 text-yellow-900 border-yellow-200",
    accentColor: "bg-yellow-600",
    headerBg: "bg-yellow-100/70 hover:bg-yellow-100/90 border-yellow-200 text-yellow-950",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    drCr: "Cr",
  },
  {
    value: "EXPENSE",
    label: "Expenses",
    codeRange: "5000 - 5999",
    color: "bg-blue-50 text-blue-900 border-blue-200",
    accentColor: "bg-blue-600",
    headerBg: "bg-blue-100/70 hover:bg-blue-100/90 border-blue-200 text-blue-950",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    drCr: "Dr",
  },
];

export type HierarchicalAccount = ChartOfAccount & {
  subAccounts: HierarchicalAccount[];
};
