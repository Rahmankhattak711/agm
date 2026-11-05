"use client";

import React from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { HierarchicalAccount } from "./types";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Lock,
  Plus,
  Pencil,
  Trash2,
  Check,
  Banknote,
  FileSpreadsheet,
  Users,
  CreditCard,
  Receipt,
} from "lucide-react";

interface AccountHierarchyRowProps {
  acc: HierarchicalAccount;
  level: number;
  isCollapsed: boolean;
  isLedgerOpen?: boolean;
  toggleCollapse: (id: string) => void;
  toggleLedgerAccount?: (id: string) => void;
  onOpenEdit: (acc: ChartOfAccount) => void;
  onOpenCreateChild: (parentAcc: ChartOfAccount) => void;
  onDelete: (acc: ChartOfAccount) => void;
  formatNumber: (val: number | string | undefined) => string;
  isSuperAdmin?: boolean;
  isFinancialUser?: boolean;
}

export function AccountHierarchyRow({
  acc,
  level = 1,
  isCollapsed,
  toggleCollapse,
  onOpenEdit,
  onOpenCreateChild,
  onDelete,
  isSuperAdmin = false,
  isFinancialUser = false,
}: AccountHierarchyRowProps) {
  const hasChildren = acc.subAccounts && acc.subAccounts.length > 0;
  const isLevel1 = level === 1 || acc.level === 1;
  const isLevel2 = level === 2 || acc.level === 2;
  const isLevel3 = level === 3 || acc.level === 3;
  const isLevel4 = level >= 4 || acc.level === 4;

  // Role & Level Security Enforcement
  const canEdit = !isLevel1 || Boolean(isSuperAdmin);
  const canDelete = !isLevel1;

  const canAddSub = isLevel1
    ? false
    : isLevel2
      ? Boolean(isSuperAdmin || isFinancialUser)
      : isLevel3
        ? Boolean(isSuperAdmin || isFinancialUser)
        : false;

  // Level 1 Pillars
  const getLevel1Theme = (type: string) => {
    switch (type) {
      case "ASSET":
        return {
          rowClass:
            "border-l-4 border-l-purple-600 bg-purple-50/30 hover:bg-purple-50/60 text-purple-950 border-b border-purple-200/60 font-bold",
          badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
          iconClass: "text-purple-600 fill-purple-100",
          pillarLabel: "Pillar 1 · Asset",
        };
      case "LIABILITY":
        return {
          rowClass:
            "border-l-4 border-l-rose-600 bg-rose-50/30 hover:bg-rose-50/60 text-rose-950 border-b border-rose-200/60 font-bold",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          iconClass: "text-rose-600 fill-rose-100",
          pillarLabel: "Pillar 2 · Liability",
        };
      case "EQUITY":
        return {
          rowClass:
            "border-l-4 border-l-amber-600 bg-amber-50/30 hover:bg-amber-50/60 text-amber-950 border-b border-amber-200/60 font-bold",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          iconClass: "text-amber-600 fill-amber-100",
          pillarLabel: "Pillar 3 · Equity",
        };
      case "REVENUE":
        return {
          rowClass:
            "border-l-4 border-l-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 text-emerald-950 border-b border-emerald-200/60 font-bold",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
          iconClass: "text-emerald-600 fill-emerald-100",
          pillarLabel: "Pillar 4 · Revenue",
        };
      case "EXPENSE":
        return {
          rowClass:
            "border-l-4 border-l-blue-600 bg-blue-50/30 hover:bg-blue-50/60 text-blue-950 border-b border-blue-200/60 font-bold",
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
          iconClass: "text-blue-600 fill-blue-100",
          pillarLabel: "Pillar 5 · Expense",
        };
      default:
        return {
          rowClass:
            "border-l-4 border-l-slate-600 bg-slate-50 hover:bg-slate-100 text-slate-900 border-b border-slate-200 font-bold",
          badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
          iconClass: "text-slate-600 fill-slate-100",
          pillarLabel: "Root Pillar",
        };
    }
  };

  // Modern Semantic Cash Flow Badge
  const renderCashFlowBadge = (cashFlowType?: string) => {
    if (!cashFlowType) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>Operating</span>
        </span>
      );
    }

    const lower = cashFlowType.toLowerCase();
    if (lower.includes("cash") || lower.includes("equivalent")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs truncate max-w-[150px]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="truncate">Cash & cash equiv</span>
        </span>
      );
    }
    if (lower.includes("invest")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs truncate max-w-[150px]">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span className="truncate">Investing</span>
        </span>
      );
    }
    if (lower.includes("financ")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs truncate max-w-[150px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="truncate">Financing</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs truncate max-w-[150px]">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
        <span className="truncate">{cashFlowType}</span>
      </span>
    );
  };

  // Contextual icon for leaf accounts
  const renderLeafIcon = () => {
    const subtype = ((acc as any).accountSubtype || (acc as any).subtype || "").toLowerCase();
    const name = acc.accountName.toLowerCase();

    if (subtype.includes("bank") || name.includes("bank") || name.includes("cash") || name.includes("petty")) {
      return <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
    if (subtype.includes("receivable") || name.includes("receivable") || name.includes("customer")) {
      return <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    }
    if (subtype.includes("payable") || name.includes("payable") || name.includes("supplier") || name.includes("vendor")) {
      return <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    if (subtype.includes("expense") || name.includes("expense") || name.includes("charge")) {
      return <Receipt className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    return <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const level1Theme = isLevel1 ? getLevel1Theme(acc.type) : null;
  const subtype = (acc as any).accountSubtype || (acc as any).subtype || (isLevel1 ? null : acc.type);

  return (
    <tr
      onClick={() => onOpenEdit(acc)}
      className={`group transition-colors text-xs select-none cursor-pointer ${
        isLevel1
          ? level1Theme?.rowClass
          : isLevel2
            ? "bg-slate-50/50 hover:bg-slate-100/70 border-b border-slate-200/80 text-slate-900 font-semibold"
            : isLevel3
              ? "bg-white hover:bg-slate-50/80 border-b border-slate-100 text-slate-800"
              : "bg-white hover:bg-indigo-50/30 border-b border-slate-100/70 text-slate-700"
      }`}
    >
      {/* 1. Expand / Collapse Chevron (w-10) */}
      <td className="py-2 px-1 text-center w-10 align-middle">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(acc.id);
            }}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center"
            title={isCollapsed ? "Expand sub-accounts" : "Collapse sub-accounts"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.25]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.25]" />
            )}
          </button>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block opacity-40" />
        )}
      </td>

      {/* 2. Account Code (w-20) */}
      <td className="py-2 px-3 whitespace-nowrap font-mono w-20 align-middle">
        <div className="flex items-center gap-1.5">
          {isLevel1 ? (
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-black text-xs border shadow-2xs ${level1Theme?.badgeClass}`}
            >
              {acc.accountCode}
            </span>
          ) : (
            <span
              className={`font-mono text-xs ${
                isLevel2
                  ? "font-bold text-slate-900"
                  : isLevel3
                    ? "font-semibold text-slate-800"
                    : "font-medium text-slate-600"
              }`}
            >
              {acc.accountCode}
            </span>
          )}

          {isLevel1 && (
            <span title="Level 1 Root Category (Protected)">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            </span>
          )}
        </div>
      </td>

      {/* 3. Account Name (Fluid Width) */}
      <td className="py-2 px-3 align-middle min-w-0">
        <div
          className="flex items-center gap-2 min-w-0"
          style={{
            paddingLeft:
              level === 1
                ? "0px"
                : level === 2
                  ? "8px"
                  : level === 3
                    ? "20px"
                    : `${20 + (level - 3) * 14}px`,
          }}
        >
          {/* Subtle SVG Tree Guide line for sub-accounts */}
          {level > 2 && (
            <div className="w-3.5 h-3.5 -mt-0.5 mr-0.5 flex items-center justify-center shrink-0 text-slate-300">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 0v8a3 3 0 003 3h8"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Icon */}
          {isLevel1 ? (
            <Folder className={`w-4 h-4 shrink-0 ${level1Theme?.iconClass}`} />
          ) : isLevel2 || isLevel3 || hasChildren ? (
            isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-slate-600 shrink-0 stroke-[1.75]" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[1.75]" />
            )
          ) : (
            renderLeafIcon()
          )}

          {/* Account Title + Badges */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span
              className={`truncate ${
                isLevel1
                  ? "font-bold text-sm text-slate-900"
                  : isLevel2
                    ? "font-semibold text-xs text-slate-900"
                    : isLevel3
                      ? "font-medium text-xs text-slate-800"
                      : "text-xs text-slate-700"
              }`}
            >
              {acc.accountName}
            </span>

            {/* Pillar label on Level 1 */}
            {isLevel1 && level1Theme && (
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 text-slate-700 shrink-0">
                {level1Theme.pillarLabel}
              </span>
            )}

            {/* Sub-groups count on Level 1 */}
            {isLevel1 && acc.subAccounts && (
              <span className="text-[11px] font-normal text-slate-500 shrink-0">
                ({acc.subAccounts.length} {acc.subAccounts.length === 1 ? "group" : "groups"})
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 4. Cash Flow Type (w-40) */}
      <td className="py-2 px-3 whitespace-nowrap text-left align-middle w-40 truncate">
        {isLevel1 ? (
          <span className="text-slate-300 font-light select-none text-xs">—</span>
        ) : (
          renderCashFlowBadge((acc as any).cashFlowType)
        )}
      </td>

      {/* 5. Enable Payments (w-24) */}
      <td className="py-2 px-2 whitespace-nowrap text-center align-middle w-24">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-light select-none text-xs">—</span>
        ) : (acc as any).enablePayments ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
            <span>Yes</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
            No
          </span>
        )}
      </td>

      {/* 6. Show in Expense Claims (w-24) */}
      <td className="py-2 px-2 whitespace-nowrap text-center align-middle w-24">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-light select-none text-xs">—</span>
        ) : (acc as any).showInExpenseClaims ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
            <span>Yes</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
            No
          </span>
        )}
      </td>

      {/* 7. Classification / Account Subtype (w-36) */}
      <td className="py-2 px-3 whitespace-nowrap text-left align-middle w-36 truncate">
        {isLevel1 || isLevel2 || !subtype ? (
          <span className="text-slate-300 font-light select-none text-xs">—</span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70 truncate max-w-[130px]"
            title={subtype}
          >
            {subtype}
          </span>
        )}
      </td>

      {/* 8. Dedicated Hover Actions (w-20) */}
      <td className="py-2 px-3 whitespace-nowrap text-right align-middle w-20">
        <div className="inline-flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add Sub-account */}
          {canAddSub && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateChild(acc);
              }}
              className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
              title={
                isLevel2
                  ? "Add Level 3 Sub-group"
                  : "Add Level 4 Ledger Account"
              }
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* Edit Account */}
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(acc);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Edit Account"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Account */}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(acc);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default AccountHierarchyRow;
