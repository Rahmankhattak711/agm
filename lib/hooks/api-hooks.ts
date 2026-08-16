import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/api-client";

// Types
export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  isActive: boolean;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: string | number;
  credit: string | number;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description?: string | null;
  reference?: string | null;
  isPosted: boolean;
  createdBy: string;
  user?: { fullName: string };
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashTransaction {
  id: string;
  transactionDate: string;
  voucherNumber: string;
  categoryType: "BANK_CHARGE" | "LOCAL_GOVERNMENT" | "OPERATIONAL_EXPENSE";
  category: string;
  amount: string | number;
  transactionType: "TOP_UP" | "DISBURSEMENT";
  receiptImageUrl?: string | null;
  notes?: string | null;
  accountId?: string | null;
  approvedBy?: string | null;
  isApproved: boolean;
  createdAt: string;
}

export interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  category: "COMPANY_VEHICLE" | "MACHINERY_EQUIPMENT" | "OFFICE_EQUIPMENT" | "FURNITURE_FIXTURES" | "COMPUTER_HARDWARE" | "LEASEHOLD_IMPROVEMENT";
  purchaseDate: string;
  cost: string | number;
  salvageValue: string | number;
  depreciationRate: string | number;
  registrationNumber?: string | null;
  chassisNumber?: string | null;
  plateNumber?: string | null;
  assignedTo?: string | null;
  driverName?: string | null;
  assetAccountId: string;
  accumulatedDeprAccountId: string;
  deprExpenseAccountId: string;
  schedules?: Array<{
    id: string;
    fiscalYear: number;
    openingBookValue: string | number;
    depreciationAmount: string | number;
    closingBookValue: string | number;
    isPosted: boolean;
  }>;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  joiningDate: string;
  isActive: boolean;
  emiratesId?: string | null;
  passportNo?: string | null;
  laborCardNo?: string | null;
  basicSalary: string | number;
  housingAllowance?: string | number;
  transportAllowance?: string | number;
  otherAllowances?: string | number;
  paymentMethod: "WPS_BANK_TRANSFER" | "CASH" | "CHEQUE";
  bankName?: string | null;
  iban?: string | null;
  createdAt: string;
}

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: UserItem[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      SUPER_ADMIN: number;
      ADMIN: number;
      ACCOUNTANT: number;
      USER: number;
    };
  };
}

export interface ProfitLossReport {
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface BalanceSheetReport {
  assets: number;
  liabilities: number;
  equity: number;
  balanced: boolean;
}

export interface TrialBalanceRow {
  accountId: string;
  accountName: string | null;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

export interface LedgerReport {
  lines: Array<{
    id: string;
    journalEntryId: string;
    accountId: string;
    debit: string | number;
    credit: string | number;
    journalEntry?: {
      entryNumber: string;
      entryDate: string;
      description?: string;
      reference?: string;
    };
  }>;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface VatSummaryReport {
  inputVat: number;
  outputVat: number;
  net: number;
}

// ---------------- Helper fetcher ----------------
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

// ---------------- Accounts Hooks ----------------
export function useAccounts() {
  return useQuery<ChartOfAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => fetchJson<ChartOfAccount[]>("/api/accounts"),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { accountCode: string; accountName: string; type: string }) =>
      fetchJson<ChartOfAccount>("/api/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// ---------------- Journal Entries Hooks ----------------
export function useJournalEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["journal-entries"],
    queryFn: () => fetchJson<JournalEntry[]>("/api/journal-entries"),
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entryNumber: string;
      entryDate: string;
      description?: string;
      reference?: string;
      createdBy: string;
      lines: Array<{ accountId: string; debit: number; credit: number }>;
    }) =>
      fetchJson<JournalEntry>("/api/journal-entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      entryNumber?: string;
      entryDate?: string;
      description?: string;
      reference?: string;
      lines?: Array<{ accountId: string; debit: number; credit: number }>;
    }) =>
      fetchJson<JournalEntry>("/api/journal-entries", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>("/api/journal-entries", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// ---------------- Petty Cash Hooks ----------------
export function usePettyCash() {
  return useQuery<PettyCashTransaction[]>({
    queryKey: ["petty-cash"],
    queryFn: () => fetchJson<PettyCashTransaction[]>("/api/petty-cash"),
  });
}

export function useCreatePettyCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      transactionDate: string;
      voucherNumber: string;
      category: string;
      amount: number;
      transactionType: "TOP_UP" | "DISBURSEMENT";
      receiptImageUrl?: string;
      approvedBy?: string;
    }) =>
      fetchJson<PettyCashTransaction>("/api/petty-cash", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["petty-cash"] });
    },
  });
}

// ---------------- Fixed Assets Hooks ----------------
export function useAssets() {
  return useQuery<FixedAsset[]>({
    queryKey: ["assets"],
    queryFn: () => fetchJson<FixedAsset[]>("/api/assets"),
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      assetCode: string;
      assetName: string;
      category?: string;
      purchaseDate: string;
      cost: number;
      salvageValue?: number;
      depreciationRate?: number;
      assetAccountId: string;
      accumulatedDeprAccountId: string;
      deprExpenseAccountId: string;
    }) =>
      fetchJson<FixedAsset>("/api/assets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

// ---------------- Employees Hooks ----------------
export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => fetchJson<Employee[]>("/api/employees"),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeCode: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      department?: string;
      designation?: string;
      joiningDate: string;
      basicSalary: number;
    }) =>
      fetchJson<Employee>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Employee>("/api/employees", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>("/api/employees", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

// ---------------- Users Hooks ----------------
export function useUsers() {
  return useQuery<UsersResponse>({
    queryKey: ["users"],
    queryFn: () => fetchJson<UsersResponse>("/api/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fullName: string;
      email: string;
      password: string;
      role?: string;
    }) =>
      fetchJson<UserItem>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ---------------- Reports Hooks ----------------
export function useProfitLoss() {
  return useQuery<ProfitLossReport>({
    queryKey: ["reports", "profit-loss"],
    queryFn: () => fetchJson<ProfitLossReport>("/api/reports/profit-loss"),
  });
}

export function useBalanceSheet() {
  return useQuery<BalanceSheetReport>({
    queryKey: ["reports", "balance-sheet"],
    queryFn: () => fetchJson<BalanceSheetReport>("/api/reports/balance-sheet"),
  });
}

export function useTrialBalance() {
  return useQuery<TrialBalanceReport>({
    queryKey: ["reports", "trial-balance"],
    queryFn: () => fetchJson<TrialBalanceReport>("/api/reports/trial-balance"),
  });
}

export function useVatSummary() {
  return useQuery<VatSummaryReport>({
    queryKey: ["reports", "vat-summary"],
    queryFn: () => fetchJson<VatSummaryReport>("/api/reports/vat-summary"),
  });
}

export function useLedger(accountId: string | null) {
  return useQuery<LedgerReport>({
    queryKey: ["reports", "ledger", accountId],
    queryFn: () => fetchJson<LedgerReport>(`/api/reports/ledger?accountId=${accountId}`),
    enabled: !!accountId,
  });
}
