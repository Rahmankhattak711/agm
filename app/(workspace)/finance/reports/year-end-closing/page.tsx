"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import {
  ChevronLeftIcon,
  RotateCcwIcon,
  ProtectedIcon,
  CalendarIcon,
} from "@/components/icons";

export default function YearEndClosingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const { data, isLoading } = useQuery({
    queryKey: ["fiscal-year-closing", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/year-end-closing?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load fiscal closing data");
      return await res.json();
    },
  });

  const summary = data?.currentYear;
  const history = data?.history || [];

  const closeMutation = useMutation({
    mutationFn: async (year: number) => {
      const res = await fetch("/api/finance/reports/year-end-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close year");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["fiscal-year-closing"] });
      queryClient.invalidateQueries({ queryKey: ["profit-and-loss"] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to close fiscal year");
    },
  });

  const handleRunClosing = () => {
    if (
      confirm(
        `Are you sure you want to close Fiscal Year ${selectedYear}? This will zero-out all Revenue and Expense accounts and transfer AED ${summary?.netProfitLoss.toFixed(2)} to 331 - Retained Earnings.`
      )
    ) {
      closeMutation.mutate(selectedYear);
    }
  };

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* Compact Header with Back Arrow Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Reports"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#1d4ed8] shrink-0"
            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
          >
            <RotateCcwIcon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Automated Annual Year-End Closing
            </h1>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-[#f1f5f9] text-slate-600 border border-[#cbd5e1]"
              style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
            >
              FY {selectedYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-[#f4f7fb]"
            style={{ backgroundColor: "#f4f7fb", borderColor: "#cbd5e1" }}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#1d4ed8]" />
            <span className="text-xs font-medium text-slate-600">Fiscal Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white border border-[#cbd5e1] px-2.5 py-0.5 rounded-md text-xs font-medium text-slate-800 outline-none focus:border-[#1d4ed8] cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
            >
              <option value={2025}>FY 2025</option>
              <option value={2026}>FY 2026</option>
              <option value={2027}>FY 2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Compact Pastel Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-medium block">
            TOTAL REVENUE (4XXX)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-emerald-700 leading-snug block mt-0.5 tabular-nums whitespace-nowrap">
            {formatAed(summary?.totalRevenue || 0)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            Full year operating income
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-medium block">
            TOTAL EXPENSES (5XXX)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-rose-700 leading-snug block mt-0.5 tabular-nums whitespace-nowrap">
            {formatAed(summary?.totalExpense || 0)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            COGS &amp; operating expenses
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-medium block">
            NET PROFIT / (LOSS) TRANSFER
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-800 leading-snug block mt-0.5 tabular-nums whitespace-nowrap">
            {formatAed(summary?.netProfitLoss || 0)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            Transfers to 331 - Retained Earnings
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] uppercase tracking-wider text-slate-500 font-medium block">
            CLOSING STATUS
          </span>
          <div className="mt-0.5">
            {summary?.isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ProtectedIcon className="w-3 h-3" />
                CLOSED &amp; LOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                OPEN · PENDING CLOSE
              </span>
            )}
          </div>
          <span className="text-[10.5px] text-slate-500 font-normal block mt-0.5">
            Period: {selectedYear}-01-01 → {selectedYear}-12-31
          </span>
        </div>
      </div>

      {/* Main Closing Summary Card */}
      <div
        className="border border-[#cbd5e1] rounded-xl bg-white shadow-2xs overflow-hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div
          className="px-5 py-3.5 border-b border-[#cbd5e1] flex flex-wrap justify-between items-center gap-3"
          style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Financial Year {selectedYear} Closeout Execution &amp; Verification
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              Automated journal generation on 31 December {selectedYear}
            </p>
          </div>

          <button
            onClick={handleRunClosing}
            disabled={summary?.isClosed || closeMutation.isPending}
            className={`h-8 px-4 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${summary?.isClosed
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-[#1d4ed8] text-white hover:bg-[#1e40af] cursor-pointer shadow-2xs"
              }`}
            style={
              !summary?.isClosed
                ? { backgroundColor: "#1d4ed8", color: "#ffffff" }
                : undefined
            }
          >
            <RotateCcwIcon className="w-3.5 h-3.5" />
            {closeMutation.isPending
              ? "Processing Year-End Close..."
              : summary?.isClosed
                ? "Fiscal Year Already Closed"
                : `Close Fiscal Year ${selectedYear}`}
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-normal">
            Calculating fiscal year summary...
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Mechanics Explanation */}
            <div
              className="border border-[#cbd5e1] rounded-xl p-4 text-xs space-y-2 text-slate-600"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}
            >
              <span className="font-semibold text-slate-800 block">
                How the Automated Closing Engine Works:
              </span>
              <ul className="list-disc pl-5 space-y-1 font-normal">
                <li>
                  All <span className="font-medium text-slate-800">Revenue (4xxx)</span> and{" "}
                  <span className="font-medium text-slate-800">Expense (5xxx)</span> account balances are zeroed out to{" "}
                  <code className="text-[#1d4ed8] font-mono">0.00 AED</code> on 31 December {selectedYear}.
                </li>
                <li>
                  The Net Profit / (Loss) of{" "}
                  <span className="font-semibold font-mono text-[#1d4ed8]">
                    {formatAed(summary?.netProfitLoss || 0)}
                  </span>{" "}
                  is transferred directly into{" "}
                  <code className="text-slate-900 font-mono">331 - Retained Earnings</code> (Equity).
                </li>
                <li>
                  All Balance Sheet closing balances (Assets, Liabilities, Equity) automatically roll forward as the{" "}
                  <span className="font-medium text-slate-800">1 January {selectedYear + 1} Opening Balances</span>.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Historical Closings Log */}
      <div
        className="border border-[#cbd5e1] rounded-xl bg-white shadow-2xs overflow-hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div
          className="px-5 py-3 border-b border-[#cbd5e1] flex items-center justify-between"
          style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
        >
          <h3 className="text-xs font-semibold text-slate-800">
            Fiscal Closings &amp; Roll-Forward History
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            {history.length} closed period(s)
          </span>
        </div>

        <div className="p-5">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 font-normal py-4 text-center">
              No fiscal years have been formally closed yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-200/80 text-xs">
              {history.map((h: any) => (
                <div key={h.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">FY {h.year}</span>
                    <span className="text-slate-500 font-normal ml-2">
                      Closed on {new Date(h.closedAt).toLocaleDateString()} by{" "}
                      {h.closedBy?.fullName || "Accountant"}
                    </span>
                  </div>
                  <div className="font-mono font-medium text-[#1d4ed8]">
                    Transferred {formatAed(Number(h.retainedEarningsTransfer))} to Retained Earnings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
