"use client";

import React, { Fragment } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { HierarchicalAccount } from "./types";
import { AccountHierarchyRow } from "./AccountHierarchyRow";
import { EmptyState } from "@/components/ui";
import { AccountsIcon } from "@/components/icons";
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
  expandedLedgerAccounts,
  toggleLedgerAccount,
  onOpenEdit,
  onOpenCreateChild,
  onDelete,
  hasAccounts,
  onOpenCreate,
  formatNumber,
  formatCurrency,
  isSuperAdmin = false,
  isFinancialUser = false,
}: AccountsHierarchyViewProps) {
  if (!hasAccounts || rootAccounts.length === 0) {
    return (
      <div className="p-12">
        <EmptyState
          icon={<AccountsIcon size={32} className="text-slate-400" />}
          title="No accounts found"
          description="Try selecting another category, clearing your search keywords, or adding a new account."
          actionLabel="Add New Account"
          onAction={onOpenCreate}
        />
      </div>
    );
  }

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
    <div className="w-full bg-white flex flex-col">
      <div className="w-full overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed select-none">
          <colgroup>
            <col className="w-10" />
            <col className="w-20" />
            <col className="" />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-36" />
            <col className="w-20" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-bold text-[10px] uppercase tracking-wider select-none sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-2.5 px-1 text-center w-10">
                <span className="sr-only">Toggle</span>
              </th>
              <th className="py-2.5 px-3 text-left w-20">
                Code
              </th>
              <th className="py-2.5 px-3 text-left">
                Account Name
              </th>
              <th className="py-2.5 px-3 text-left w-40">
                Cash Flow
              </th>
              <th className="py-2.5 px-2 text-center w-24">
                Payments
              </th>
              <th className="py-2.5 px-2 text-center w-24">
                Expense Claims
              </th>
              <th className="py-2.5 px-3 text-left w-36">
                Classification
              </th>
              <th className="py-2.5 px-3 text-right w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rootAccounts.map((rootAcc) => renderAccountNode(rootAcc, 1))}
          </tbody>
        </table>
      </div>

      {/* Modern Status Footer */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 font-medium flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            Visible rows: <strong className="text-slate-800 font-mono font-bold">{totalVisibleCount}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Pillars: <strong className="text-slate-800 font-semibold">{rootAccounts.length} Root Groups</strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Click any account row to open details and ledger configuration</span>
        </div>
      </div>
    </div>
  );
}

export default AccountsHierarchyView;
