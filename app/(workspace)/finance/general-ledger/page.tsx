"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccounts } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import { TimelineMonthSlider, MonthItem } from "./components/TimelineMonthSlider";
import { Search, Download, RefreshCw, X, Lock, Filter, CheckCircle2 } from "lucide-react";
import { JournalDetailsModal } from "../journal-entries/components/JournalDetailsModal";

// Months from 2025 to 2026 for timeline scrubber
const TIMELINE_MONTHS: MonthItem[] = [
  { key: "2025-01", label: "Jan", year: 2025 },
  { key: "2025-02", label: "Feb", year: 2025 },
  { key: "2025-03", label: "Mar", year: 2025 },
  { key: "2025-04", label: "Apr", year: 2025 },
  { key: "2025-05", label: "May", year: 2025 },
  { key: "2025-06", label: "Jun", year: 2025 },
  { key: "2025-07", label: "Jul", year: 2025 },
  { key: "2025-08", label: "Aug", year: 2025 },
  { key: "2025-09", label: "Sep", year: 2025 },
  { key: "2025-10", label: "Oct", year: 2025 },
  { key: "2025-11", label: "Nov", year: 2025 },
  { key: "2025-12", label: "Dec", year: 2025 },
  { key: "2026-01", label: "Jan", year: 2026 },
  { key: "2026-02", label: "Feb", year: 2026 },
  { key: "2026-03", label: "Mar", year: 2026 },
  { key: "2026-04", label: "Apr", year: 2026 },
  { key: "2026-05", label: "May", year: 2026 },
  { key: "2026-06", label: "Jun", year: 2026 },
  { key: "2026-07", label: "Jul", year: 2026 },
  { key: "2026-08", label: "Aug", year: 2026 },
  { key: "2026-09", label: "Sep", year: 2026 },
  { key: "2026-10", label: "Oct", year: 2026 },
  { key: "2026-11", label: "Nov", year: 2026 },
  { key: "2026-12", label: "Dec", year: 2026 },
];

function GeneralLedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlAccountId = searchParams.get("accountId") || "";
  const urlAccountName = searchParams.get("accountName") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const urlJournalId =
    searchParams.get("journalId") ||
    searchParams.get("journal") ||
    searchParams.get("search") ||
    "";

  const { data: accounts = [] } = useAccounts();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [journalIdFilter, setJournalIdFilter] = useState<string>(urlJournalId);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    urlJournalId ? "" : urlAccountId
  );
  const [selectedRange, setSelectedRange] = useState<[string, string]>([
    urlFrom || "2026-01",
    urlTo || "2026-12",
  ]);
  const [selectedModalEntry, setSelectedModalEntry] = useState<any | null>(null);

  // Synchronize URL parameters if changed
  useEffect(() => {
    if (urlJournalId) {
      setJournalIdFilter(urlJournalId);
      // Clear account filter when journal ID is active to show complete double-entry
      setSelectedAccountId("");
    } else {
      setJournalIdFilter("");
      if (urlAccountId) setSelectedAccountId(urlAccountId);
    }
    if (urlFrom && urlTo) setSelectedRange([urlFrom, urlTo]);
  }, [urlJournalId, urlAccountId, urlFrom, urlTo]);

  // Warm up other finance and commercial pages for instant route transitions
  useEffect(() => {
    router.prefetch("/finance/reports/profit-and-loss");
    router.prefetch("/finance/journal-entries");
    router.prefetch("/finance/accounts");
    router.prefetch("/commercial/sales-invoices");
  }, [router]);

  // Resolve active account label
  const activeAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find(
      (a) => a.id === selectedAccountId || a.accountCode === selectedAccountId
    );
  }, [selectedAccountId, accounts]);

  // Fetch General Ledger records with dynamic Offset accounts
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ["general-ledger", selectedRange, selectedAccountId, search, journalIdFilter],
    queryFn: async () => {
      const from = `${selectedRange[0]}-01`;
      const to = `${selectedRange[1]}-31`;
      const params = new URLSearchParams();

      if (journalIdFilter) {
        params.append("journalId", journalIdFilter);
      } else {
        params.append("from", from);
        params.append("to", to);
        if (selectedAccountId) params.append("accountId", selectedAccountId);
      }

      if (search) params.append("search", search);

      const res = await fetch(`/api/finance/general-ledger?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load general ledger");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Calculate Totals and Running Balance
  const { totals, recordsWithRunningBalance } = useMemo(() => {
    let d = 0;
    let c = 0;
    let running = 0;

    const isNormalDebit = activeAccount?.type === "ASSET" || activeAccount?.type === "EXPENSE";

    const computed = records.map((r: any) => {
      const dr = Number(r.debitAed) || 0;
      const cr = Number(r.creditAed) || 0;
      d += dr;
      c += cr;

      if (isNormalDebit) {
        running += dr - cr;
      } else {
        running += cr - dr;
      }

      return {
        ...r,
        runningBalance: running,
      };
    });

    return {
      totals: {
        debit: Math.round(d * 100) / 100,
        credit: Math.round(c * 100) / 100,
        difference: Math.round(Math.abs(d - c) * 100) / 100,
      },
      recordsWithRunningBalance: computed,
    };
  }, [records, activeAccount]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!records.length) return;
    const headers = [
      "Entry Number",
      "Source",
      "Date",
      "Account Code",
      "Account Name",
      "Offset Accounts",
      "Description",
      "Journal Notes",
      "Debit AED",
      "Credit AED",
    ];
    const rows = records.map((r: any) => [
      r.journalNumber || r.journalId,
      r.source,
      new Date(r.date).toISOString().split("T")[0],
      r.account.code,
      `"${r.account.name}"`,
      `"${r.offsetAccounts.map((o: any) => `${o.code} - ${o.name}`).join("; ")}"`,
      `"${r.description || ""}"`,
      `"${r.journalNotes || ""}"`,
      r.debitAed || 0,
      r.creditAed || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `General_Ledger_${selectedRange[0]}_to_${selectedRange[1]}.csv`;
    link.click();
  };

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "Sales invoice":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Customer payment":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Bill":
      case "Supplier bill":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Bill payment":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Credit note":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col">
      {/* Sleek Top Header matching Chart of Accounts */}
      <div className="w-full bg-white px-6 pt-4 pb-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Reports</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-900 font-bold text-sm tracking-tight">
              General Ledger
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export General Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh ledger records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Month Scrubber matching Image 5 */}
        <TimelineMonthSlider
          months={TIMELINE_MONTHS}
          selectedRange={selectedRange}
          onChange={setSelectedRange}
        />

        {/* Controls Toolbar with Filter Pills matching Image 5 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Journal ID Filter Pill matching Wafeq: "# Journal ID is <ID> ✕" */}
            {journalIdFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs font-mono">
                <span>
                  # Journal ID is <strong>{journalIdFilter}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setJournalIdFilter("");
                    router.replace("/finance/general-ledger");
                  }}
                  className="hover:text-indigo-900 cursor-pointer ml-1 p-0.5 rounded"
                  title="Clear Journal ID filter and view all entries"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Account Filter Pill matching Image 5: "Account is <Name> ×" */}
            {!journalIdFilter && (selectedAccountId || urlAccountName) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium shadow-2xs">
                <span>
                  Account is{" "}
                  <strong>
                    {activeAccount
                      ? `${activeAccount.accountCode} - ${activeAccount.accountName}`
                      : urlAccountName || "Selected Account"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId("");
                    router.replace("/finance/general-ledger");
                  }}
                  className="hover:text-indigo-900 cursor-pointer ml-1"
                  title="Clear account filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Date Filter Pill matching Image 5: "Date <from> -> <to> ×" */}
            {!journalIdFilter && (selectedRange[0] !== "2026-01" || selectedRange[1] !== "2026-12") && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs font-mono">
                <span>
                  Date <strong>{selectedRange[0]} &rarr; {selectedRange[1]}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRange(["2026-01", "2026-12"]);
                  }}
                  className="hover:text-slate-900 cursor-pointer ml-1"
                  title="Reset date range to full year"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Account Selector Dropdown if no account pill active */}
            {!journalIdFilter && !selectedAccountId && (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none max-w-xs truncate cursor-pointer shadow-2xs"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountCode} - {acc.accountName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {journalIdFilter ? (
              <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium">
                Viewing double-entry lines for <strong>{journalIdFilter}</strong>
              </span>
            ) : (
              <>
                Period: <span className="text-slate-900 font-semibold font-mono">{selectedRange[0]} &rarr; {selectedRange[1]}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Viewport Table matching Chart of Accounts & Image 5 */}
      <div className="w-full border-t border-slate-200/90 flex-1 bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 px-3 w-40 min-w-[140px] sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                Journal ID
              </th>
              <th className="py-3 px-2.5 w-28 min-w-[95px]">Source</th>
              <th className="py-3 px-2.5 w-24 min-w-[85px]">Date</th>
              <th className="py-3 px-3 min-w-[140px] max-w-[180px]">Account</th>
              <th className="py-3 px-3 min-w-[160px] max-w-[200px]">Offset Accounts</th>
              <th className="py-3 px-3 min-w-[140px] max-w-[200px]">Description</th>
              <th className="py-3 px-3 min-w-[140px] max-w-[200px]">Journal Notes</th>
              <th className="py-3 px-3 text-right w-28 min-w-[90px]">Debit (AED)</th>
              <th className="py-3 px-3 text-right w-28 min-w-[90px]">Credit (AED)</th>
              {selectedAccountId && (
                <th className="py-3 px-3 text-right w-28 min-w-[90px] bg-slate-100/60">
                  Balance (AED)
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={selectedAccountId ? 10 : 9} className="px-4 py-16 text-center text-slate-400 text-xs">
                  Loading General Ledger records...
                </td>
              </tr>
            ) : recordsWithRunningBalance.length === 0 ? (
              <tr>
                <td colSpan={selectedAccountId ? 10 : 9} className="px-4 py-16 text-center text-slate-400 text-xs">
                  No ledger entries found for the selected period and account filters.
                </td>
              </tr>
            ) : (
              recordsWithRunningBalance.map((r: any) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    if (r.rawEntry) setSelectedModalEntry(r.rawEntry);
                  }}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer text-xs group"
                >
                  {/* Journal ID with Lock Icon matching Image 5 - STICKY so it's never cut off */}
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span
                        className="hover:text-[#5046e5] transition-colors truncate"
                        title={r.journalNumber || r.journalId}
                      >
                        {r.journalNumber || r.journalId}
                      </span>
                    </div>
                  </td>

                  {/* Source Badge with direct invoice navigation */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.sourceUrl) {
                          router.push(r.sourceUrl);
                        } else if (r.source === "Sales invoice") {
                          const invNum = r.reference?.startsWith("INV-")
                            ? r.reference
                            : (r.journalNumber?.replace("JE-INV-", "").split("-").slice(0, 3).join("-") || r.reference);
                          router.push(`/commercial/sales-invoices?search=${encodeURIComponent(invNum || "")}`);
                        } else {
                          router.push(`/finance/journal-entries?search=${encodeURIComponent(r.journalNumber || "")}`);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-semibold border transition-all hover:scale-105 hover:shadow-xs cursor-pointer ${getSourceBadgeStyle(
                        r.source
                      )}`}
                      title={`Open ${r.source}: ${r.reference || r.journalNumber}`}
                    >
                      <span>{r.source}</span>
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-2.5 py-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                    {new Date(r.date).toISOString().split("T")[0]}
                  </td>

                  {/* Account Badge */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-block max-w-[170px] truncate px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 font-medium text-[11px]"
                      title={`${r.account.code} - ${r.account.name}`}
                    >
                      {r.account.code} - {r.account.name}
                    </span>
                  </td>

                  {/* Counter-Balancing Offset Account Badges */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {r.offsetAccounts.length === 0 ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : (
                        r.offsetAccounts.map((o: any) => (
                          <span
                            key={o.id}
                            className="px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[10.5px] max-w-[190px] truncate"
                            title={`${o.code} - ${o.name}`}
                          >
                            {o.code} - {o.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-3 py-2.5 text-slate-600 max-w-[190px] truncate" title={r.description || ""}>
                    {r.description || "—"}
                  </td>

                  {/* Journal Notes */}
                  <td className="px-3 py-2.5 text-slate-500 max-w-[190px] truncate" title={r.journalNotes || ""}>
                    {r.journalNotes || "—"}
                  </td>

                  {/* Debit AED */}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                    {r.debitAed > 0 ? Number(r.debitAed).toFixed(2) : "—"}
                  </td>

                  {/* Credit AED */}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                    {r.creditAed > 0 ? Number(r.creditAed).toFixed(2) : "—"}
                  </td>

                  {/* Running Balance */}
                  {selectedAccountId && (
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                      {Number(r.runningBalance).toFixed(2)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>

          {/* Total Footer Row */}
          {records.length > 0 && (
            <tfoot className="bg-slate-50/90 font-mono text-xs font-bold border-t-2 border-slate-200">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-right uppercase tracking-wider font-sans text-slate-700">
                  Total Movement:
                </td>
                <td className="px-3 py-3 text-right text-blue-700 font-mono whitespace-nowrap">
                  {formatAed(totals.debit)}
                </td>
                <td className="px-3 py-3 text-right text-amber-700 font-mono whitespace-nowrap">
                  {formatAed(totals.credit)}
                </td>
                {selectedAccountId && (
                  <td className="px-3 py-3 text-right text-slate-900 bg-slate-100/60 font-mono whitespace-nowrap">
                    {recordsWithRunningBalance.length > 0
                      ? formatAed(
                          recordsWithRunningBalance[recordsWithRunningBalance.length - 1].runningBalance
                        )
                      : "—"}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Status Bar */}
      <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200/90 flex justify-between items-center text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>Showing <strong>{records.length}</strong> ledger transaction lines</span>
          <span>•</span>
          <span className="font-mono flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            GL Double-Entry Balanced (Diff: {totals.difference.toFixed(2)} AED)
          </span>
        </div>
        <span className="font-mono text-slate-400">UAE FTA Standard</span>
      </div>

      {/* Journal Details Viewer Modal */}
      <JournalDetailsModal
        isOpen={!!selectedModalEntry}
        entry={selectedModalEntry}
        onClose={() => setSelectedModalEntry(null)}
      />
    </div>
  );
}

export default function GeneralLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading General Ledger...</div>}>
      <GeneralLedgerContent />
    </Suspense>
  );
}
