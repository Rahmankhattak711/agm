import type { BadgeTone, RegisterColumn } from "@/components/ui";

export const ROLE_TONES: Record<string, BadgeTone> = {
  SUPER_ADMIN: "purple",
  ADMIN: "sky",
  ACCOUNTANT: "emerald",
  HR: "teal",
  INVENTORY_MANAGER: "amber",
  USER: "slate",
};

export const ASSIGNABLE_ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-sky-50 text-sky-800 border-sky-200",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    value: "HR",
    label: "HR Specialist",
    color: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    value: "USER",
    label: "Standard User",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export const ALL_ROLES = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
  ...ASSIGNABLE_ROLES,
];

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
