"use client";

import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  LockIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";

interface AccountHierarchyRowProps {
  acc: ChartOfAccount & { subAccounts?: ChartOfAccount[] };
  isSubAccount?: boolean;
  hasChildren?: boolean;
  isParentCollapsed?: boolean;
  isLedgerOpen?: boolean;
  toggleParent?: (id: string) => void;
  toggleLedgerAccount: (id: string) => void;
  onOpenEdit: (acc: ChartOfAccount) => void;
  onDelete: (acc: ChartOfAccount) => void;
  formatNumber: (val: number | string | undefined) => string;
}

export function AccountHierarchyRow({
  acc,
  isSubAccount = false,
  hasChildren = false,
  isParentCollapsed = false,
  isLedgerOpen = false,
  toggleParent,
  toggleLedgerAccount,
  onOpenEdit,
  onDelete,
  formatNumber,
}: AccountHierarchyRowProps) {
  const bal = Number(acc.balance || 0);
  const drCr = acc.type === "ASSET" || acc.type === "EXPENSE" ? "Dr" : "Cr";
  const entriesCount = acc._count?.journalLines ?? 0;

  return (
    <tr
      onClick={() => toggleLedgerAccount(acc.id)}
      className={`group transition-colors cursor-pointer select-none ${
        isLedgerOpen
          ? "bg-teal-50/50 hover:bg-teal-50/70"
          : isSubAccount
            ? "bg-slate-50/50 hover:bg-slate-100/70"
            : "hover:bg-slate-50/90 bg-white"
      }`}
    >
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {isSubAccount && (
            <span className="text-slate-300 font-mono text-xs pl-3">↳</span>
          )}

          {hasChildren && toggleParent ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleParent(acc.id);
              }}
              className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title={
                isParentCollapsed
                  ? `Expand ${acc.subAccounts?.length || 0} sub-accounts`
                  : `Collapse ${acc.subAccounts?.length || 0} sub-accounts`
              }
            >
              {isParentCollapsed ? (
                <ChevronRightIcon size={13} />
              ) : (
                <ChevronDownIcon size={13} />
              )}
            </button>
          ) : (
            !isSubAccount && <div className="w-5" />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLedgerAccount(acc.id);
            }}
            className={`font-mono font-bold text-xs px-2 py-0.5 rounded border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              isLedgerOpen
                ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                : "text-teal-800 bg-teal-50 border-teal-200 hover:bg-teal-100"
            }`}
            title={isLedgerOpen ? "Collapse Ledger" : "Expand Ledger"}
          >
            <FileSpreadsheetIcon
              size={11}
              className={isLedgerOpen ? "text-white" : "text-teal-700"}
            />
            {acc.accountCode}
            {isLedgerOpen ? (
              <ChevronUpIcon
                size={11}
                strokeWidth={2.5}
                className="opacity-80"
              />
            ) : (
              <ChevronDownIcon
                size={11}
                strokeWidth={2.5}
                className="opacity-80"
              />
            )}
          </button>

          {acc.isSystem && (
            <span title="System Control Account (Protected)">
              <LockIcon size={12} className="text-slate-400" />
            </span>
          )}
        </div>
      </td>

      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-tight text-xs">
            {acc.accountName}
          </span>
          {hasChildren && toggleParent && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleParent(acc.id);
              }}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              {acc.subAccounts?.length}{" "}
              {acc.subAccounts?.length === 1 ? "sub-account" : "sub-accounts"}
            </button>
          )}
        </div>
        {acc.parent && isSubAccount && (
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Sub-account of: {acc.parent.accountName} ({acc.parent.accountCode})
          </span>
        )}
      </td>

      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span className="font-mono font-black text-xs text-slate-900 block">
          {formatNumber(bal)}
        </span>
        <span className="text-[9.5px] text-slate-400 font-mono">{drCr}</span>
      </td>

      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded-md inline-block font-semibold ${
            isLedgerOpen
              ? "bg-teal-100 text-teal-800 font-bold"
              : entriesCount > 0
                ? "text-slate-700 bg-slate-100 group-hover:bg-slate-200"
                : "text-slate-400 bg-slate-50"
          }`}
        >
          {entriesCount}
        </span>
      </td>

      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            acc.isActive ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              acc.isActive ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          {acc.isActive ? "Active" : "Archived"}
        </span>
      </td>

      <td className="py-2.5 px-4 text-center whitespace-nowrap">
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenEdit(acc)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Edit Account Details"
          >
            <EditIcon size={13} />
          </Button>
          {!acc.isSystem && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(acc)}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
              title="Archive or Delete Account"
            >
              <TrashIcon size={13} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
