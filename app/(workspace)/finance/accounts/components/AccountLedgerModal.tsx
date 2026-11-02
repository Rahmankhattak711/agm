"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccountLedger, ChartOfAccount } from "@/lib/hooks/api-hooks";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  X,
  Maximize2,
  ExternalLink,
  Search,
  Download,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  RefreshCw,
} from "lucide-react";

interface AccountLedgerModalProps {
  isOpen: boolean;
  account: ChartOfAccount | null;
  onClose: () => void;
  formatNumber: (val: number | string | undefined) => string;
  formatCurrency: (val: number | string | undefined) => string;
}

export function AccountLedgerModal({
  isOpen,
  account,
  onClose,
  formatNumber,
  formatCurrency,
}: AccountLedgerModalProps) {
  const accountId = account?.id || "";
  const { data: ledgerData, isLoading, refetch } = useAccountLedger(accountId);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"ALL" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR">("ALL");

  const filteredLedger = useMemo(() => {
    if (!ledgerData?.ledger) return [];
    let items = [...ledgerData.ledger];

    if (dateRange !== "ALL") {
      const now = new Date();
      items = items.filter((entry) => {
        const entryDate = new Date(entry.entryDate);
        if (dateRange === "THIS_MONTH") {
          return (
            entryDate.getMonth() === now.getMonth() &&
            entryDate.getFullYear() === now.getFullYear()
          );
        }
        if (dateRange === "THIS_QUARTER") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const entryQuarter = Math.floor(entryDate.getMonth() / 3);
          return entryQuarter === currentQuarter && entryDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === "THIS_YEAR") {
          return entryDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (entry) =>
          entry.entryNumber?.toLowerCase().includes(q) ||
          entry.reference?.toLowerCase().includes(q) ||
          entry.description?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [ledgerData?.ledger, search, dateRange]);

  const totalDebits = useMemo(() => {
    return filteredLedger.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  }, [filteredLedger]);

  const totalCredits = useMemo(() => {
    return filteredLedger.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  }, [filteredLedger]);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate">
            <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
              {account.accountCode}
            </span>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {account.accountName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{account.type}</span>
                {account.accountSubtype && <span>• {account.accountSubtype}</span>}
                <span>• Cash Flow: {(account as any).cashFlowType || "Operating"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {/* Direct Link to Dedicated Full Page */}
            <Link
              href={`/finance/accounts/${account.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl transition-colors cursor-pointer"
              title="Open as separate full page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Full Page</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Summary Metrics */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-3 gap-4 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Net Running Balance
            </span>
            <span className="text-sm font-mono font-black text-slate-900 block mt-0.5">
              {formatCurrency(account.balance || 0)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Debits
            </span>
            <span className="text-sm font-mono font-black text-emerald-800 block mt-0.5">
              {formatCurrency(totalDebits)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              Total Credits
            </span>
            <span className="text-sm font-mono font-black text-rose-800 block mt-0.5">
              {formatCurrency(totalCredits)}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search voucher, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setDateRange("ALL")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                dateRange === "ALL" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDateRange("THIS_MONTH")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                dateRange === "THIS_MONTH" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange("THIS_YEAR")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                dateRange === "THIS_YEAR" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Modal Scrollable Transactions Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center p-8 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 mr-2" />
              Loading ledger transactions...
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 text-xs">
              <Building2 className="w-8 h-8 text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">No Transactions Found</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No journal entries match the selected filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 w-24">Date</th>
                  <th className="py-2.5 px-4 w-32">Voucher #</th>
                  <th className="py-2.5 px-4 w-32">Reference</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right w-28">Debit (AED)</th>
                  <th className="py-2.5 px-4 text-right w-28">Credit (AED)</th>
                  <th className="py-2.5 px-4 text-right w-32">Running Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map((entry) => {
                  const debit = Number(entry.debit || 0);
                  const credit = Number(entry.credit || 0);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {entry.entryNumber}
                      </td>
                      <td className="py-2 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {entry.reference || "—"}
                      </td>
                      <td className="py-2 px-4 text-slate-800 max-w-sm truncate">
                        {entry.description || "General Journal Entry"}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-900 whitespace-nowrap">
                        {debit > 0 ? formatNumber(debit) : "—"}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-900 whitespace-nowrap">
                        {credit > 0 ? formatNumber(credit) : "—"}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-bold text-slate-900 whitespace-nowrap bg-slate-50/40">
                        {formatNumber(entry.runningBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filteredLedger.length} ledger transactions
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
