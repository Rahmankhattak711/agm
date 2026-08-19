import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/api-client";

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  isActive: boolean;
  parentId?: string | null;
  _count?: {
    journalLines?: number;
  };
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

export type Gender = "MALE" | "FEMALE";
export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
export type ContractType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
export type EmploymentStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED" | "RESIGNED";
export type PaymentMethod = "WPS_BANK_TRANSFER" | "CASH" | "CHEQUE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKEND";
export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "EMERGENCY" | "MATERNITY" | "PATERNITY" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type BonusType = "PERFORMANCE" | "FESTIVAL" | "PROJECT_COMPLETION" | "ATTENDANCE" | "REFERRAL" | "OTHER";

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
  reportsTo?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;

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

export type ProductType = "RAW_MATERIAL" | "FINISHED_GOOD" | "CONSUMABLE" | "TOOL_EQUIPMENT";
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

export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

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
  inventoryAccount?: { id: string; accountCode: string; accountName: string } | null;
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
  role: "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "HR" | "INVENTORY_MANAGER" | "USER";
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
  section: string;
  accountCode?: string;
  accountName: string;
  amount: number;
}

export interface ProfitLossReport {
  companyName?: string;
  reportTitle?: string;
  income?: ProfitLossItem[];
  totalIncome?: number;
  directExpenses?: ProfitLossItem[];
  totalDirectExpenses?: number;
  grossProfit?: number;
  operatingExpenses?: ProfitLossItem[];
  totalOperatingExpenses?: number;
  totalExpenses?: number;
  netProfit?: number;
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

export interface VatQuarterDetail {
  quarter: string;
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

export function useEmployees(filters?: { department?: string; status?: string; search?: string }) {
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

export function useDailyAttendance(filters?: { employeeId?: string; date?: string; month?: number; year?: number }) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<DailyAttendance[]>({
    queryKey: ["attendance", filters],
    queryFn: () => fetchJson<DailyAttendance[]>(`/api/employees/attendance${queryStr}`),
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

export function useLeaveRequests(filters?: { employeeId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.status) params.append("status", filters.status);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", filters],
    queryFn: () => fetchJson<LeaveRequest[]>(`/api/employees/leaves${queryStr}`),
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

export function useBonuses(filters?: { employeeId?: string; month?: number; year?: number }) {
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
    mutationFn: (data: { name: string; parentId?: string | null; inventoryAccountId?: string | null; cogsAccountId?: string | null }) =>
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
    mutationFn: (data: { id: string; name?: string; parentId?: string | null; inventoryAccountId?: string | null; cogsAccountId?: string | null }) =>
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

export function useProducts(filters?: { categoryId?: string; supplierId?: string; type?: string; search?: string }) {
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

export function useStockMovements(filters?: { productId?: string; warehouseId?: string; movementType?: string }) {
  const params = new URLSearchParams();
  if (filters?.productId) params.append("productId", filters.productId);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.movementType) params.append("movementType", filters.movementType);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", filters],
    queryFn: () => fetchJson<StockMovement[]>(`/api/inventory/stock-movements${queryStr}`),
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

export function usePurchaseOrders(filters?: { status?: string; supplierId?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.supplierId) params.append("supplierId", filters.supplierId);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", filters],
    queryFn: () => fetchJson<PurchaseOrder[]>(`/api/inventory/purchase-orders${queryStr}`),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      poNumber: string;
      supplierId: string;
      orderDate: string;
      expectedDate?: string;
      status?: PurchaseOrderStatus;
      notes?: string;
      items: Array<{
        productId: string;
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
      fetchJson<{ success: boolean }>(`/api/inventory/purchase-orders?id=${id}`, {
        method: "DELETE",
      }),
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

export interface QuotationItemRecord {
  id?: string;
  quotationId?: string;
  productId?: string | null;
  product?: { id: string; name: string; sku: string; unit?: string } | null;
  section?: string;
  itemOrder?: number;
  description: string;
  quantity: number | string;
  unit: string;
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
    queryFn: () => fetchJson<QuotationRecord[]>(`/api/finance/quotations${qStr}`),
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
