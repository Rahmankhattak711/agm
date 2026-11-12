import type { RegisterColumn } from "@/components/ui";

export const ROLE_DISPLAY_CONFIG: Record<
  string,
  { label: string; badge: string; color: string; description: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    badge: "bg-purple-100 text-purple-900 border-purple-200",
    color: "bg-purple-600",
    description: "Full system authority, root access, security configuration",
  },
  ADMIN: {
    label: "Admin",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
    color: "bg-emerald-600",
    description: "Management executive, contract approvals, user management",
  },
  ACCOUNTANT: {
    label: "Finance",
    badge: "bg-blue-100 text-blue-900 border-blue-200",
    color: "bg-blue-600",
    description: "Accounting & ledger control, invoices, bills, P&L reports",
  },
  USER: {
    label: "Operations",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    color: "bg-amber-600",
    description: "Site execution, project progress, purchase requests",
  },
  HR: {
    label: "HR Specialist",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
    color: "bg-rose-600",
    description: "Human resources, staff onboarding, legal compliance",
  },
  INVENTORY_MANAGER: {
    label: "Inventory Lead",
    badge: "bg-indigo-100 text-indigo-900 border-indigo-200",
    color: "bg-indigo-600",
    description: "Warehouse inventory stock, goods receipt & movements",
  },
};

export const CORE_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin (Root & Security)" },
  { value: "ADMIN", label: "Admin (Executive Management)" },
  { value: "ACCOUNTANT", label: "Finance (Accounting & Ledger)" },
  { value: "USER", label: "Operations (Sites & Projects)" },
];

export const ALL_ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-900 border-purple-200" },
  { value: "ADMIN", label: "Admin", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  { value: "ACCOUNTANT", label: "Finance", color: "bg-blue-100 text-blue-900 border-blue-200" },
  { value: "USER", label: "Operations", color: "bg-amber-100 text-amber-900 border-amber-200" },
  { value: "HR", label: "HR Specialist", color: "bg-rose-100 text-rose-900 border-rose-200" },
  { value: "INVENTORY_MANAGER", label: "Inventory Lead", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
];

export const ASSIGNABLE_ROLES = ALL_ROLES;

export const USER_TABLE_COLUMNS: RegisterColumn[] = [
  { label: "User Name", compact: true },
  { label: "Email Address", compact: true },
  {
    label: "Role",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Status",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Password Gated",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3 sm:pr-4",
  },
];
