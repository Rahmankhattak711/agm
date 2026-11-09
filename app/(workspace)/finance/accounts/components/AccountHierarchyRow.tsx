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

  // Level 1 Pillars with Soft Pastel Colors (Matching Fixed Assets)
  const getLevel1Theme = (type: string) => {
    switch (type) {
      case "ASSET":
        return {
          rowStyle: {
            backgroundColor: "#f8faff",
            borderLeft: "3px solid #1d4ed8",
            borderBottom: "1px solid #dbeafe",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #93c5fd",
          } as React.CSSProperties,
          iconColor: "#1d4ed8",
          pillarLabel: "PILLAR 1 · ASSET",
        };
      case "LIABILITY":
        return {
          rowStyle: {
            backgroundColor: "#fffafb",
            borderLeft: "3px solid #e11d48",
            borderBottom: "1px solid #ffe4e6",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#fff1f2",
            color: "#be123c",
            border: "1px solid #fda4af",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#ffe4e6",
            color: "#9f1239",
            border: "1px solid #fda4af",
          } as React.CSSProperties,
          iconColor: "#be123c",
          pillarLabel: "PILLAR 2 · LIABILITY",
        };
      case "EQUITY":
        return {
          rowStyle: {
            backgroundColor: "#fffef5",
            borderLeft: "3px solid #ca8a04",
            borderBottom: "1px solid #fef08a",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#fefce8",
            color: "#a16207",
            border: "1px solid #fde047",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#fef9c3",
            color: "#854d0e",
            border: "1px solid #fde047",
          } as React.CSSProperties,
          iconColor: "#a16207",
          pillarLabel: "PILLAR 3 · EQUITY",
        };
      case "REVENUE":
        return {
          rowStyle: {
            backgroundColor: "#f7fef9",
            borderLeft: "3px solid #16a34a",
            borderBottom: "1px solid #dcfce7",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #86efac",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#dcfce7",
            color: "#166534",
            border: "1px solid #86efac",
          } as React.CSSProperties,
          iconColor: "#15803d",
          pillarLabel: "PILLAR 4 · REVENUE",
        };
      case "EXPENSE":
        return {
          rowStyle: {
            backgroundColor: "#fffaf5",
            borderLeft: "3px solid #ea580c",
            borderBottom: "1px solid #ffedd5",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#fff7ed",
            color: "#c2410c",
            border: "1px solid #fdba74",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#ffedd5",
            color: "#9a3412",
            border: "1px solid #fdba74",
          } as React.CSSProperties,
          iconColor: "#c2410c",
          pillarLabel: "PILLAR 5 · EXPENSE",
        };
      default:
        return {
          rowStyle: {
            backgroundColor: "#f8fafc",
            borderLeft: "3px solid #475569",
            borderBottom: "1px solid #e2e8f0",
          } as React.CSSProperties,
          codeStyle: {
            backgroundColor: "#f1f5f9",
            color: "#334155",
            border: "1px solid #cbd5e1",
          } as React.CSSProperties,
          pillStyle: {
            backgroundColor: "#f1f5f9",
            color: "#334155",
            border: "1px solid #cbd5e1",
          } as React.CSSProperties,
          iconColor: "#475569",
          pillarLabel: "ROOT PILLAR",
        };
    }
  };

  // Soft Pastel Cash Flow Badge
  const renderCashFlowBadge = (cashFlowType?: string) => {
    if (!cashFlowType) {
      return (
        <span
          style={{
            backgroundColor: "#f1f5f9",
            color: "#475569",
            border: "1px solid #cbd5e1",
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate"
        >
          <span>Operating</span>
        </span>
      );
    }

    const lower = cashFlowType.toLowerCase();
    if (lower.includes("cash") || lower.includes("equivalent")) {
      return (
        <span
          style={{
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate max-w-[150px]"
        >
          <span className="truncate">Cash &amp; cash eq.</span>
        </span>
      );
    }
    if (lower.includes("invest")) {
      return (
        <span
          style={{
            backgroundColor: "#f3e8ff",
            color: "#7e22ce",
            border: "1px solid #d8b4fe",
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate max-w-[150px]"
        >
          <span className="truncate">Investing</span>
        </span>
      );
    }
    if (lower.includes("financ")) {
      return (
        <span
          style={{
            backgroundColor: "#fefce8",
            color: "#a16207",
            border: "1px solid #fde047",
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate max-w-[150px]"
        >
          <span className="truncate">Financing</span>
        </span>
      );
    }
    return (
      <span
        style={{
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          border: "1px solid #bae6fd",
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate max-w-[150px]"
      >
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
      return <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
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
      style={
        isLevel1
          ? level1Theme?.rowStyle
          : isLevel2
            ? { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }
            : undefined
      }
      className={`group transition-colors text-xs select-none cursor-pointer ${
        isLevel1
          ? "hover:opacity-95"
          : isLevel2
            ? "hover:bg-slate-100/70 text-slate-800"
            : "bg-white hover:bg-slate-50 text-slate-700"
      }`}
    >
      {/* 1. Expand / Collapse Chevron */}
      <td className="py-2.5 px-2 text-center w-10 align-middle">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(acc.id);
            }}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center"
            title={isCollapsed ? "Expand sub-accounts" : "Collapse sub-accounts"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block opacity-40" />
        )}
      </td>

      {/* 2. Account Code */}
      <td className="py-2.5 px-3 whitespace-nowrap font-mono w-24 align-middle">
        <div className="flex items-center gap-1.5">
          {isLevel1 && level1Theme ? (
            <span
              style={level1Theme.codeStyle}
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-medium text-[11px]"
            >
              {acc.accountCode}
            </span>
          ) : (
            <span
              className={`font-mono text-[11.5px] ${
                isLevel2
                  ? "font-medium text-slate-800"
                  : isLevel3
                    ? "font-medium text-slate-600"
                    : "font-normal text-slate-500"
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

      {/* 3. Account Name */}
      <td className="py-2.5 px-3 align-middle min-w-0">
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
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Icon */}
          {isLevel1 && level1Theme ? (
            <Folder
              className="w-4 h-4 shrink-0"
              style={{ color: level1Theme.iconColor }}
            />
          ) : isLevel2 || isLevel3 || hasChildren ? (
            isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            )
          ) : (
            renderLeafIcon()
          )}

          {/* Account Title + Badges */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span
              style={
                !isLevel1 && !isLevel2 && !hasChildren
                  ? { color: "#1d4ed8" }
                  : undefined
              }
              className={`truncate ${
                isLevel1
                  ? "font-semibold text-xs text-slate-800"
                  : isLevel2
                    ? "font-medium text-xs text-slate-800"
                    : isLevel3
                      ? "font-medium text-xs text-slate-700"
                      : "font-medium text-xs"
              }`}
            >
              {acc.accountName}
            </span>

            {/* Pillar label on Level 1 */}
            {isLevel1 && level1Theme && (
              <span
                style={level1Theme.pillStyle}
                className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide shrink-0"
              >
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

      {/* 4. Cash Flow Type */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle w-40 truncate">
        {isLevel1 ? (
          <span className="text-slate-300 font-normal select-none text-xs">-</span>
        ) : (
          renderCashFlowBadge((acc as any).cashFlowType)
        )}
      </td>

      {/* 5. Enable Payments */}
      <td className="py-2.5 px-2 whitespace-nowrap text-center align-middle w-24">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-normal select-none text-xs">-</span>
        ) : (acc as any).enablePayments ? (
          <span
            style={{
              backgroundColor: "#f0fdf4",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium"
          >
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Yes</span>
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-normal"
          >
            No
          </span>
        )}
      </td>

      {/* 6. Show in Expense Claims */}
      <td className="py-2.5 px-2 whitespace-nowrap text-center align-middle w-28">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-normal select-none text-xs">-</span>
        ) : (acc as any).showInExpenseClaims ? (
          <span
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #93c5fd",
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium"
          >
            <Check className="w-3 h-3 text-blue-600" />
            <span>Yes</span>
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-normal"
          >
            No
          </span>
        )}
      </td>

      {/* 7. Classification / Account Subtype */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle w-40 truncate">
        {isLevel1 || isLevel2 || !subtype ? (
          <span className="text-slate-300 font-normal select-none text-xs">-</span>
        ) : (
          <span
            style={{
              backgroundColor: "#fef3c7",
              color: "#b45309",
              border: "1px solid #fde68a",
            }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide truncate max-w-[140px]"
            title={subtype}
          >
            {subtype}
          </span>
        )}
      </td>

      {/* 8. Actions (Matching Fixed Assets Icon Buttons) */}
      <td className="py-2.5 px-4 whitespace-nowrap text-right align-middle w-24">
        <div
          className="inline-flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add Sub-account */}
          {canAddSub && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateChild(acc);
              }}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title={
                isLevel2
                  ? "Add Level 3 Sub-group"
                  : "Add Level 4 Ledger Account"
              }
            >
              <Plus className="w-3.5 h-3.5" />
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
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
