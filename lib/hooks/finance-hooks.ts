import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";
import type {
  Vat201ReturnResult,
  TaxReportResult,
  CorporateTaxResult,
} from "@/lib/modules/accounting";
import type {
  ChartOfAccount,
  JournalEntry,
  Expense,
  FixedAsset,
  ProfitLossReport,
  BalanceSheetReport,
  TrialBalanceReport,
  VatSummaryReport,
  LedgerReport,
  ReceivablesReport,
  PayablesReport,
  StatementOfAccountData,
} from "./types";

export function useAccounts() {
  return useQuery<ChartOfAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => fetchJson<ChartOfAccount[]>("/api/finance/accounts"),
  });
}

export interface AccountLedgerEntry {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  description?: string;
  reference?: string;
  isPosted: boolean;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AccountWithLedger extends ChartOfAccount {
  ledger: AccountLedgerEntry[];
}

export function useAccountLedger(id: string) {
  return useQuery<AccountWithLedger>({
    queryKey: ["account-ledger", id],
    queryFn: () => fetchJson<AccountWithLedger>(`/api/finance/accounts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      accountCode: string;
      accountName: string;
      type: string;
      parentId?: string | null;
      isActive?: boolean;
    }) =>
      fetchJson<ChartOfAccount>("/api/finance/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChartOfAccount> }) =>
      fetchJson<ChartOfAccount>(`/api/finance/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["account-ledger", id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ message: string }>(`/api/finance/accounts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useJournalEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["journal-entries"],
    queryFn: () => fetchJson<JournalEntry[]>("/api/finance/journal-entries"),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
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
      createdBy?: string;
      isPosted?: boolean;
      lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        vatType?: "INPUT" | "OUTPUT" | null;
        taxableAmount?: number;
        vatAmount?: number;
      }>;
    }) =>
      fetchJson<JournalEntry>("/api/finance/journal-entries", {
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
      isPosted?: boolean;
      lines?: Array<{
        accountId: string;
        debit: number;
        credit: number;
        vatType?: "INPUT" | "OUTPUT" | null;
        taxableAmount?: number;
        vatAmount?: number;
      }>;
    }) =>
      fetchJson<JournalEntry>("/api/finance/journal-entries", {
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
      fetchJson<{ ok: boolean }>("/api/finance/journal-entries", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useExpenses(filters?: {
  category?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.set("category", filters.category);
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.paymentMethod)
    queryParams.set("paymentMethod", filters.paymentMethod);
  if (filters?.startDate) queryParams.set("startDate", filters.startDate);
  if (filters?.endDate) queryParams.set("endDate", filters.endDate);
  if (filters?.search) queryParams.set("search", filters.search);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<{
    expenses: Expense[];
    summary: { totalAmount: number; totalTax: number; count: number };
  }>({
    queryKey: ["expenses", filters],
    queryFn: () =>
      fetchJson<{
        expenses: Expense[];
        summary: { totalAmount: number; totalTax: number; count: number };
      }>(`/api/finance/expenses${qs}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      expenseDate: string;
      category: string;
      payee?: string;
      description?: string;
      amount: number;
      taxAmount?: number;
      paymentMethod?: "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHEQUE";
      reference?: string;
      receiptUrl?: string;
      status?: "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";
      expenseAccountId?: string;
      paymentAccountId?: string;
      createJournal?: boolean;
    }) =>
      fetchJson<Expense>("/api/finance/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Expense> & { id: string }) =>
      fetchJson<Expense>(`/api/finance/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(
        `/api/finance/expenses/${id}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

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

export function useProfitLoss(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  compare?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.set("period", params.period);
  if (params?.startDate) queryParams.set("startDate", params.startDate);
  if (params?.endDate) queryParams.set("endDate", params.endDate);
  if (params?.compare !== undefined)
    queryParams.set("compare", String(params.compare));

  const qs = queryParams.toString();
  const url = qs
    ? `/api/reports/profit-loss?${qs}`
    : "/api/reports/profit-loss";

  return useQuery<ProfitLossReport>({
    queryKey: ["reports", "profit-loss", params],
    queryFn: () => fetchJson<ProfitLossReport>(url),
  });
}

export function useBalanceSheet(params?: { endDate?: string }) {
  const qs = params?.endDate ? `?endDate=${params.endDate}` : "";
  return useQuery<BalanceSheetReport>({
    queryKey: ["reports", "balance-sheet", params],
    queryFn: () =>
      fetchJson<BalanceSheetReport>(`/api/reports/balance-sheet${qs}`),
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

export function useVatReturn(params?: { startDate?: string; endDate?: string; year?: number }) {
  const q = new URLSearchParams();
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  if (params?.year) q.set("year", params.year.toString());
  const qs = q.toString() ? `?${q.toString()}` : "";

  return useQuery<Vat201ReturnResult>({
    queryKey: ["reports", "vat-return", params],
    queryFn: () => fetchJson<Vat201ReturnResult>(`/api/finance/reports/vat-return${qs}`),
  });
}

export function useTaxReport(params?: { startDate?: string; endDate?: string; year?: number }) {
  const q = new URLSearchParams();
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  if (params?.year) q.set("year", params.year.toString());
  const qs = q.toString() ? `?${q.toString()}` : "";

  return useQuery<TaxReportResult>({
    queryKey: ["reports", "tax-report", params],
    queryFn: () => fetchJson<TaxReportResult>(`/api/finance/reports/tax-report${qs}`),
  });
}

export function useCorporateTax(params?: { year?: number }) {
  const qs = params?.year ? `?year=${params.year}` : "";
  return useQuery<CorporateTaxResult>({
    queryKey: ["reports", "corporate-tax", params],
    queryFn: () => fetchJson<CorporateTaxResult>(`/api/finance/reports/corporate-tax${qs}`),
  });
}

export function useLedger(accountId: string | null) {
  return useQuery<LedgerReport>({
    queryKey: ["reports", "ledger", accountId],
    queryFn: () =>
      fetchJson<LedgerReport>(`/api/reports/ledger?accountId=${accountId}`),
    enabled: !!accountId,
  });
}

export function useReceivables() {
  return useQuery<ReceivablesReport>({
    queryKey: ["reports", "receivables"],
    queryFn: () => fetchJson<ReceivablesReport>("/api/reports/receivables"),
  });
}

export function usePayables() {
  return useQuery<PayablesReport>({
    queryKey: ["reports", "payables"],
    queryFn: () => fetchJson<PayablesReport>("/api/reports/payables"),
  });
}

export function useStatementOfAccount(params?: {
  customerId?: string | null;
  fromDate?: string;
  toDate?: string;
  projectId?: string | null;
  transactionType?: string;
  status?: string;
}) {
  const queryParts: string[] = [];
  if (params?.customerId)
    queryParts.push(`customerId=${encodeURIComponent(params.customerId)}`);
  if (params?.fromDate)
    queryParts.push(`fromDate=${encodeURIComponent(params.fromDate)}`);
  if (params?.toDate)
    queryParts.push(`toDate=${encodeURIComponent(params.toDate)}`);
  if (params?.projectId)
    queryParts.push(`projectId=${encodeURIComponent(params.projectId)}`);
  if (params?.transactionType && params.transactionType !== "ALL") {
    queryParts.push(
      `transactionType=${encodeURIComponent(params.transactionType)}`,
    );
  }
  if (params?.status && params.status !== "ALL") {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return useQuery<StatementOfAccountData>({
    queryKey: ["reports", "statement-of-account", params],
    queryFn: () =>
      fetchJson<StatementOfAccountData>(
        `/api/reports/statement-of-account${queryString}`,
      ),
    enabled: Boolean(params?.customerId),
  });
}

export interface AccountSubtypeItem {
  id: string;
  name: string;
  nameAr?: string | null;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  cashFlowType: string;
  description?: string | null;
  parentCodePrefix?: string | null;
  enablePayments: boolean;
  showInExpenseClaims: boolean;
  isSystem: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useAccountSubtypes(params?: { type?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.type) q.append("type", params.type);
  if (params?.search) q.append("search", params.search);
  const qStr = q.toString() ? "?" + q.toString() : "";

  return useQuery<AccountSubtypeItem[]>({
    queryKey: ["account-types", params],
    queryFn: () => fetchJson<AccountSubtypeItem[]>("/api/finance/account-types" + qStr),
  });
}

export function useCreateAccountSubtype() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AccountSubtypeItem>) =>
      fetchJson<AccountSubtypeItem>("/api/finance/account-types", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-types"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccountSubtype() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountSubtypeItem> }) =>
      fetchJson<AccountSubtypeItem>("/api/finance/account-types/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-types"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccountSubtype() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; message: string }>("/api/finance/account-types/" + id, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-types"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
