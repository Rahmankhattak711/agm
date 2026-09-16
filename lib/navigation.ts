export const SECTION_PATHS: Record<string, string> = {
  dashboard: "/dashboard",

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
  "commercial-agreements": "/commercial/agreements",
  agreements: "/commercial/agreements",
  "company-agreements": "/commercial/agreements",
  "risk-assessments": "/commercial/risk-assessments",
  "commercial-risk-assessments": "/commercial/risk-assessments",
  "method-statements": "/commercial/method-statements",
  "commercial-method-statements": "/commercial/method-statements",

  accounts: "/finance/accounts",
  journals: "/finance/journal-entries",
  receivables: "/finance/reports?tab=receivables",
  payables: "/finance/reports?tab=payables",
  payments: "/commercial/customer-payments",
  quotations: "/finance/quotations",
  expenses: "/finance/expenses",
  vat: "/finance/reports?tab=vat-summary",
  reports: "/finance/reports",

  "report-profit-loss": "/finance/reports?tab=profit-loss",
  "report-balance-sheet": "/finance/reports?tab=balance-sheet",
  "report-trial-balance": "/finance/reports?tab=trial-balance",
  "report-receivables": "/finance/reports?tab=receivables",
  "report-payables": "/finance/reports?tab=payables",
  "report-ledger": "/finance/reports?tab=ledger",
  "report-vat": "/finance/reports?tab=vat-summary",

  "report-sales": "/reports/sales",
  "report-purchases": "/reports/purchases",
  "report-customers": "/reports/customers",
  "report-suppliers": "/reports/suppliers",
  "report-expenses": "/reports/expenses",
  "report-management": "/reports/management",

  "operations-dashboard": "/operations/dashboard",
  employees: "/operations/employees",
  attendance: "/operations/attendance",
  leaves: "/operations/leaves",
  bonuses: "/operations/bonuses",
  assets: "/operations/fixed-assets",

  admin: "/administration/users",
};

export interface PageMeta {
  eyebrow: string;
  title: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": {
    eyebrow: "Overview",
    title: "Executive Dashboard",
  },

  "/commercial/quotations": {
    eyebrow: "Commercial",
    title: "Quotations",
  },
  "/commercial/sales-orders": {
    eyebrow: "Commercial",
    title: "Sales Orders",
  },
  "/commercial/sales-invoices": {
    eyebrow: "Commercial",
    title: "Sales Invoices",
  },
  "/commercial/customer-payments": {
    eyebrow: "Commercial",
    title: "Customer Payments",
  },
  "/commercial/credit-notes": {
    eyebrow: "Commercial",
    title: "Credit Notes",
  },
  "/commercial/purchase-requests": {
    eyebrow: "Commercial",
    title: "Purchase Requests",
  },
  "/commercial/purchase-orders": {
    eyebrow: "Commercial",
    title: "Purchase Orders",
  },
  "/commercial/goods-received": {
    eyebrow: "Commercial",
    title: "Goods Received",
  },
  "/commercial/supplier-bills": {
    eyebrow: "Commercial",
    title: "Supplier Bills",
  },
  "/commercial/supplier-payments": {
    eyebrow: "Commercial",
    title: "Supplier Payments",
  },
  "/commercial/debit-notes": {
    eyebrow: "Commercial",
    title: "Debit Notes",
  },
  "/commercial/agreements": {
    eyebrow: "Company Documents",
    title: "Company Agreements",
  },
  "/commercial/risk-assessments": {
    eyebrow: "Company Documents",
    title: "Risk Assessments",
  },
  "/commercial/method-statements": {
    eyebrow: "Company Documents",
    title: "Method Statements",
  },
  "/commercial/customers": {
    eyebrow: "Master Data",
    title: "Customers",
  },

  "/inventory/products": {
    eyebrow: "Inventory",
    title: "Products",
  },
  "/inventory/stock-movements": {
    eyebrow: "Inventory",
    title: "Stock Movements",
  },
  "/inventory/purchase-orders": {
    eyebrow: "Inventory",
    title: "Purchase Orders",
  },
  "/inventory/purchase-returns": {
    eyebrow: "Inventory",
    title: "Purchase Returns",
  },
  "/inventory/sales-vouchers": {
    eyebrow: "Inventory",
    title: "Sales Vouchers",
  },
  "/inventory/sales-returns": {
    eyebrow: "Inventory",
    title: "Sales Returns",
  },
  "/inventory/suppliers": {
    eyebrow: "Inventory",
    title: "Suppliers",
  },
  "/inventory/warehouses": {
    eyebrow: "Inventory",
    title: "Warehouses",
  },

  "/finance/accounts": {
    eyebrow: "Finance & Accounts",
    title: "Chart of Accounts",
  },
  "/finance/journal-entries": {
    eyebrow: "Finance & Accounts",
    title: "Journal Entries",
  },
  "/finance/expenses": {
    eyebrow: "Finance & Accounts",
    title: "Expenses",
  },
  "/finance/quotations": {
    eyebrow: "Commercial & Finance",
    title: "Quotations",
  },
  "/finance/reports": {
    eyebrow: "Financial Reports",
    title: "Financial Reports",
  },

  "/operations": {
    eyebrow: "Operations",
    title: "Operations Dashboard",
  },
  "/operations/dashboard": {
    eyebrow: "Operations",
    title: "Operations Dashboard",
  },
  "/operations/employees": {
    eyebrow: "HR & Operations",
    title: "Employees",
  },
  "/operations/attendance": {
    eyebrow: "HR & Operations",
    title: "Attendance",
  },
  "/operations/leaves": {
    eyebrow: "HR & Operations",
    title: "Leave Management",
  },
  "/operations/bonuses": {
    eyebrow: "HR & Operations",
    title: "Bonuses",
  },
  "/operations/fixed-assets": {
    eyebrow: "Operations",
    title: "Fixed Assets",
  },

  "/administration/users": {
    eyebrow: "Administration",
    title: "Users & Roles",
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
