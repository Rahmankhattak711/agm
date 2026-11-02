"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountLedger } from "@/lib/hooks/api-hooks";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  ArrowLeft,
  Calendar,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AccountLedgerPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: account, isLoading, refetch, isRefetching } = useAccountLedger(id);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"ALL" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR">("ALL");

  const filteredLedger = useMemo(() => {
    if (!account?.ledger) return [];
    let items = [...account.ledger];

    // Filter by Date
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

    // Filter by Search (description, reference, voucher #)
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
  }, [account?.ledger, search, dateRange]);

  const totalDebits = useMemo(() => {
    return filteredLedger.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  }, [filteredLedger]);

  const totalCredits = useMemo(() => {
    return filteredLedger.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  }, [filteredLedger]);

  const handleExportCsv = () => {
    if (!filteredLedger.length || !account) return;
    const headers = ["Date", "Voucher #", "Reference", "Description", "Debit (AED)", "Credit (AED)", "Running Balance (AED)"];
    const rows = filteredLedger.map((r) => [
      new Date(r.entryDate).toLocaleDateString("en-GB"),
      `"${r.entryNumber || ""}"`,
      `"${r.reference || ""}"`,
      `"${r.description || ""}"`,
      Number(r.debit || 0).toFixed(2),
      Number(r.credit || 0).toFixed(2),
      Number(r.runningBalance || 0).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ledger_${account.accountCode}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading account ledger...</span>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Account Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested account ledger does not exist or has been removed.</p>
          <Link
            href="/finance/accounts"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chart of Accounts</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/70 flex flex-col">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/finance/accounts"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Return to Chart of Accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg">
                  {account.accountCode}
                </span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {account.accountName}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {account.type}
                </span>
                {account.accountSubtype && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    • {account.accountSubtype}
                  </span>
                )}
                {account.cashFlowType && (
                  <span className="text-[10px] text-slate-400">
                    • Cash Flow: {account.cashFlowType}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Net Balance
              </span>
              <span className="text-base font-mono font-black text-slate-900">
                {formatCurrency(account.balance || 0)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Export ledger as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Debit Movements
              </span>
              <span className="text-base font-mono font-bold text-emerald-700 mt-0.5 block">
                {formatCurrency(totalDebits)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Credit Movements
              </span>
              <span className="text-base font-mono font-bold text-rose-700 mt-0.5 block">
                {formatCurrency(totalCredits)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Transaction Count
              </span>
              <span className="text-base font-mono font-bold text-slate-800 mt-0.5 block">
                {filteredLedger.length} entries
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search voucher #, reference, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Date Segmented Filters */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setDateRange("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateRange === "ALL" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateRange("THIS_MONTH")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateRange === "THIS_MONTH" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange("THIS_QUARTER")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateRange === "THIS_QUARTER" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              This Quarter
            </button>
            <button
              type="button"
              onClick={() => setDateRange("THIS_YEAR")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateRange === "THIS_YEAR" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
              }`}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {filteredLedger.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">No Journal Entries Found</div>
              <p className="text-[11px] text-slate-400">
                {search || dateRange !== "ALL"
                  ? "Try resetting your search or date filters."
                  : "No transactions have been posted to this account yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-28">Date</th>
                    <th className="py-3 px-4 w-36">Voucher #</th>
                    <th className="py-3 px-4 w-36">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right w-32">Debit (AED)</th>
                    <th className="py-3 px-4 text-right w-32">Credit (AED)</th>
                    <th className="py-3 px-4 text-right w-36">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((entry) => {
                    const debit = Number(entry.debit || 0);
                    const credit = Number(entry.credit || 0);
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {entry.entryNumber}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {entry.reference || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 max-w-md truncate">
                          {entry.description || "General Journal Entry"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-right font-medium text-slate-900 whitespace-nowrap">
                          {debit > 0 ? formatNumber(debit) : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-right font-medium text-slate-900 whitespace-nowrap">
                          {credit > 0 ? formatNumber(credit) : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-right font-bold text-slate-900 whitespace-nowrap bg-slate-50/50">
                          {formatNumber(entry.runningBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
