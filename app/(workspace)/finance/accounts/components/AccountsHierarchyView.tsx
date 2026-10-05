"use client";

import { Fragment } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { ChevronRightIcon, PlusIcon, AccountsIcon } from "@/components/icons";
import { Button, EmptyState } from "@/components/ui";
import { ACCOUNT_TYPES, AccountTypeConfig, HierarchicalAccount } from "./types";
import { AccountInlineLedger } from "./AccountInlineLedger";
import { AccountHierarchyRow } from "./AccountHierarchyRow";

interface AccountsHierarchyViewProps {
  categorizedAccounts: Record<
    string,
    {
      typeInfo: AccountTypeConfig;
      roots: HierarchicalAccount[];
      totalBalance: number;
      totalCount: number;
    }
  >;
  selectedType: string;
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (catVal: string) => void;
  collapsedParents: Record<string, boolean>;
  toggleParent: (parentId: string) => void;
  expandedLedgerAccounts: Record<string, boolean>;
  toggleLedgerAccount: (accId: string) => void;
  onOpenCreateForType: (
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
  ) => void;
  onOpenCreate: () => void;
  onOpenEdit: (acc: ChartOfAccount) => void;
  onDelete: (acc: ChartOfAccount) => void;
  hasAccounts: boolean;
  searchQuery: string;
  formatNumber: (val: number | string | undefined) => string;
  formatCurrency: (val: number | string | undefined) => string;
}

export function AccountsHierarchyView({
  categorizedAccounts,
  selectedType,
  collapsedCategories,
  toggleCategory,
  collapsedParents,
  toggleParent,
  expandedLedgerAccounts,
  toggleLedgerAccount,
  onOpenCreateForType,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  hasAccounts,
  searchQuery,
  formatNumber,
  formatCurrency,
}: AccountsHierarchyViewProps) {
  if (!hasAccounts) {
    return (
      <EmptyState
        icon={<AccountsIcon size={22} className="text-slate-400" />}
        title="No accounts match your criteria"
        description="Try resetting the search filters or adding a new account."
        actionLabel="Add New Account"
        onAction={onOpenCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      {ACCOUNT_TYPES.map((typeObj) => {
        const group = categorizedAccounts[typeObj.value];
        if (!group) return null;
        if (selectedType !== "ALL" && selectedType !== typeObj.value) {
          return null;
        }

        const isCollapsed = collapsedCategories[typeObj.value] ?? false;
        const count = group.totalCount;

        return (
          <div
            key={typeObj.value}
            className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs transition-all"
          >
            <div
              className={`p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer select-none transition-colors border-b ${
                isCollapsed
                  ? "border-transparent bg-slate-50/70 hover:bg-slate-100/70"
                  : `border-slate-200/80 ${typeObj.headerBg}`
              }`}
              onClick={() => toggleCategory(typeObj.value)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform duration-200 text-slate-700 bg-white/90 border border-slate-200/80 shadow-2xs ${
                    isCollapsed ? "" : "rotate-90"
                  }`}
                >
                  <ChevronRightIcon size={14} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                    {typeObj.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${typeObj.badgeColor}`}
                  >
                    {typeObj.codeRange}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/80 text-slate-600 border border-slate-200/80">
                    Normal: {typeObj.drCr}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-2 sm:gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-right">
                  <span className="text-[9.5px] text-slate-400 font-bold block uppercase leading-none">
                    Net Balance
                  </span>
                  <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 block mt-0.5">
                    {formatCurrency(group.totalBalance)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  {count} {count === 1 ? "Account" : "Accounts"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onOpenCreateForType(
                      typeObj.value as
                        | "ASSET"
                        | "LIABILITY"
                        | "EQUITY"
                        | "REVENUE"
                        | "EXPENSE",
                    )
                  }
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 shadow-2xs cursor-pointer"
                  title={`Add new ${typeObj.label} Account`}
                >
                  <PlusIcon size={12} strokeWidth={2.5} />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {group.roots.length === 0 ? (
                  <div className="py-6 px-4 text-center bg-slate-50/40">
                    <p className="text-xs text-slate-400 italic">
                      {searchQuery
                        ? `No ${typeObj.label.toLowerCase()} match "${searchQuery}"`
                        : `No accounts in ${typeObj.label} yet.`}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onOpenCreateForType(
                          typeObj.value as
                            | "ASSET"
                            | "LIABILITY"
                            | "EQUITY"
                            | "REVENUE"
                            | "EXPENSE",
                        )
                      }
                      icon={<PlusIcon size={12} strokeWidth={2.5} />}
                      className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      Create {typeObj.label} Account
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4 w-44">Code</th>
                          <th className="py-2.5 px-3">
                            Account Title &amp; Hierarchy
                          </th>
                          <th className="py-2.5 px-3 text-right w-36">
                            Live Balance
                          </th>
                          <th className="py-2.5 px-3 text-center w-20">
                            Entries
                          </th>
                          <th className="py-2.5 px-3 text-center w-24">
                            Status
                          </th>
                          <th className="py-2.5 px-4 text-center w-28">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.roots.map((root) => {
                          const hasChildren = root.subAccounts.length > 0;
                          const isParentCollapsed =
                            collapsedParents[root.id] ?? false;
                          const isLedgerOpen = Boolean(
                            expandedLedgerAccounts[root.id],
                          );

                          return (
                            <Fragment key={root.id}>
                              <AccountHierarchyRow
                                acc={root}
                                isSubAccount={false}
                                hasChildren={hasChildren}
                                isParentCollapsed={isParentCollapsed}
                                isLedgerOpen={isLedgerOpen}
                                toggleParent={toggleParent}
                                toggleLedgerAccount={toggleLedgerAccount}
                                onOpenEdit={onOpenEdit}
                                onDelete={onDelete}
                                formatNumber={formatNumber}
                              />
                              {isLedgerOpen && (
                                <AccountInlineLedger
                                  accountId={root.id}
                                  account={root}
                                  formatNumber={formatNumber}
                                  formatCurrency={formatCurrency}
                                  onClose={() => toggleLedgerAccount(root.id)}
                                />
                              )}
                              {hasChildren &&
                                !isParentCollapsed &&
                                root.subAccounts.map((child) => {
                                  const isChildLedgerOpen = Boolean(
                                    expandedLedgerAccounts[child.id],
                                  );
                                  return (
                                    <Fragment key={child.id}>
                                      <AccountHierarchyRow
                                        acc={child}
                                        isSubAccount={true}
                                        hasChildren={false}
                                        isParentCollapsed={false}
                                        isLedgerOpen={isChildLedgerOpen}
                                        toggleLedgerAccount={
                                          toggleLedgerAccount
                                        }
                                        onOpenEdit={onOpenEdit}
                                        onDelete={onDelete}
                                        formatNumber={formatNumber}
                                      />
                                      {isChildLedgerOpen && (
                                        <AccountInlineLedger
                                          accountId={child.id}
                                          account={child}
                                          formatNumber={formatNumber}
                                          formatCurrency={formatCurrency}
                                          onClose={() =>
                                            toggleLedgerAccount(child.id)
                                          }
                                        />
                                      )}
                                    </Fragment>
                                  );
                                })}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
