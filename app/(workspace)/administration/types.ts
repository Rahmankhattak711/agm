import type { RegisterColumn } from "@/components/ui";

export const ASSIGNABLE_ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-agm-green-soft text-agm-green border-agm-box-border",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },
  {
    value: "HR",
    label: "HR Specialist",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "bg-agm-box-bg text-agm-text border-agm-box-border",
  },
  {
    value: "USER",
    label: "Standard User",
    color: "bg-agm-box-bg text-agm-muted border-agm-box-border",
  },
];

export const ALL_ROLES = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    color: "bg-agm-navy text-white border-agm-navy",
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
