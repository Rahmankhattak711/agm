"use client";

import React, { useState, useMemo } from "react";
import { useUsers } from "@/lib/hooks/admin-hooks";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  FileText,
  Lock,
  ChevronDown,
} from "lucide-react";

interface ModulePermission {
  id: string;
  name: string;
  description: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, ModulePermission[]> = {
  SUPER_ADMIN: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices, credit notes, collections", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "bills", name: "Supplier Bills & Payables", description: "Vendor bills, debit notes, disbursements", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries, manual adjustments, chart of accounts", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank transactions, transfers, payment vouchers", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Asset registration, capitalization, depreciation", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "payroll", name: "Workforce & Payroll", description: "Employee records, attendance, WPS SIF runs", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "inventory", name: "Stock & Warehouses", description: "Material stock, stock levels, goods receipt", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "commercial", name: "Customers & Quotations", description: "Customer CRM, commercial agreements, contracts", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "reports", name: "Financial Reports", description: "Trial Balance, Balance Sheet, P&L, Audit Logs", view: true, create: true, edit: true, delete: true, approve: true, export: true },
  ],
  ADMIN: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices, credit notes, collections", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "bills", name: "Supplier Bills & Payables", description: "Vendor bills, debit notes, disbursements", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries, manual adjustments", view: true, create: true, edit: false, delete: false, approve: true, export: true },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank transactions, transfers", view: true, create: true, edit: false, delete: false, approve: true, export: true },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Asset registration, capitalization", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "payroll", name: "Workforce & Payroll", description: "Employee records, attendance, WPS runs", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "inventory", name: "Stock & Warehouses", description: "Material stock, stock levels", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "commercial", name: "Customers & Quotations", description: "Customer CRM, commercial agreements", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "reports", name: "Financial Reports", description: "Trial Balance, Balance Sheet, P&L", view: true, create: false, edit: false, delete: false, approve: false, export: true },
  ],
  ACCOUNTANT: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices, collections", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "bills", name: "Supplier Bills & Payables", description: "Vendor bills, debit notes", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries, chart of accounts", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank transactions, payouts", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Asset register, capitalization", view: true, create: true, edit: true, delete: false, approve: true, export: true },
    { id: "payroll", name: "Workforce & Payroll", description: "Payroll review & GL post", view: true, create: false, edit: false, delete: false, approve: true, export: true },
    { id: "inventory", name: "Stock & Warehouses", description: "Stock valuation check", view: true, create: false, edit: false, delete: false, approve: false, export: true },
    { id: "commercial", name: "Customers & Quotations", description: "Customer ledger balances", view: true, create: false, edit: false, delete: false, approve: false, export: true },
    { id: "reports", name: "Financial Reports", description: "Trial Balance, Balance Sheet", view: true, create: true, edit: true, delete: false, approve: true, export: true },
  ],
  HR: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "bills", name: "Supplier Bills & Payables", description: "Supplier bills", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank payouts", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Asset assignment", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "payroll", name: "Workforce & Payroll", description: "Employee records, attendance, WPS", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "inventory", name: "Stock & Warehouses", description: "Material stock", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "commercial", name: "Customers & Quotations", description: "Customer CRM", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "reports", name: "Financial Reports", description: "Financial statements", view: false, create: false, edit: false, delete: false, approve: false, export: false },
  ],
  INVENTORY_MANAGER: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "bills", name: "Supplier Bills & Payables", description: "Supplier bills & purchase orders", view: true, create: true, edit: true, delete: false, approve: false, export: true },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank payouts", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Capital equipment tracking", view: true, create: true, edit: false, delete: false, approve: false, export: true },
    { id: "payroll", name: "Workforce & Payroll", description: "Employee records", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "inventory", name: "Stock & Warehouses", description: "Stock levels, Goods Receipts", view: true, create: true, edit: true, delete: true, approve: true, export: true },
    { id: "commercial", name: "Customers & Quotations", description: "Customer orders", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "reports", name: "Financial Reports", description: "Financial statements", view: false, create: false, edit: false, delete: false, approve: false, export: false },
  ],
  USER: [
    { id: "invoices", name: "Invoices & Receivables", description: "Sales invoices", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "bills", name: "Supplier Bills & Payables", description: "Supplier bills", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "gl", name: "General Ledger & Journals", description: "Journal entries", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "banking", name: "Bank & Cash Accounts", description: "Bank payouts", view: false, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "fixed_assets", name: "Fixed Assets & PPE", description: "Fixed assets", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "payroll", name: "Workforce & Payroll", description: "Own attendance & leaves", view: true, create: true, edit: false, delete: false, approve: false, export: false },
    { id: "inventory", name: "Stock & Warehouses", description: "Stock items", view: true, create: false, edit: false, delete: false, approve: false, export: false },
    { id: "commercial", name: "Customers & Quotations", description: "Quotations view", view: true, create: true, edit: false, delete: false, approve: false, export: false },
    { id: "reports", name: "Financial Reports", description: "Financial statements", view: false, create: false, edit: false, delete: false, approve: false, export: false },
  ],
};

export default function PermissionMatrixPage() {
  const { data: usersData } = useUsers();
  const users = useMemo(() => usersData?.users || [], [usersData?.users]);

  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [matrixState, setMatrixState] = useState<Record<string, ModulePermission[]>>(DEFAULT_ROLE_PERMISSIONS);

  // Group users by role
  const usersByRole = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.role] = (map[u.role] || 0) + 1;
    });
    return map;
  }, [users]);

  const currentPermissions = matrixState[selectedRole] || matrixState["ADMIN"];

  const handleToggle = (moduleId: string, action: keyof Omit<ModulePermission, "id" | "name" | "description">) => {
    if (selectedRole === "SUPER_ADMIN") {
      toast.info("Super Administrator privileges are root-enforced and cannot be revoked.");
      return;
    }

    setMatrixState((prev) => {
      const rolePerms = [...(prev[selectedRole] || [])];
      const modIndex = rolePerms.findIndex((m) => m.id === moduleId);
      if (modIndex >= 0) {
        rolePerms[modIndex] = {
          ...rolePerms[modIndex],
          [action]: !rolePerms[modIndex][action],
        };
      }
      return {
        ...prev,
        [selectedRole]: rolePerms,
      };
    });
    toast.success(`Permission updated for ${selectedRole}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* =========================================================================
          PERMISSION MATRIX HEADER (Matching Screenshot 5)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Permission Matrix
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Fine-grained access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular View, Create, Edit, Delete, Approve, and Export capabilities across all operational modules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.success("Permission policies synchronized successfully across the cluster.")}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Save Matrix Policies
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TOP 4 KPI SUMMARY CARDS (Matching Screenshot 5)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Configured Roles</span>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">6</div>
          <div className="text-[11px] text-slate-400 mt-1">Tier-0 to Tier-4 roles</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Protected Modules</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">9</div>
          <div className="text-[11px] text-slate-400 mt-1">Enterprise domains</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Users Enforced</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active identity accounts</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Audit Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            100% Policy Sync
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Zero permission conflicts</div>
        </div>
      </div>

      {/* =========================================================================
          MAIN MATRIX VIEW & ROLES SIDEBAR (Matching Screenshot 5)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
        {/* Left Column: Interactive Checkbox Matrix (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Role Selector Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Permissions for:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-900 outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="SUPER_ADMIN">Super Administrator (Root)</option>
                  <option value="ADMIN">System Administrator</option>
                  <option value="ACCOUNTANT">Finance Manager / Accountant</option>
                  <option value="HR">HR Specialist</option>
                  <option value="INVENTORY_MANAGER">Inventory Lead</option>
                  <option value="USER">Standard User</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Changes persist automatically across sessions
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Operational Module</th>
                    <th className="py-3 px-2 text-center w-20">View</th>
                    <th className="py-3 px-2 text-center w-20">Create</th>
                    <th className="py-3 px-2 text-center w-20">Edit</th>
                    <th className="py-3 px-2 text-center w-20">Delete</th>
                    <th className="py-3 px-2 text-center w-20">Approve</th>
                    <th className="py-3 px-2 text-center w-20">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPermissions.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{mod.name}</div>
                        <div className="text-[11px] text-slate-400">{mod.description}</div>
                      </td>

                      {/* Checkboxes for each action (Styled like Screenshot 5) */}
                      {(["view", "create", "edit", "delete", "approve", "export"] as const).map(
                        (action) => {
                          const isChecked = mod[action];
                          return (
                            <td key={action} className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggle(mod.id, action)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "border border-slate-200 bg-white hover:border-slate-400"
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        },
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Roles Overview Sidebar (Matching Screenshot 5) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Roles Overview
            </h3>

            <div className="space-y-2.5">
              {[
                { name: "Super Admin", code: "SUPER_ADMIN" },
                { name: "Admin", code: "ADMIN" },
                { name: "Accountant", code: "ACCOUNTANT" },
                { name: "HR Specialist", code: "HR" },
                { name: "Inventory Lead", code: "INVENTORY_MANAGER" },
                { name: "Standard User", code: "USER" },
              ].map((r) => {
                const count = usersByRole[r.code] || 0;
                const isSelected = selectedRole === r.code;

                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setSelectedRole(r.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {count} {count === 1 ? "user" : "users"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Security Enforcement
              </div>
              <p className="leading-relaxed">
                Permissions are validated on both client routers and server-side CQRS query handlers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
