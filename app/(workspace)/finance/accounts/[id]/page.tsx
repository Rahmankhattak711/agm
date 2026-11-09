"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useAccountLedger } from "@/lib/hooks/api-hooks";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  ArrowLeft,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Building2,
  RefreshCw,
  Scale,
  X,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AccountLedgerPage({ params }: PageProps) {
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
      <div className="w-full min-h-full bg-white flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-xs font-normal">Loading account ledger...</span>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="w-full min-h-full bg-white flex items-center justify-center p-8">
        <div
          className="bg-white p-6 rounded-xl text-center max-w-md"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <h2 className="text-sm font-semibold text-slate-800">Account Not Found</h2>
          <p className="text-xs font-normal text-slate-500 mt-1">
            The requested account ledger does not exist or has been removed.
          </p>
          <Link
            href="/finance/accounts"
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chart of Accounts</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/finance/accounts"
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="h-8 w-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shrink-0"
            title="Return to Chart of Accounts"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #93c5fd",
                }}
                className="font-mono font-medium text-xs px-2 py-0.5 rounded-md"
              >
                {account.accountCode}
              </span>
              <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
                {account.accountName}
              </h1>
            </div>
            <p className="text-[11.5px] font-normal text-slate-500 mt-0.5">
              {account.type}
              {account.accountSubtype ? ` • ${account.accountSubtype}` : ""}
              {account.cashFlowType ? ` • Cash Flow: ${account.cashFlowType}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!filteredLedger.length}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH & FILTER BOX
          ========================================================================= */}
      <div
        className="rounded-xl p-3"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2.5">
          {/* Search Box */}
          <div className="flex-1">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search voucher #, reference, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Range Select */}
          <div className="w-full md:w-48">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              DATE PERIOD
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All time</option>
              <option value="THIS_MONTH">This month</option>
              <option value="THIS_QUARTER">This quarter</option>
              <option value="THIS_YEAR">This year</option>
            </select>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateRange("ALL");
                refetch();
              }}
              disabled={isRefetching}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
              title="Reset & Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Current Net Balance */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              CURRENT BALANCE
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatCurrency(account.balance || 0)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Net ledger balance
            </span>
          </div>
        </div>

        {/* Card 2: Total Debits */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL DEBITS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatCurrency(totalDebits)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Debit movements
            </span>
          </div>
        </div>

        {/* Card 3: Total Credits */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffe4e6",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL CREDITS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatCurrency(totalCredits)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Credit movements
            </span>
          </div>
        </div>

        {/* Card 4: Transaction Count */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#fef9c3",
              color: "#a16207",
              border: "1px solid #fde047",
            }}
          >
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TRANSACTIONS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
              {filteredLedger.length}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Posted entries
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LEDGER TRANSACTIONS TABLE WITH LIGHT-BLUE HEADER BAR
          ========================================================================= */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        {/* Soft Light-Blue Top Bar */}
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <h3 className="text-xs font-semibold text-slate-800">
            Ledger records
          </h3>
          <span className="text-[11px] text-slate-500 font-normal">
            {filteredLedger.length} {filteredLedger.length === 1 ? "record" : "records"}
          </span>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-1.5">
            <Building2 className="w-7 h-7 text-slate-300 mx-auto" />
            <div className="text-xs font-medium text-slate-700">No journal entries found</div>
            <p className="text-[11px] font-normal text-slate-400">
              {search || dateRange !== "ALL"
                ? "Try resetting your search or date filters."
                : "No transactions have been posted to this account yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr
                  className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <th className="py-2.5 px-4 w-28 whitespace-nowrap">DATE</th>
                  <th className="py-2.5 px-4 w-36 whitespace-nowrap">VOUCHER #</th>
                  <th className="py-2.5 px-4 w-36 whitespace-nowrap">REFERENCE</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">DESCRIPTION</th>
                  <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap">DEBIT (AED)</th>
                  <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap">CREDIT (AED)</th>
                  <th className="py-2.5 px-4 text-right w-36 whitespace-nowrap">RUNNING BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map((entry) => {
                  const debit = Number(entry.debit || 0);
                  const credit = Number(entry.credit || 0);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-500 font-normal whitespace-nowrap">
                        {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td
                        className="py-2.5 px-4 font-mono font-medium whitespace-nowrap"
                        style={{ color: "#1d4ed8" }}
                      >
                        {entry.entryNumber}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 font-normal whitespace-nowrap">
                        {entry.reference || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-normal max-w-md truncate">
                        {entry.description || "General Journal Entry"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right font-normal text-slate-800 whitespace-nowrap">
                        {debit > 0 ? formatNumber(debit) : "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right font-normal text-slate-800 whitespace-nowrap">
                        {credit > 0 ? formatNumber(credit) : "-"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right font-semibold text-slate-800 whitespace-nowrap bg-slate-50/40">
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
  );
}
