"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { HierarchicalAccount } from "./types";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Lock,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Maximize2,
  Check,
  Banknote,
  FileSpreadsheet,
  Users,
  CreditCard,
  Receipt,
  Layers,
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
  isLedgerOpen,
  toggleCollapse,
  toggleLedgerAccount,
  onOpenEdit,
  onOpenCreateChild,
  onDelete,
  formatNumber,
  isSuperAdmin = false,
  isFinancialUser = false,
}: AccountHierarchyRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasChildren = acc.subAccounts && acc.subAccounts.length > 0;
  const isLevel1 = level === 1 || acc.level === 1;
  const isLevel2 = level === 2 || acc.level === 2;
  const isLevel3 = level === 3 || acc.level === 3;
  const isLevel4 = level >= 4 || acc.level === 4;
  const isSystem = Boolean(acc.isSystem || (acc as any).is_system);

  // Role & Level Security Enforcement:
  const canEdit = !isLevel1 || Boolean(isSuperAdmin);
  const canDelete = !isLevel1;

  const canAddSub = isLevel1
    ? false
    : isLevel2
      ? Boolean(isSuperAdmin || isFinancialUser)
      : isLevel3
        ? Boolean(isSuperAdmin || isFinancialUser)
        : false;

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Pillar 1-5 Custom Accent Styling for Level 1
  const getLevel1Theme = (type: string) => {
    switch (type) {
      case "ASSET":
        return {
          rowClass:
            "border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50/80 via-purple-50/20 to-white hover:from-purple-100/70 hover:via-purple-50/40 text-purple-950 border-b border-purple-200/80 font-bold",
          badgeClass: "bg-purple-100 text-purple-800 border-purple-200/90",
          iconClass: "text-purple-600 fill-purple-100",
          pillarLabel: "Pillar 1 · Asset",
        };
      case "LIABILITY":
        return {
          rowClass:
            "border-l-4 border-l-rose-600 bg-gradient-to-r from-rose-50/80 via-rose-50/20 to-white hover:from-rose-100/70 hover:via-rose-50/40 text-rose-950 border-b border-rose-200/80 font-bold",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200/90",
          iconClass: "text-rose-600 fill-rose-100",
          pillarLabel: "Pillar 2 · Liability",
        };
      case "EQUITY":
        return {
          rowClass:
            "border-l-4 border-l-amber-600 bg-gradient-to-r from-amber-50/80 via-amber-50/20 to-white hover:from-amber-100/70 hover:via-amber-50/40 text-amber-950 border-b border-amber-200/80 font-bold",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200/90",
          iconClass: "text-amber-600 fill-amber-100",
          pillarLabel: "Pillar 3 · Equity",
        };
      case "REVENUE":
        return {
          rowClass:
            "border-l-4 border-l-emerald-600 bg-gradient-to-r from-emerald-50/80 via-emerald-50/20 to-white hover:from-emerald-100/70 hover:via-emerald-50/40 text-emerald-950 border-b border-emerald-200/80 font-bold",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200/90",
          iconClass: "text-emerald-600 fill-emerald-100",
          pillarLabel: "Pillar 4 · Revenue",
        };
      case "EXPENSE":
        return {
          rowClass:
            "border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50/80 via-blue-50/20 to-white hover:from-blue-100/70 hover:via-blue-50/40 text-blue-950 border-b border-blue-200/80 font-bold",
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200/90",
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

  // Modern Semantic Cash Flow Badges
  const renderCashFlowBadge = (cashFlowType?: string) => {
    if (!cashFlowType) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
          Operating
        </span>
      );
    }

    const lower = cashFlowType.toLowerCase();
    if (lower.includes("cash") || lower.includes("equivalent")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span>Cash & cash equivalents</span>
        </span>
      );
    }
    if (lower.includes("invest")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span>Investing</span>
        </span>
      );
    }
    if (lower.includes("financ")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Financing</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
        <span>{cashFlowType}</span>
      </span>
    );
  };

  // Contextual icon for leaf accounts based on subtype or name
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
            ? "bg-slate-50/60 hover:bg-slate-100/70 border-b border-slate-200/90 text-slate-900 font-semibold"
            : isLevel3
              ? "bg-white hover:bg-slate-50/80 border-b border-slate-100 text-slate-800"
              : "bg-white hover:bg-indigo-50/30 border-b border-slate-100/80 text-slate-700"
      }`}
    >
      {/* 1. Chevron Expand/Collapse Toggle Button */}
      <td className="py-2.5 px-2 text-center w-12 align-middle">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(acc.id);
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center"
            title={isCollapsed ? "Expand sub-accounts" : "Collapse sub-accounts"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.25]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.25]" />
            )}
          </button>
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-200 inline-block opacity-40" />
        )}
      </td>

      {/* 2. Account Code Column (Unobstructed & Clean) */}
      <td className="py-2.5 px-3 whitespace-nowrap font-mono w-24 align-middle">
        <div className="flex items-center gap-1.5">
          {isLevel1 ? (
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-black text-xs border shadow-2xs ${level1Theme?.badgeClass}`}
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
                    : "font-medium text-slate-700"
              }`}
            >
              {acc.accountCode}
            </span>
          )}

          {/* Level 1 Protected Lock Badge */}
          {isLevel1 ? (
            <span title="Level 1 Root Category (Protected)">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            </span>
          ) : null}
        </div>
      </td>

      {/* 3. Account Name Column with Smooth SVG Tree Guides */}
      <td className="py-2.5 px-3 align-middle min-w-[280px]">
        <div
          className="flex items-center gap-2"
          style={{
            paddingLeft:
              level === 1
                ? "0px"
                : level === 2
                  ? "8px"
                  : level === 3
                    ? "24px"
                    : `${24 + (level - 3) * 16}px`,
          }}
        >
          {/* Elegant SVG Curved Guide Line for Level 3 and Level 4 */}
          {level > 2 && (
            <div className="w-3.5 h-3.5 -mt-1 mr-1 flex items-center justify-center shrink-0 text-slate-300">
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

          {/* Iconography */}
          {isLevel1 ? (
            <Folder className={`w-4 h-4 shrink-0 ${level1Theme?.iconClass}`} />
          ) : isLevel2 || isLevel3 || hasChildren ? (
            isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-slate-700 shrink-0 stroke-[1.75]" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[1.75]" />
            )
          ) : (
            renderLeafIcon()
          )}

          {/* Account Title + Arabic Title */}
          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
            <span
              className={`truncate ${
                isLevel1
                  ? "font-extrabold text-sm text-slate-900"
                  : isLevel2
                    ? "font-bold text-slate-900"
                    : isLevel3
                      ? "font-semibold text-slate-800"
                      : "font-medium text-slate-700"
              }`}
            >
              {acc.accountName}
            </span>

            {/* Level 1 Pillar Pill */}
            {isLevel1 && level1Theme && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 text-slate-700">
                {level1Theme.pillarLabel}
              </span>
            )}

            {/* Sub-groups count indicator for Level 1 */}
            {isLevel1 && acc.subAccounts && (
              <span className="text-[11px] font-normal text-slate-500">
                ({acc.subAccounts.length} {acc.subAccounts.length === 1 ? "group" : "groups"})
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 4. Cash Flow Type Column (Fixed min-width, No Overlap Bug!) */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle min-w-[190px] w-52">
        {isLevel1 ? (
          <span className="text-slate-300 font-light select-none">—</span>
        ) : (
          renderCashFlowBadge((acc as any).cashFlowType)
        )}
      </td>

      {/* 5. Enable Payments Column (Modern Pill Badges) */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle w-36 min-w-[130px]">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-light select-none">—</span>
        ) : (acc as any).enablePayments ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
            <span>Yes</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
            No
          </span>
        )}
      </td>

      {/* 6. Show in Expense Claims Column (Full Title & Pill Badges) */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle w-36 min-w-[130px]">
        {isLevel1 || isLevel2 ? (
          <span className="text-slate-300 font-light select-none">—</span>
        ) : (acc as any).showInExpenseClaims ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
            <span>Yes</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
            No
          </span>
        )}
      </td>

      {/* 7. Account Type / Subtype Column */}
      <td className="py-2.5 px-3 whitespace-nowrap text-left align-middle w-40 min-w-[150px]">
        {isLevel1 || isLevel2 || !subtype ? (
          <span className="text-slate-300 font-light select-none">—</span>
        ) : (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70 max-w-[140px] truncate"
            title={subtype}
          >
            {subtype}
          </span>
        )}
      </td>

      {/* 8. Dedicated Actions Column (Revealed smoothly on hover) */}
      <td className="py-2.5 px-3 whitespace-nowrap text-right align-middle w-28">
        <div className="inline-flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add Sub-account Button */}
          {canAddSub && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateChild(acc);
              }}
              className="p-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
              title={
                isLevel2
                  ? "Add Level 3 Sub-group"
                  : "Add Level 4 Ledger Account"
              }
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* Edit Account Button */}
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(acc);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-[#5546FF] hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Edit account"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Account Button */}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(acc);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete account"
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
