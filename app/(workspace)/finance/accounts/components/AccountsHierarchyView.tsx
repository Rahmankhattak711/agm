"use client";

import React, { Fragment } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { HierarchicalAccount } from "./types";
import { AccountHierarchyRow } from "./AccountHierarchyRow";
import { Info } from "lucide-react";

interface AccountsHierarchyViewProps {
  rootAccounts: HierarchicalAccount[];
  collapsedNodes: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  expandedLedgerAccounts?: Record<string, boolean>;
  toggleLedgerAccount?: (id: string) => void;
  onOpenEdit: (acc: ChartOfAccount) => void;
  onOpenCreateChild: (parentAcc: ChartOfAccount) => void;
  onDelete: (acc: ChartOfAccount) => void;
  hasAccounts: boolean;
  onOpenCreate: () => void;
  formatNumber: (val: number | string | undefined) => string;
  formatCurrency: (val: number | string | undefined) => string;
  activeDepthLevel?: number | null;
  onSelectDepthLevel?: (lvl: number) => void;
  isSuperAdmin?: boolean;
  isFinancialUser?: boolean;
}

export function AccountsHierarchyView({
  rootAccounts,
  collapsedNodes,
  onToggleCollapse,
  toggleLedgerAccount,
  onOpenEdit,
  onOpenCreateChild,
  onDelete,
  hasAccounts,
  onOpenCreate,
  formatNumber,
  isSuperAdmin = false,
  isFinancialUser = false,
}: AccountsHierarchyViewProps) {
  // Count total displayed nodes
  let totalVisibleCount = 0;
  const countNodes = (items: HierarchicalAccount[]) => {
    items.forEach((item) => {
      totalVisibleCount++;
      if (!collapsedNodes[item.id] && item.subAccounts) {
        countNodes(item.subAccounts);
      }
    });
  };
  countNodes(rootAccounts);

  // Recursive tree node renderer
  const renderAccountNode = (
    acc: HierarchicalAccount,
    level: number = 1,
  ): React.ReactNode => {
    const isCollapsed = collapsedNodes[acc.id] ?? false;
    const hasChildren = acc.subAccounts && acc.subAccounts.length > 0;

    return (
      <Fragment key={acc.id}>
        <AccountHierarchyRow
          acc={acc}
          level={level}
          isCollapsed={isCollapsed}
          toggleCollapse={onToggleCollapse}
          toggleLedgerAccount={toggleLedgerAccount}
          onOpenEdit={onOpenEdit}
          onOpenCreateChild={onOpenCreateChild}
          onDelete={onDelete}
          formatNumber={formatNumber}
          isSuperAdmin={isSuperAdmin}
          isFinancialUser={isFinancialUser}
        />

        {/* Recursive Children rendering if not collapsed */}
        {!isCollapsed &&
          hasChildren &&
          acc.subAccounts.map((child) => renderAccountNode(child, level + 1))}
      </Fragment>
    );
  };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ border: "1px solid #cbd5e1" }}
    >
      {/* Soft Light-Blue Top Bar (Matching Fixed Assets) */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{
          backgroundColor: "#f4f7fb",
          borderBottom: "1px solid #cbd5e1",
        }}
      >
        <h3 className="text-xs font-semibold text-slate-800">
          Account records
        </h3>
        <span className="text-[11px] text-slate-500 font-normal">
          {totalVisibleCount} {totalVisibleCount === 1 ? "record" : "records"}
        </span>
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[780px] text-left text-xs border-collapse select-none">
          <thead>
            <tr
              className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
              style={{ borderBottom: "1px solid #e2e8f0" }}
            >
              <th className="py-2.5 px-2 text-center w-10">
                <span className="sr-only">Toggle</span>
              </th>
              <th className="py-2.5 px-3 text-left w-24 whitespace-nowrap">
                CODE
              </th>
              <th className="py-2.5 px-3 text-left whitespace-nowrap">
                ACCOUNT NAME
              </th>
              <th className="py-2.5 px-3 text-left w-40 whitespace-nowrap">
                CASH FLOW
              </th>
              <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">
                PAYMENTS
              </th>
              <th className="py-2.5 px-2 text-center w-28 whitespace-nowrap">
                EXPENSE CLAIMS
              </th>
              <th className="py-2.5 px-3 text-left w-40 whitespace-nowrap">
                CLASSIFICATION
              </th>
              <th className="py-2.5 px-4 text-right w-24 whitespace-nowrap">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!hasAccounts || rootAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                    <h4 className="font-medium text-slate-700 text-xs">
                      No account records found
                    </h4>
                    <p className="text-[11px] font-normal text-slate-400">
                      Try selecting another account pillar, clearing your search keywords, or adding a new account.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenCreate}
                      style={{
                        backgroundColor: "#1d4ed8",
                        color: "#ffffff",
                        border: "1px solid #1e40af",
                      }}
                      className="mt-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    >
                      + Add Account
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              rootAccounts.map((rootAcc) => renderAccountNode(rootAcc, 1))
            )}
          </tbody>
        </table>
      </div>

      {/* Subtle Bottom Bar */}
      <div
        className="px-4 py-2 text-[11px] text-slate-500 font-normal flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div className="flex items-center gap-3">
          <span>
            Visible rows: <span className="text-slate-700 font-medium">{totalVisibleCount}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Pillars: <span className="text-slate-700 font-medium">{rootAccounts.length} Root Groups</span>
          </span>
        </div>

        <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Click any account row to open details and ledger configuration</span>
        </div>
      </div>
    </div>
  );
}

export default AccountsHierarchyView;
