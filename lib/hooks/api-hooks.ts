import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/api-client";

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  isActive: boolean;
  parentId?: string | null;
  parent?: {
    id: string;
    accountCode: string;
    accountName: string;
  } | null;
  children?: {
    id: string;
    accountCode: string;
    accountName: string;
    type: string;
  }[];
  balance?: number;
  totalDebit?: number;
  totalCredit?: number;
  isSystem?: boolean;
  _count?: {
    journalLines?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: string | number;
  credit: string | number;
  account?: ChartOfAccount;
  vatType?: "INPUT" | "OUTPUT" | null;
  taxableAmount?: string | number;
  vatAmount?: string | number;
  vatEntry?: {
    id: string;
    taxableAmount: string | number;
    vatAmount: string | number;
    vatType: "INPUT" | "OUTPUT";
  } | null;
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

export interface Expense {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  category: string;
  payee?: string | null;
  description?: string | null;
  amount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHEQUE";
  reference?: string | null;
  receiptUrl?: string | null;
  status: "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";
  expenseAccountId?: string | null;
  paymentAccountId?: string | null;
  expenseAccount?: {
    id: string;
    accountCode: string;
    accountName: string;
  } | null;
  paymentAccount?: {
    id: string;
    accountCode: string;
    accountName: string;
  } | null;
  createdById: string;
  createdBy?: { id: string; fullName: string; email: string };
  journalEntryId?: string | null;
  journalEntry?: { id: string; entryNumber: string; isPosted: boolean } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  category:
    | "COMPANY_VEHICLE"
    | "MACHINERY_EQUIPMENT"
    | "OFFICE_EQUIPMENT"
    | "FURNITURE_FIXTURES"
    | "COMPUTER_HARDWARE"
    | "LEASEHOLD_IMPROVEMENT";
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

export type Gender = "MALE" | "FEMALE";
export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
export type ContractType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
export type EmploymentStatus =
  "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED";
export type PaymentMethod = "WPS_BANK_TRANSFER" | "CASH" | "CHEQUE";
export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND";
export type LeaveType =
  | "ANNUAL"
  | "SICK"
  | "UNPAID"
  | "EMERGENCY"
  | "MATERNITY"
  | "PATERNITY"
  | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type BonusType =
  | "PERFORMANCE"
  | "FESTIVAL"
  | "PROJECT_COMPLETION"
  | "ATTENDANCE"
  | "REFERRAL"
  | "OTHER";

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

  gender?: Gender | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  maritalStatus?: MaritalStatus | null;
  address?: string | null;
  profilePhotoUrl?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;

  emiratesId?: string | null;
  emiratesIdExpiry?: string | null;
  passportNo?: string | null;
  passportExpiry?: string | null;
  laborCardNo?: string | null;
  laborCardExpiry?: string | null;
  visaNumber?: string | null;
  visaExpiry?: string | null;

  contractType: ContractType;
  employmentStatus: EmploymentStatus;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  terminationDate?: string | null;
  reportsToId?: string | null;
  reportsTo?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;

  basicSalary: string | number;
  housingAllowance?: string | number;
  transportAllowance?: string | number;
  otherAllowances?: string | number;
  monthlySalary?: string | number;
  annualLeaveBalance?: string | number;
  paymentMethod: PaymentMethod;
  bankName?: string | null;
  iban?: string | null;

  _count?: {
    attendances: number;
    leaves: number;
    bonuses: number;
    payrolls: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyAttendance {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    designation?: string | null;
  };
  attendanceDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  workingHours?: string | number | null;
  overtimeHours?: string | number;
  lateMinutes?: number;
  location?: string | null;
  notes?: string | null;
  markedBy?: string | null;
  marker?: { fullName: string; email: string } | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    annualLeaveBalance?: string | number;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: string | number;
  reason?: string | null;
  status: LeaveStatus;
  approvedBy?: string | null;
  approver?: { fullName: string; email: string } | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: string | null;
  };
  type: BonusType;
  amount: string | number;
  month?: number | null;
  year?: number | null;
  reason?: string | null;
  isApproved: boolean;
  approvedBy?: string | null;
  approver?: { fullName: string; email: string } | null;
  isPaid: boolean;
  paidDate?: string | null;
  createdAt: string;
}

export type ProductType =
  "RAW_MATERIAL" | "FINISHED_GOOD" | "CONSUMABLE" | "TOOL_EQUIPMENT";
export type StockMovementType =
  | "PURCHASE_IN"
  | "SALE_OUT"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RETURN_IN"
  | "RETURN_OUT"
  | "PROJECT_CONSUMPTION";

export type PurchaseOrderStatus =
  "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  trn?: string | null;
  isActive: boolean;
  _count?: {
    products: number;
    purchaseOrders: number;
  };
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  isActive: boolean;
  stockLevels?: Array<{
    id: string;
    quantityOnHand: string | number;
    product: { id: string; name: string; sku: string; unit: string };
  }>;
  _count?: {
    stockMovements: number;
  };
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: ProductCategory | null;
  children?: ProductCategory[];
  inventoryAccountId?: string | null;
  inventoryAccount?: {
    id: string;
    accountCode: string;
    accountName: string;
  } | null;
  cogsAccountId?: string | null;
  cogsAccount?: { id: string; accountCode: string; accountName: string } | null;
  _count?: {
    products: number;
  };
}

export interface StockLevel {
  id: string;
  productId: string;
  warehouseId: string;
  warehouse?: Warehouse;
  quantityOnHand: string | number;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  type: ProductType;
  unit: string;
  barcode?: string | null;
  imageUrl?: string | null;

  brand?: string | null;
  supplierSku?: string | null;
  originCompany?: string | null;
  shopLocation?: string | null;
  productOrigin?: string;

  categoryId?: string | null;
  category?: ProductCategory | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  costPrice: string | number;
  sellingPrice: string | number;
  reorderLevel: string | number;
  reorderQty: string | number;
  isActive: boolean;
  totalOnHand?: number;
  isLowStock?: boolean;
  stockLevels?: Array<{
    id: string;
    quantityOnHand: string | number;
    warehouse: Warehouse;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  warehouseId: string;
  warehouse?: Warehouse;
  movementType: StockMovementType;
  quantity: string | number;
  unitCost?: string | number | null;
  referenceNumber?: string | null;
  notes?: string | null;
  movementDate: string;
  createdBy?: string | null;
  creator?: { fullName: string; email: string } | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  supplierSku?: string | null;
  itemNotes?: string | null;
  quantityOrdered: string | number;
  quantityReceived: string | number;
  unitCost: string | number;
  totalCost: string | number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  orderDate: string;
  expectedDate?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: string | number;
  notes?: string | null;
  vendorReference?: string | null;
  shopName?: string | null;
  createdBy?: string | null;
  creator?: { fullName: string; email: string } | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "ACCOUNTANT"
    | "HR"
    | "INVENTORY_MANAGER"
    | "USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRecord = UserItem;

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
      HR: number;
      INVENTORY_MANAGER: number;
      USER: number;
    };
  };
}

export interface ProfitLossItem {
  id?: string;
  section?: string;
  accountCode?: string;
  accountName: string;
  amount: number;
  prevAmount?: number;
  variance?: number;
  variancePct?: number;
}

export interface ProfitLossReport {
  companyName?: string;
  reportTitle?: string;
  period?: string;
  periodLabel?: string;
  startDate?: string | null;
  endDate?: string | null;
  prevStartDate?: string | null;
  prevEndDate?: string | null;
  compare?: boolean;
  income?: ProfitLossItem[];
  totalIncome?: number;
  prevTotalIncome?: number;
  directExpenses?: ProfitLossItem[];
  totalDirectExpenses?: number;
  prevTotalDirectExpenses?: number;
  grossProfit?: number;
  prevGrossProfit?: number;
  operatingExpenses?: ProfitLossItem[];
  totalOperatingExpenses?: number;
  prevTotalOperatingExpenses?: number;
  totalExpenses?: number;
  netProfit?: number;
  prevNetProfit?: number;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface BalanceSheetItem {
  id?: string;
  section: string;
  accountCode?: string;
  accountName: string;
  amount: number;
}

export interface BalanceSheetReport {
  companyName?: string;
  reportTitle?: string;
  currentAssets?: BalanceSheetItem[];
  totalCurrentAssets?: number;
  fixedAssets?: BalanceSheetItem[];
  totalFixedAssets?: number;
  totalAssets?: number;
  currentLiabilities?: BalanceSheetItem[];
  totalCurrentLiabilities?: number;
  totalLiabilities?: number;
  equity?: BalanceSheetItem[];
  totalEquity?: number;
  totalLiabilitiesAndEquity?: number;
  balanceCheck?: number;
  balanced: boolean;
  assets: number;
  liabilities: number;
  equityAmount?: number;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode?: string;
  accountName: string | null;
  type?: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | string;
  debit: number;
  credit: number;
  netBalance?: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
  isBalanced?: boolean;
}

export interface LedgerReport {
  account?: ChartOfAccount;
  lines: Array<{
    id: string;
    journalEntryId: string;
    accountId: string;
    debit: number;
    credit: number;
    runningBalance?: number;
    journalEntry?: {
      entryNumber: string;
      entryDate: string;
      description?: string;
      reference?: string;
      createdByName?: string;
    };
  }>;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  netBalance?: number;
  isDebitNormal?: boolean;
}

export interface VatTransactionRecord {
  id: string;
  vatType: "INPUT" | "OUTPUT";
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  createdAt: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  accountName: string;
  accountCode: string;
}

export interface ReceivableItem {
  id: string;
  reference: string;
  customer: string;
  project: string;
  date: string;
  status: string;
  totalAmount: number;
  daysOutstanding: number;
  agingBucket: "current" | "days30" | "days60" | "days90Plus";
  mobile?: string;
  trn?: string;
}

export interface ReceivablesReport {
  companyName: string;
  reportTitle: string;
  totalReceivables: number;
  totalArLedger: number;
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  items: ReceivableItem[];
  count: number;
}

export interface PayableItem {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierTrn: string;
  supplierContact: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  daysOutstanding: number;
  agingBucket: "current" | "days30" | "days60" | "days90Plus";
}

export interface PayablesReport {
  companyName: string;
  reportTitle: string;
  totalPayables: number;
  totalApLedger: number;
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  items: PayableItem[];
  count: number;
}

export interface VatQuarterDetail {
  key?: string;
  quarter: string;
  months?: string[];
  sales?: number;
  purchases?: number;
  nonVatExpenses?: number;
  grossProfit?: number;
  vatRate: string;
  inputVat: number;
  outputVat: number;
  netVat: number;
  position: "VAT Payable" | "VAT Receivable" | string;
  status: "Paid" | "Pending" | string;
}

export interface VatMonthlyRow {
  month: string;
  inputVat: number;
  outputVat: number;
  netVat: number;
}

export interface VatMonthlyBreakdownRow {
  month: string;
  taxableAmount: number;
  nonVatAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface VatSummaryReport {
  companyName?: string;
  reportTitle?: string;
  quarters?: VatQuarterDetail[];
  monthlyNet?: VatMonthlyRow[];
  monthlyPurchases?: VatMonthlyBreakdownRow[];
  monthlyIncome?: VatMonthlyBreakdownRow[];
  taxableSales?: number;
  outputVat: number;
  taxablePurchases?: number;
  inputVat: number;
  net: number;
  status?: "PAYABLE" | "REFUNDABLE";
  entries?: VatTransactionRecord[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export function useAccounts() {
  return useQuery<ChartOfAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => fetchJson<ChartOfAccount[]>("/api/accounts"),
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
    queryFn: () => fetchJson<AccountWithLedger>(`/api/accounts/${id}`),
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

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChartOfAccount> }) =>
      fetchJson<ChartOfAccount>(`/api/accounts/${id}`, {
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
      fetchJson<{ message: string }>(`/api/accounts/${id}`, {
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

export function useEmployees(filters?: {
  department?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.department) params.append("department", filters.department);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Employee[]>({
    queryKey: ["employees", filters],
    queryFn: () => fetchJson<Employee[]>(`/api/employees${queryStr}`),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
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
      fetchJson<{ ok: boolean }>(`/api/employees?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDailyAttendance(filters?: {
  employeeId?: string;
  date?: string;
  month?: number;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<DailyAttendance[]>({
    queryKey: ["attendance", filters],
    queryFn: () =>
      fetchJson<DailyAttendance[]>(`/api/employees/attendance${queryStr}`),
  });
}

export function useRecordAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<any>("/api/employees/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/attendance?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.status) params.append("status", filters.status);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", filters],
    queryFn: () =>
      fetchJson<LeaveRequest[]>(`/api/employees/leaves${queryStr}`),
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
    }) =>
      fetchJson<LeaveRequest>("/api/employees/leaves", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: LeaveStatus }) =>
      fetchJson<LeaveRequest>("/api/employees/leaves", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/leaves?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}

export function useBonuses(filters?: {
  employeeId?: string;
  month?: number;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Bonus[]>({
    queryKey: ["bonuses", filters],
    queryFn: () => fetchJson<Bonus[]>(`/api/employees/bonuses${queryStr}`),
  });
}

export function useCreateBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      type: BonusType;
      amount: number;
      month?: number;
      year?: number;
      reason?: string;
    }) =>
      fetchJson<Bonus>("/api/employees/bonuses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Bonus>("/api/employees/bonuses", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/bonuses?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
    },
  });
}

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ["product-categories"],
    queryFn: () => fetchJson<ProductCategory[]>("/api/inventory/categories"),
  });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      parentId?: string | null;
      inventoryAccountId?: string | null;
      cogsAccountId?: string | null;
    }) =>
      fetchJson<ProductCategory>("/api/inventory/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      parentId?: string | null;
      inventoryAccountId?: string | null;
      cogsAccountId?: string | null;
    }) =>
      fetchJson<ProductCategory>("/api/inventory/categories", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/categories?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => fetchJson<Supplier[]>("/api/inventory/suppliers"),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      supplierCode: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      trn?: string;
    }) =>
      fetchJson<Supplier>("/api/inventory/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Supplier>("/api/inventory/suppliers", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/suppliers?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => fetchJson<Warehouse[]>("/api/inventory/warehouses"),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; location?: string }) =>
      fetchJson<Warehouse>("/api/inventory/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Warehouse>("/api/inventory/warehouses", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/warehouses?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useProducts(filters?: {
  categoryId?: string;
  supplierId?: string;
  type?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append("categoryId", filters.categoryId);
  if (filters?.supplierId) params.append("supplierId", filters.supplierId);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.search) params.append("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: () => fetchJson<Product[]>(`/api/inventory/products${queryStr}`),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<Product>("/api/inventory/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Product>("/api/inventory/products", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/products?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useStockMovements(filters?: {
  productId?: string;
  warehouseId?: string;
  movementType?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.productId) params.append("productId", filters.productId);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.movementType)
    params.append("movementType", filters.movementType);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", filters],
    queryFn: () =>
      fetchJson<StockMovement[]>(`/api/inventory/stock-movements${queryStr}`),
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      productId: string;
      warehouseId: string;
      movementType: StockMovementType;
      quantity: number;
      unitCost?: number;
      referenceNumber?: string;
      notes?: string;
      movementDate?: string;
    }) =>
      fetchJson<StockMovement>("/api/inventory/stock-movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function usePurchaseOrders(filters?: {
  status?: string;
  supplierId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.supplierId) params.append("supplierId", filters.supplierId);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", filters],
    queryFn: () =>
      fetchJson<PurchaseOrder[]>(`/api/inventory/purchase-orders${queryStr}`),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      poNumber: string;
      supplierId: string;
      shopName?: string;
      vendorReference?: string;
      orderDate: string;
      expectedDate?: string;
      status?: PurchaseOrderStatus;
      notes?: string;
      items: Array<{
        productId: string;
        supplierSku?: string;
        itemNotes?: string;
        quantityOrdered: number;
        unitCost: number;
        totalCost?: number;
      }>;
    }) =>
      fetchJson<PurchaseOrder>("/api/inventory/purchase-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      status?: PurchaseOrderStatus;
      expectedDate?: string;
      notes?: string;
      warehouseIdToReceive?: string;
    }) =>
      fetchJson<PurchaseOrder>("/api/inventory/purchase-orders", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(
        `/api/inventory/purchase-orders?id=${id}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

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

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      fullName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }) =>
      fetchJson<UserItem>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success?: boolean; message?: string }>(`/api/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
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
    queryFn: () => fetchJson<BalanceSheetReport>(`/api/reports/balance-sheet${qs}`),
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

export interface QuotationItemRecord {
  id?: string;
  quotationId?: string;
  productId?: string | null;
  product?: { id: string; name: string; sku: string; unit?: string } | null;
  section?: string;
  itemOrder?: number;
  description: string;
  quantity: number | string;
  unit?: string;
  unitRate: number | string;
  totalAmount?: number | string;
  isFree?: boolean;
}

export interface QuotationRecord {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  customer: string;
  attention?: string;
  address?: string;
  trn?: string;
  mobile?: string;
  project?: string;
  location?: string;
  reference?: string;
  preparedBy?: string;
  contact?: string;
  vatPct: number | string;
  discount: number | string;
  subtotal: number | string;
  vatAmount: number | string;
  totalAmount: number | string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  notes?: string | null;
  terms?: string | null;
  paymentTerms?: string | null;
  createdBy?: { id: string; fullName: string; email: string } | null;
  items: QuotationItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export function useQuotations(params?: { search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<QuotationRecord[]>({
    queryKey: ["quotations", params],
    queryFn: () =>
      fetchJson<QuotationRecord[]>(`/api/finance/quotations${qStr}`),
  });
}

export function useQuotation(id?: string | null) {
  return useQuery<QuotationRecord>({
    queryKey: ["quotation", id],
    queryFn: () => fetchJson<QuotationRecord>(`/api/finance/quotations/${id}`),
    enabled: !!id,
  });
}

export function useSaveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QuotationRecord> & { items: any[] }) =>
      fetchJson<QuotationRecord>("/api/finance/quotations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/finance/quotations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useConvertQuotationToSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/finance/quotations/${id}/convert-order`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
}

export function useConvertQuotationToSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/finance/quotations/${id}/convert-invoice`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  companyName?: string | null;
  trn?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    quotations: number;
    salesOrders: number;
    salesInvoices: number;
    customerPayments: number;
  };
}

export function useCustomers(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: () => fetchJson<Customer[]>(`/api/commercial/customers${qStr}`),
  });
}

export function useCustomerStatement(id?: string | null) {
  return useQuery<{
    customer: Customer;
    statement: any[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      totalCredits: number;
      currentOutstanding: number;
    };
  }>({
    queryKey: ["customer-statement", id],
    queryFn: () => fetchJson<any>(`/api/commercial/customers/${id}/statement`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      fetchJson<Customer>("/api/commercial/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  quotationId?: string | null;
  orderDate: string;
  deliveryDate?: string | null;
  projectScope?: string | null;
  status: "DRAFT" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
  terms?: string | null;
  items: any[];
  customerRel?: Customer;
  createdAt: string;
}

export function useSalesOrders(params?: { search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SalesOrder[]>({
    queryKey: ["sales-orders", params],
    queryFn: () =>
      fetchJson<SalesOrder[]>(`/api/commercial/sales-orders${qStr}`),
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SalesOrder>("/api/commercial/sales-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useConvertSalesOrderToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/sales-orders/${id}/convert-invoice`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
    },
  });
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerTrn?: string | null;
  quotationRef?: string | null;
  salesOrderId?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  projectScope?: string | null;
  status:
    "DRAFT" | "POSTED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  notes?: string | null;
  terms?: string | null;
  items: any[];
  customerRel?: Customer;
  journalEntryId?: string | null;
  createdAt: string;
}

export function useSalesInvoices(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SalesInvoice[]>({
    queryKey: ["sales-invoices", params],
    queryFn: () =>
      fetchJson<SalesInvoice[]>(`/api/commercial/sales-invoices${qStr}`),
  });
}

export function useCreateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SalesInvoice>("/api/commercial/sales-invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function usePostSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/sales-invoices/${id}/post`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["profit-loss"] });
    },
  });
}

export interface CustomerPayment {
  id: string;
  receiptNumber: string;
  customerId?: string | null;
  customerName: string;
  salesInvoiceId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD";
  referenceNumber?: string | null;
  notes?: string | null;
  salesInvoice?: SalesInvoice;
  customerRel?: Customer;
  createdAt: string;
}

export function useCustomerPayments(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<CustomerPayment[]>({
    queryKey: ["customer-payments", search],
    queryFn: () =>
      fetchJson<CustomerPayment[]>(`/api/commercial/customer-payments${qStr}`),
  });
}

export function useCreateCustomerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<CustomerPayment>("/api/commercial/customer-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-payments"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId?: string | null;
  customerName: string;
  salesInvoiceId?: string | null;
  returnDate: string;
  reason?: string | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  items: any[];
  salesInvoice?: SalesInvoice;
  customerRel?: Customer;
  createdAt: string;
}

export function useCreditNotes(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<CreditNote[]>({
    queryKey: ["credit-notes", search],
    queryFn: () =>
      fetchJson<CreditNote[]>(`/api/commercial/credit-notes${qStr}`),
  });
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<CreditNote>("/api/commercial/credit-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-notes"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requesterName: string;
  department?: string | null;
  requestDate: string;
  requiredDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CONVERTED";
  items: any[];
  createdAt: string;
}

export function usePurchaseRequests(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests", params],
    queryFn: () =>
      fetchJson<PurchaseRequest[]>(`/api/commercial/purchase-requests${qStr}`),
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<PurchaseRequest>("/api/commercial/purchase-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
    },
  });
}

export function useApprovePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "APPROVE" | "REJECT";
    }) =>
      fetchJson<any>(`/api/commercial/purchase-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
    },
  });
}

export function useConvertPurchaseRequestToPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, supplierId }: { id: string; supplierId?: string }) =>
      fetchJson<any>(`/api/commercial/purchase-requests/${id}/convert-po`, {
        method: "POST",
        body: JSON.stringify({ supplierId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  warehouseId?: string | null;
  receiptDate: string;
  deliveryNoteNumber?: string | null;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  items: any[];
  supplier?: any;
  warehouse?: any;
  purchaseOrder?: any;
  createdAt: string;
}

export function useGoodsReceipts(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<GoodsReceipt[]>({
    queryKey: ["goods-receipts", search],
    queryFn: () =>
      fetchJson<GoodsReceipt[]>(`/api/commercial/goods-received${qStr}`),
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<GoodsReceipt>("/api/commercial/goods-received", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goods-receipts"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      qc.invalidateQueries({ queryKey: ["stockLevels"] });
    },
  });
}

export interface SupplierBill {
  id: string;
  billNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierTrn?: string | null;
  purchaseOrderId?: string | null;
  goodsReceiptId?: string | null;
  billDate: string;
  dueDate?: string | null;
  status: "DRAFT" | "POSTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  items: any[];
  supplier?: any;
  createdAt: string;
}

export function useSupplierBills(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SupplierBill[]>({
    queryKey: ["supplier-bills", params],
    queryFn: () =>
      fetchJson<SupplierBill[]>(`/api/commercial/supplier-bills${qStr}`),
  });
}

export function useCreateSupplierBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SupplierBill>("/api/commercial/supplier-bills", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
    },
  });
}

export function usePostSupplierBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/supplier-bills/${id}/post`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierBillId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE";
  referenceNumber?: string | null;
  notes?: string | null;
  supplierBill?: SupplierBill;
  supplier?: any;
  createdAt: string;
}

export function useSupplierPayments(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<SupplierPayment[]>({
    queryKey: ["supplier-payments", search],
    queryFn: () =>
      fetchJson<SupplierPayment[]>(`/api/commercial/supplier-payments${qStr}`),
  });
}

export function useCreateSupplierPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SupplierPayment>("/api/commercial/supplier-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-payments"] });
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierBillId?: string | null;
  purchaseOrderId?: string | null;
  returnDate: string;
  reason?: string | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  items: any[];
  supplier?: any;
  supplierBill?: SupplierBill;
  createdAt: string;
}

export function useDebitNotes(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<DebitNote[]>({
    queryKey: ["debit-notes", search],
    queryFn: () => fetchJson<DebitNote[]>(`/api/commercial/debit-notes${qStr}`),
  });
}

export function useCreateDebitNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<DebitNote>("/api/commercial/debit-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debit-notes"] });
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}
