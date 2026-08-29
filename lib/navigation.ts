export const SECTION_PATHS: Record<string, string> = {
  dashboard: "/dashboard",

  // Inventory & Commercial
  products: "/inventory/products",
  "purchase-vouchers": "/inventory/purchase-orders",
  "purchase-orders": "/inventory/purchase-orders",
  "purchase-returns": "/inventory/purchase-returns",
  "sales-vouchers": "/inventory/sales-vouchers",
  "sales-returns": "/inventory/sales-returns",
  suppliers: "/inventory/suppliers",
  customers: "/commercial/customers",
  warehouses: "/inventory/warehouses",
  "stock-movements": "/inventory/stock-movements",
  "commercial-customers": "/commercial/customers",

  // Commercial Modules
  "commercial-quotations": "/commercial/quotations",
  "commercial-sales-orders": "/commercial/sales-orders",
  "commercial-sales-invoices": "/commercial/sales-invoices",
  "commercial-customer-payments": "/commercial/customer-payments",
  "commercial-credit-notes": "/commercial/credit-notes",
  "commercial-purchase-requests": "/commercial/purchase-requests",
  "commercial-goods-received": "/commercial/goods-received",
  "commercial-supplier-bills": "/commercial/supplier-bills",
  "commercial-supplier-payments": "/commercial/supplier-payments",
  "commercial-debit-notes": "/commercial/debit-notes",

  // Finance & Accounts
  accounts: "/finance/accounts",
  journals: "/finance/journal-entries",
  receivables: "/finance/reports?tab=receivables",
  payables: "/finance/reports?tab=payables",
  payments: "/commercial/customer-payments",
  quotations: "/finance/quotations",
  expenses: "/finance/expenses",
  vat: "/finance/reports?tab=vat-summary",
  reports: "/finance/reports",

  // Reports direct links
  "report-profit-loss": "/finance/reports?tab=profit-loss",
  "report-balance-sheet": "/finance/reports?tab=balance-sheet",
  "report-trial-balance": "/finance/reports?tab=trial-balance",
  "report-receivables": "/finance/reports?tab=receivables",
  "report-payables": "/finance/reports?tab=payables",
  "report-ledger": "/finance/reports?tab=ledger",
  "report-vat": "/finance/reports?tab=vat-summary",

  // Dedicated Reports Section
  "report-sales": "/reports/sales",
  "report-purchases": "/reports/purchases",
  "report-customers": "/reports/customers",
  "report-suppliers": "/reports/suppliers",
  "report-expenses": "/reports/expenses",
  "report-management": "/reports/management",

  // HR & Operations
  employees: "/operations/employees",
  attendance: "/operations/attendance",
  leaves: "/operations/leaves",
  bonuses: "/operations/bonuses",
  assets: "/operations/fixed-assets",

  // Admin
  admin: "/administration/users",
};

export interface PageMeta {
  eyebrow: string;
  title: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": { eyebrow: "Overview", title: "Executive Dashboard" },

  // Commercial - Sales
  "/commercial/quotations": {
    eyebrow: "Commercial",
    title: "Quotations & Project Proposals",
  },
  "/commercial/sales-orders": {
    eyebrow: "Commercial",
    title: "Sales Orders & Contracts",
  },
  "/commercial/sales-invoices": {
    eyebrow: "Commercial",
    title: "Sales Invoices (AR Billing)",
  },
  "/commercial/customer-payments": {
    eyebrow: "Commercial",
    title: "Customer Payments & Receipts",
  },
  "/commercial/credit-notes": {
    eyebrow: "Commercial",
    title: "Sales Returns / Credit Notes",
  },

  // Commercial - Purchases
  "/commercial/purchase-requests": {
    eyebrow: "Commercial",
    title: "Purchase Requests (Requisitions)",
  },
  "/commercial/purchase-orders": {
    eyebrow: "Commercial",
    title: "Purchase Orders (PO)",
  },
  "/commercial/goods-received": {
    eyebrow: "Commercial",
    title: "Goods Received Notes (GRN)",
  },
  "/commercial/supplier-bills": {
    eyebrow: "Commercial",
    title: "Supplier Bills (AP Invoices)",
  },
  "/commercial/supplier-payments": {
    eyebrow: "Commercial",
    title: "Supplier Payments (Disbursals)",
  },
  "/commercial/debit-notes": {
    eyebrow: "Commercial",
    title: "Purchase Returns / Debit Notes",
  },

  // Master Data & Inventory
  "/commercial/customers": {
    eyebrow: "Master Data",
    title: "Customers Directory & Statements",
  },
  "/inventory/products": {
    eyebrow: "Inventory",
    title: "Products & Stock Management",
  },
  "/inventory/stock-movements": {
    eyebrow: "Inventory",
    title: "Inventory Stock Movements",
  },
  "/inventory/purchase-orders": {
    eyebrow: "Inventory",
    title: "Procurement & Purchase Orders",
  },
  "/inventory/purchase-returns": {
    eyebrow: "Inventory",
    title: "Purchase Returns & Debit Vouchers",
  },
  "/inventory/sales-vouchers": {
    eyebrow: "Inventory",
    title: "Commercial Sales Vouchers",
  },
  "/inventory/sales-returns": {
    eyebrow: "Inventory",
    title: "Sales Returns & Credit Vouchers",
  },
  "/inventory/suppliers": {
    eyebrow: "Inventory",
    title: "Suppliers & Vendor Management",
  },
  "/inventory/warehouses": {
    eyebrow: "Inventory",
    title: "Warehouses & Storage Facilities",
  },

  // Finance & Accounts
  "/finance/accounts": {
    eyebrow: "Finance & Accounts",
    title: "Chart of Accounts",
  },
  "/finance/journal-entries": {
    eyebrow: "Finance & Accounts",
    title: "General Journal Entries",
  },
  "/finance/expenses": {
    eyebrow: "Finance & Accounts",
    title: "Operating Expenses & Direct Claims",
  },
  "/finance/quotations": {
    eyebrow: "Commercial & Finance",
    title: "Commercial Quotations & Estimates",
  },
  "/finance/reports": {
    eyebrow: "Financial Reports",
    title: "Financial Statements & Analytics",
  },

  // HR & Operations
  "/operations/employees": {
    eyebrow: "HR & Operations",
    title: "Employee Directory & Profiles",
  },
  "/operations/attendance": {
    eyebrow: "HR & Operations",
    title: "Daily Attendance & Timesheets",
  },
  "/operations/leaves": {
    eyebrow: "HR & Operations",
    title: "Leave Management & Balances",
  },
  "/operations/bonuses": {
    eyebrow: "HR & Operations",
    title: "Bonuses & Performance Incentives",
  },
  "/operations/fixed-assets": {
    eyebrow: "Operations",
    title: "Fixed Assets & Depreciation",
  },

  "/administration/users": {
    eyebrow: "Administration",
    title: "User & Role Management",
  },
};

export function getPageMeta(pathname: string): PageMeta {
  const exact = PAGE_META[pathname];
  if (exact) return exact;

  const match = Object.entries(PAGE_META).find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (match) return match[1];

  return { eyebrow: "Workspace", title: "AGM ERP System" };
}

export function getSectionFromPath(pathname: string): string {
  if (pathname === "/dashboard") return "dashboard";

  for (const [section, path] of Object.entries(SECTION_PATHS)) {
    if (path.includes("?")) {
      const [basePath] = path.split("?");
      if (pathname === basePath) {
        return section;
      }
    } else if (pathname === path || pathname.startsWith(`${path}/`)) {
      return section;
    }
  }

  return "dashboard";
}
