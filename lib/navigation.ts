export const SECTION_PATHS: Record<string, string> = {
  dashboard: "/dashboard",
  accounts: "/finance/accounts",
  journals: "/finance/journal-entries",
  "petty-cash": "/finance/petty-cash",
  reports: "/finance/reports",
  employees: "/operations/employees",
  attendance: "/operations/attendance",
  leaves: "/operations/leaves",
  bonuses: "/operations/bonuses",
  assets: "/operations/fixed-assets",
  products: "/inventory/products",
  "stock-movements": "/inventory/stock-movements",
  "purchase-orders": "/inventory/purchase-orders",
  suppliers: "/inventory/suppliers",
  warehouses: "/inventory/warehouses",
  admin: "/administration/users",
};

export interface PageMeta {
  eyebrow: string;
  title: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": { eyebrow: "Overview", title: "Executive Dashboard" },
  "/finance/accounts": { eyebrow: "Finance", title: "Chart of Accounts" },
  "/finance/journal-entries": { eyebrow: "Finance", title: "Journal Entries & Ledger" },
  "/finance/petty-cash": { eyebrow: "Finance", title: "Petty Cash Management" },
  "/finance/reports": { eyebrow: "Finance", title: "Financial Reports & Statements" },
  "/operations/employees": { eyebrow: "HR & Operations", title: "Employee Directory & Records" },
  "/operations/attendance": { eyebrow: "HR & Operations", title: "Daily Attendance & Timesheets" },
  "/operations/leaves": { eyebrow: "HR & Operations", title: "Leave Management & Balances" },
  "/operations/bonuses": { eyebrow: "HR & Operations", title: "Bonuses & Performance Incentives" },
  "/operations/fixed-assets": { eyebrow: "Operations", title: "Fixed Assets & Depreciation" },
  "/inventory/products": { eyebrow: "Inventory", title: "Products & Stock Catalog" },
  "/inventory/stock-movements": { eyebrow: "Inventory", title: "Stock Movements & Transfers" },
  "/inventory/purchase-orders": { eyebrow: "Inventory", title: "Purchase Orders & Receiving" },
  "/inventory/suppliers": { eyebrow: "Inventory", title: "Suppliers & Vendor Management" },
  "/inventory/warehouses": { eyebrow: "Inventory", title: "Warehouses & Storage Facilities" },
  "/administration/users": { eyebrow: "Administration", title: "User & Role Management" },
};

export function getPageMeta(pathname: string): PageMeta {
  const exact = PAGE_META[pathname];
  if (exact) return exact;

  const match = Object.entries(PAGE_META).find(([path]) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );
  if (match) return match[1];

  return { eyebrow: "Workspace", title: "Dashboard" };
}

export function getSectionFromPath(pathname: string): string {
  const match = Object.entries(SECTION_PATHS).find(([, path]) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.[0] ?? "dashboard";
}
