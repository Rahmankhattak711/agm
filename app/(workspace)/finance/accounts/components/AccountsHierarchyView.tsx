"use client";

import React, { Fragment } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { HierarchicalAccount } from "./types";
import { AccountHierarchyRow } from "./AccountHierarchyRow";
import { AccountInlineLedger } from "./AccountInlineLedger";
import { EmptyState } from "@/components/ui";
import { AccountsIcon } from "@/components/icons";
import { Plus } from "lucide-react";

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
          title="No accounts match your criteria"
          description="Try adjusting your search query, selecting another category, or creating a new account."
          actionLabel="Add New Account"
          onAction={onOpenCreate}
        />
      </div>
    );
  }

  // Recursive tree node renderer
  const renderAccountNode = (
    acc: HierarchicalAccount,
    level: number = 1,
  ): React.ReactNode => {
    const isCollapsed = collapsedNodes[acc.id] ?? false;
    const isLedgerOpen = false;
    const hasChildren = acc.subAccounts && acc.subAccounts.length > 0;

    return (
      <Fragment key={acc.id}>
        <AccountHierarchyRow
          acc={acc}
          level={level}
          isCollapsed={isCollapsed}
          isLedgerOpen={isLedgerOpen}
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
    <div className="w-full bg-white overflow-x-auto shadow-2xs">
      <table className="w-full text-left border-collapse min-w-[1080px]">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
            <th className="py-3 px-2 text-center w-12">
              <span className="sr-only">Toggle</span>
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 w-24">
              Code
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 min-w-[280px]">
              Account Name
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 min-w-[190px] w-52">
              Cash Flow Type
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 w-36 min-w-[130px]">
              Payments
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 w-36 min-w-[130px]">
              Expense Claims
            </th>
            <th className="py-3 px-3 text-left font-bold text-slate-700 w-40 min-w-[150px]">
              Account Type
            </th>
            <th className="py-3 px-3 text-right font-bold text-slate-700 w-28">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rootAccounts.map((rootAcc) => renderAccountNode(rootAcc, 1))}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsHierarchyView;
