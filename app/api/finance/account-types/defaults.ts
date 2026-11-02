export interface DefaultSubtypeTemplate {
  name: string;
  nameAr?: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  cashFlowType: string;
  parentCodePrefix?: string;
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  description?: string;
}

export const DEFAULT_ACCOUNT_SUBTYPES: DefaultSubtypeTemplate[] = [
  {
    name: "Asset",
    type: "ASSET",
    cashFlowType: "Operating",
    description: "Asset category classification",
  },
  {
    name: "Liability",
    type: "LIABILITY",
    cashFlowType: "Operating",
    description: "Liability category classification",
  },
  {
    name: "Equity",
    type: "EQUITY",
    cashFlowType: "Financing",
    description: "Equity category classification",
  },
  {
    name: "Revenue",
    type: "REVENUE",
    cashFlowType: "Operating",
    description: "Revenue category classification",
  },
  {
    name: "Expense",
    type: "EXPENSE",
    cashFlowType: "Operating",
    description: "Expense category classification",
  },
];
