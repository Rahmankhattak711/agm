export type AccountClass = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type CashFlowCategory = "Operating" | "Investing" | "Financing" | "Cash" | "None";

export interface AccountSubtypeDef {
  label: string;
  type: AccountClass;
  cashFlow: string;
  parentPrefixes: string[];
  description?: string;
  showInExpenseClaims?: boolean;
  enablePayments?: boolean;
}

export interface ChartOfAccountRecord {
  id: string;
  accountCode: string;
  accountName: string;
  nameAr?: string | null;
  type: AccountClass;
  level: number;
  parentId?: string | null;
  isActive: boolean;
  isSystem: boolean;
  allowPosting: boolean;
  enablePayments: boolean;
  showInExpenseClaims: boolean;
  cashFlowType: string;
  accountSubtype?: string | null;
  balance?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface HierarchicalAccount extends ChartOfAccountRecord {
  subAccounts?: HierarchicalAccount[];
  directChildrenCount?: number;
  totalChildrenCount?: number;
}

export interface CreateAccountDTO {
  accountCode: string;
  accountName: string;
  nameAr?: string | null;
  type: AccountClass;
  parentId: string;
  accountSubtype?: string | null;
  cashFlowType?: string;
  allowPosting?: boolean;
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  isActive?: boolean;
  level?: number;
}

export interface UpdateAccountDTO {
  accountCode?: string;
  accountName?: string;
  nameAr?: string | null;
  type?: AccountClass;
  parentId?: string | null;
  accountSubtype?: string | null;
  cashFlowType?: string;
  allowPosting?: boolean;
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  isActive?: boolean;
}
