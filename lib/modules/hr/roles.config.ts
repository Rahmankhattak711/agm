import type { RoleDefinition } from "./types";

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    code: "SUPER_ADMIN",
    category: "ADMINISTRATION",
    description: "Complete unconstrained access across all corporate entities, GL ledgers, security configurations, and user audits.",
    defaultRoute: "/dashboard",
    isFieldWorker: false,
    capabilities: {
      canAccessERP: true,
      canManageUsers: true,
      canApprovePayroll: true,
      canPostToLedger: true,
      canRecordAttendance: true,
      canViewFinancialReports: true,
    },
    permissions: [
      { module: "Administration & Users", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "General Ledger & Accounting", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "Human Resources & Payroll", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "Fixed Assets", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "Inventory & Purchasing", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "Commercial & Sales", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    ],
  },
  {
    id: "admin",
    name: "Admin",
    code: "ADMIN",
    category: "ADMINISTRATION",
    description: "Operational administrator managing company-wide users, day-to-day operations, workflows, and core registers.",
    defaultRoute: "/dashboard",
    isFieldWorker: false,
    capabilities: {
      canAccessERP: true,
      canManageUsers: true,
      canApprovePayroll: true,
      canPostToLedger: true,
      canRecordAttendance: true,
      canViewFinancialReports: true,
    },
    permissions: [
      { module: "Administration & Users", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "General Ledger & Accounting", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "Human Resources & Payroll", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "Fixed Assets", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "Inventory & Purchasing", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "Commercial & Sales", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    ],
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    code: "HR",
    category: "MANAGEMENT",
    description: "Workforce manager overseeing employee records, daily timesheets, leave approvals, and monthly WPS payroll calculation.",
    defaultRoute: "/hr/employees",
    isFieldWorker: false,
    capabilities: {
      canAccessERP: true,
      canManageUsers: false,
      canApprovePayroll: true,
      canPostToLedger: false,
      canRecordAttendance: true,
      canViewFinancialReports: false,
    },
    permissions: [
      { module: "Administration & Users", view: false, create: false, edit: false, delete: false },
      { module: "General Ledger & Accounting", view: false, create: false, edit: false, delete: false },
      { module: "Human Resources & Payroll", view: true, create: true, edit: true, delete: true, approve: true, export: true },
      { module: "Fixed Assets", view: true, create: false, edit: false, delete: false, export: true },
      { module: "Inventory & Purchasing", view: false, create: false, edit: false, delete: false },
      { module: "Commercial & Sales", view: false, create: false, edit: false, delete: false },
    ],
  },
  {
    id: "accountant",
    name: "Accountant",
    code: "ACCOUNTANT",
    category: "MANAGEMENT",
    description: "Financial controller handling double-entry journals, chart of accounts, trial balance, and payroll disbursement.",
    defaultRoute: "/finance/accounts",
    isFieldWorker: false,
    capabilities: {
      canAccessERP: true,
      canManageUsers: false,
      canApprovePayroll: true,
      canPostToLedger: true,
      canRecordAttendance: false,
      canViewFinancialReports: true,
    },
    permissions: [
      { module: "Administration & Users", view: false, create: false, edit: false, delete: false },
      { module: "General Ledger & Accounting", view: true, create: true, edit: true, delete: false, approve: true, export: true },
      { module: "Human Resources & Payroll", view: true, create: false, edit: true, delete: false, approve: true, export: true },
      { module: "Fixed Assets", view: true, create: true, edit: true, delete: false, export: true },
      { module: "Inventory & Purchasing", view: true, create: true, edit: true, delete: false, export: true },
      { module: "Commercial & Sales", view: true, create: true, edit: true, delete: false, export: true },
    ],
  },
  {
    id: "field_worker",
    name: "Site Worker / Operations Staff",
    code: "FIELD_WORKER",
    category: "OPERATIONS_FIELD",
    description: "Operational field crew member recording project/site check-in, tracking work hours, and reviewing personal payslips.",
    defaultRoute: "/hr/workforce?tab=attendance",
    isFieldWorker: true,
    capabilities: {
      canAccessERP: false,
      canManageUsers: false,
      canApprovePayroll: false,
      canPostToLedger: false,
      canRecordAttendance: true,
      canViewFinancialReports: false,
    },
    permissions: [
      { module: "Personal Attendance", view: true, create: true, edit: false, delete: false },
      { module: "Personal Paychecks", view: true, create: false, edit: false, delete: false },
    ],
  },
];

export function getRoleByCode(code: string): RoleDefinition | undefined {
  return SYSTEM_ROLES.find((r) => r.code === code || r.id === code.toLowerCase());
}

export function isFieldWorkerRole(roleCode: string): boolean {
  const role = getRoleByCode(roleCode);
  return role ? role.isFieldWorker : roleCode === "USER";
}
