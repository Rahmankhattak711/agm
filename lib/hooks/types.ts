import type { CustomLetterDocumentData } from "@/components/documents/custom-letter-constants";

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  nameAr?: string | null;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  accountSubtype?: string | null;
  cashFlowType?: string | null;
  allowPosting?: boolean;
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  level?: number;
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
  purchasePrice?: string | number;
  accumulatedDepreciation?: string | number;
  salvageValue: string | number;
  depreciationRate: string | number;
  registrationNumber?: string | null;
  chassisNumber?: string | null;
  plateNumber?: string | null;
  assignedTo?: string | null;
  driverName?: string | null;
  imageUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  notes?: string | null;
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
  supplierBills?: Array<{
    id: string;
    billNumber: string;
    status: string;
    journalEntryId?: string | null;
  }>;
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
  lastLoginAt?: string | null;
  mustChangePassword?: boolean;
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

export interface AccountDetailItem {
  id: string;
  date: string;
  reference?: string | null;
  description: string;
  partyName?: string | null;
  debit?: number;
  credit?: number;
  amount: number;
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
  details?: AccountDetailItem[];
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
  projects?: TrialBalanceProjectSummary[];
  customers?: TrialBalanceCustomerSummary[];
}

export interface BalanceSheetItem {
  id?: string;
  section: string;
  accountCode?: string;
  accountName: string;
  amount: number;
  details?: AccountDetailItem[];
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
  projects?: TrialBalanceProjectSummary[];
  customers?: TrialBalanceCustomerSummary[];
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode?: string;
  accountName: string | null;
  type?: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | string;
  debit: number;
  credit: number;
  netBalance?: number;
  details?: AccountDetailItem[];
}

export interface ProjectCostItem {
  id: string;
  description: string;
  costType: string;
  amount: number;
  unitRate?: number | null;
  quantity?: number | null;
  date: string;
  reference?: string | null;
}

export interface ProjectInvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export interface CustomerPaymentItem {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
}

export interface TrialBalanceProjectSummary {
  id: string;
  code: string;
  name: string;
  customerName?: string;
  contractValue: number;
  budget?: number;
  invoicedAmount: number;
  paidAmount: number;
  directCost: number;
  materialCost: number;
  laborCost: number;
  actualCost: number;
  otherExpenses: number;
  grossMargin: number;
  marginPercent: number;
  status: string;
  managerName?: string;
  costs?: ProjectCostItem[];
  invoices?: ProjectInvoiceItem[];
}

export interface TrialBalanceCustomerSummary {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  totalInvoiced: number;
  totalPaid: number;
  currentBalance: number;
  activeProjectsCount: number;
  invoices?: ProjectInvoiceItem[];
  payments?: CustomerPaymentItem[];
  projectsList?: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    contractValue: number;
  }>;
}

export interface TrialBalanceUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  invoicesCount: number;
  billsCount: number;
  paymentsCount: number;
  expensesCount: number;
  totalRecordedVolume: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
  isBalanced?: boolean;
  projects?: TrialBalanceProjectSummary[];
  customers?: TrialBalanceCustomerSummary[];
  users?: TrialBalanceUserSummary[];
  summary?: {
    totalRevenue: number;
    totalDirectCosts: number;
    totalGrossProfit: number;
    totalReceivables: number;
    totalPayables: number;
    netCashFlow: number;
  };
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

export type User = UserItem;

export type ProjectStatus =
  "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ProjectCostType =
  | "MATERIAL"
  | "LABOR"
  | "EQUIPMENT"
  | "SUBCONTRACTOR"
  | "PERMITS"
  | "TRANSPORT"
  | "OVERHEAD"
  | "OTHER";

export type MilestoneStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

export interface ProjectCost {
  id: string;
  projectId: string;
  costType: ProjectCostType;
  category?: string | null;
  description: string;
  quantity?: number | string | null;
  unitRate?: number | string | null;
  amount: number | string;
  date: string;
  reference?: string | null;
  notes?: string | null;
  recordedById?: string | null;
  recordedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  order: number;
  status: MilestoneStatus;
  progressPct: number;
  dueDate?: string | null;
  completionDate?: string | null;
  billedAmount?: number | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;

  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;

  contractValue: number | string;
  budget: number | string;
  estimatedCost: number | string;
  actualCost: number | string;
  materialCost: number | string;
  laborCost: number | string;
  otherExpenses: number | string;
  progressPct: number;

  quotationId?: string | null;
  quotation?: {
    id: string;
    quotationNo: string;
    customer: string;
    vatPct?: number | string | null;
    vatAmount?: number | string | null;
    totalAmount: number | string;
    status: string;
  } | null;

  vatRate?: number | string | null;
  vatAmount?: number | string | null;
  invoiceNumber?: string | null;

  customerId?: string | null;
  customer?: {
    id: string;
    customerCode: string;
    name: string;
    companyName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  managerId?: string | null;
  manager?: {
    id: string;
    fullName: string;
    email: string;
  } | null;

  createdById?: string | null;
  createdBy?: {
    id: string;
    fullName: string;
  } | null;

  costs?: ProjectCost[];
  milestones?: ProjectMilestone[];

  _count?: {
    costs: number;
    milestones: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface StatementOfAccountTransaction {
  id: string;
  date: string;
  reference: string;
  rawType: "INVOICE" | "PAYMENT" | "CREDIT_NOTE";
  type: "Sales Invoice" | "Customer Payment" | "Credit Note";
  description: string;
  projectScope?: string | null;
  debit: number;
  credit: number;
  balance: number;
  status: string;
  dueDate?: string | null;
  documentId: string;
  journalEntry?: {
    id: string;
    entryNumber: string;
    isPosted: boolean;
  } | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
}

export interface OutstandingInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string | null;
  invoiceAmount: number;
  paid: number;
  creditNote: number;
  outstanding: number;
  status: "Paid" | "Partially Paid" | "Unpaid" | "Overdue";
  daysOverdue: number;
  projectScope?: string | null;
}

export interface StatementOfAccountProject {
  id: string;
  projectCode: string;
  name: string;
  description?: string | null;
  location?: string | null;
  contractValue?: number;
  status?: string;
  progressPct?: number;
}

export interface StatementOfAccountData {
  customer: {
    id: string;
    customerCode: string;
    name: string;
    companyName: string | null;
    trn: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    creditLimit: number;
    currentBalance: number;
  };
  period: {
    fromDate: string;
    toDate: string;
    currency: string;
    projectName?: string | null;
  };
  projects?: StatementOfAccountProject[];
  openingBalance: number;
  transactions: StatementOfAccountTransaction[];
  totals: {
    invoices: number;
    payments: number;
    creditNotes: number;
    adjustments: number;
    closingBalance: number;
    overdueAmount: number;
  };
  outstandingInvoices: OutstandingInvoice[];
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
    counts: {
      current: number;
      days1to30: number;
      days31to60: number;
      days61to90: number;
      days90Plus: number;
    };
  };
  reconciliation: {
    customerSoaBalance: number;
    arControlAccountBalance: number;
    customerArPostedBalance: number;
    status: "Reconciled" | "Difference Found";
    difference: number;
  };
}

export interface MonthlySheetDailyRecord {
  dayNumber: number;
  date: string;
  dayName: string;
  isWeekend: boolean;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: number;
  overtimeHours: number;
  lateMinutes: number;
  location: string;
  notes: string;
}

export interface EmployeeMonthlySheetData {
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    department: string;
    designation: string;
    joiningDate: string;
    employmentStatus: string;
    contractType: string;
    emiratesId?: string | null;
    emiratesIdExpiry?: string | null;
    passportNo?: string | null;
    passportExpiry?: string | null;
    visaNumber?: string | null;
    visaExpiry?: string | null;
    laborCardNo?: string | null;
    laborCardExpiry?: string | null;
    annualLeaveBalance: number;
    paymentMethod: string;
    bankName?: string | null;
    iban?: string | null;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
    totalDaysInMonth: number;
    startDate: string;
    endDate: string;
  };
  attendanceSummary: {
    totalDays: number;
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    totalLateMinutes: number;
    daysOnLeave: number;
    weekendHolidayDays: number;
    totalWorkingHours: number;
    totalOvertimeHours: number;
    attendanceRate: number;
  };
  dailyRecords: MonthlySheetDailyRecord[];
  bonuses: Array<{
    id: string;
    type: string;
    amount: number;
    reason?: string | null;
    isPaid?: boolean;
    paidDate?: string | null;
  }>;
  leaves: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string | null;
    status: string;
  }>;
  payroll: {
    payrollRecordId?: string | null;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    totalAllowances: number;
    grossSalary: number;
    hourlyRate: number;
    dailyRate: number;
    overtimeHours: number;
    overtimeAmount: number;
    bonusAmount: number;
    absenceDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    isPaid: boolean;
    paymentDate?: string | null;
    remarks?: string | null;
    paymentMethod: string;
    bankName?: string | null;
    iban?: string | null;
  };
}

export interface WorkforceMonthlySheetItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  daysPresent: number;
  daysAbsent: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductions: number;
  netSalary: number;
  paymentMethod: string;
  bankName: string;
  iban: string;
  isPaid: boolean;
  paymentDate?: string | null;
}

export interface WorkforceMonthlySheetData {
  period: {
    month: number;
    year: number;
    monthName: string;
    totalDaysInMonth: number;
    startDate: string;
    endDate: string;
  };
  workforceStats: {
    totalEmployees: number;
    totalWorkforceGross: number;
    totalOvertimeAmount: number;
    totalBonuses: number;
    totalDeductions: number;
    totalNetPayroll: number;
    totalOvertimeHours: number;
    averageDaysPresent: number;
  };
  employeeSheets: WorkforceMonthlySheetItem[];
}
