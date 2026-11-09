"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUsers } from "@/lib/hooks/admin-hooks";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Plus,
  TableProperties,
  Scale,
  Users,
  Building,
  KeyRound,
  FileText,
  Boxes,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface RoleCardData {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  department: string;
  permissionsCount: number;
  capabilities: string[];
  icon: any;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
}

const SYSTEM_ROLES: RoleCardData[] = [
  {
    id: "role-super-admin",
    name: "Super Administrator",
    code: "SUPER_ADMIN",
    isSystem: true,
    department: "Executive Management",
    permissionsCount: 18,
    capabilities: [
      "Root System Authorization",
      "User & Role Management",
      "Audit Log Inspection",
      "Disaster Recovery & Overrides",
    ],
    icon: Sparkles,
    colorScheme: {
      bg: "bg-slate-900",
      border: "border-slate-800",
      text: "text-white",
      badge: "bg-slate-800 text-slate-200 border-slate-700",
    },
  },
  {
    id: "role-admin",
    name: "System Administrator",
    code: "ADMIN",
    isSystem: true,
    department: "IT & Operations",
    permissionsCount: 15,
    capabilities: [
      "Create & Manage Accounts",
      "Assign User Roles",
      "Commercial Contract Approvals",
      "Export System Data",
    ],
    icon: Shield,
    colorScheme: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    },
  },
  {
    id: "role-finance",
    name: "Finance Manager / Accountant",
    code: "ACCOUNTANT",
    isSystem: true,
    department: "Finance & Accounts",
    permissionsCount: 12,
    capabilities: [
      "Approve Invoices & Bills",
      "Post General Ledger Journals",
      "Disburse Supplier Payments",
      "Export Balance Sheet & P&L",
    ],
    icon: Scale,
    colorScheme: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      badge: "bg-blue-100 text-blue-900 border-blue-300",
    },
  },
  {
    id: "role-hr",
    name: "HR Business Partner",
    code: "HR",
    isSystem: true,
    department: "Human Resources",
    permissionsCount: 9,
    capabilities: [
      "Manage Employee Directory",
      "Process Monthly Payroll Sheet",
      "Approve Leaves & Bonuses",
      "WPS SIF File Generation",
    ],
    icon: Users,
    colorScheme: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      badge: "bg-purple-100 text-purple-900 border-purple-300",
    },
  },
  {
    id: "role-inventory",
    name: "Inventory & Supply Lead",
    code: "INVENTORY_MANAGER",
    isSystem: true,
    department: "Warehouse & Logistics",
    permissionsCount: 8,
    capabilities: [
      "Log Material Purchases",
      "Record Goods Received Vouchers",
      "Stock Transfers & Adjustments",
      "Vendor Catalog Management",
    ],
    icon: Boxes,
    colorScheme: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-900 border-amber-300",
    },
  },
  {
    id: "role-user",
    name: "Standard Operational User",
    code: "USER",
    isSystem: true,
    department: "Site & Administration",
    permissionsCount: 5,
    capabilities: [
      "View Assigned Projects",
      "Generate Quotations",
      "Record Daily Attendance",
      "View Document Repository",
    ],
    icon: FileText,
    colorScheme: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-800",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
    },
  },
];

export default function RoleBuilderPage() {
  const router = useRouter();
  const { data: usersData, isLoading } = useUsers();
  const users = useMemo(() => usersData?.users || [], [usersData?.users]);

  // Group users by role code
  const usersByRole = useMemo(() => {
    const map: Record<string, typeof users> = {};
    users.forEach((u) => {
      if (!map[u.role]) map[u.role] = [];
      map[u.role].push(u);
    });
    return map;
  }, [users]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 font-sans">
      {/* =========================================================================
          ROLE BUILDER HEADER (Matching Screenshot 4)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Role Builder
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              {SYSTEM_ROLES.length} roles configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system roles, privileges, capability boundaries, and user assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/administration/permissions")}
            icon={<TableProperties size={14} />}
            className="text-xs font-semibold bg-white"
          >
            Role Matrix
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/administration/permissions")}
            icon={<Plus size={14} />}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Create Role
          </Button>
        </div>
      </div>

      {/* =========================================================================
          ROLE CARDS GRID (Matching Screenshot 4)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SYSTEM_ROLES.map((role) => {
          const assignedUsers = usersByRole[role.code] || [];
          const Icon = role.icon;

          return (
            <div
              key={role.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Top: Role Name, System Pill & Assigned Count */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${role.colorScheme.bg} ${role.colorScheme.border} ${role.colorScheme.text}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {role.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {role.department}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${role.colorScheme.badge}`}
                  >
                    {role.isSystem ? "System" : "Custom"}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 font-medium">
                  <span>{assignedUsers.length} users assigned</span>
                  <span className="mx-1.5">·</span>
                  <span className="font-semibold text-slate-700">{role.permissionsCount} permissions</span>
                </div>

                {/* Capabilities list */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Key Capabilities:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {role.capabilities.map((cap, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Bottom: Assigned User Avatars + Matrix Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {/* Avatar Stack */}
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {assignedUsers.slice(0, 4).map((u, i) => (
                    <div
                      key={u.id}
                      title={u.fullName}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {u.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {assignedUsers.length > 4 && (
                    <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      +{assignedUsers.length - 4}
                    </div>
                  )}
                  {assignedUsers.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No users currently</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/administration/permissions")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <span>Edit Matrix</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
