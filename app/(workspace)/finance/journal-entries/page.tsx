"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJournalEntries } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import { Plus, Search, Download, X, RefreshCw, Filter } from "lucide-react";
import { JournalDetailsModal } from "./components/JournalDetailsModal";

function ManualJournalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const { data: journalEntries = [], isLoading, refetch } = useJournalEntries();

  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "DRAFT">("ALL");
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  // Warm up other finance pages for instant transitions
  useEffect(() => {
    router.prefetch("/finance/reports/profit-and-loss");
    router.prefetch("/finance/general-ledger");
    router.prefetch("/finance/accounts");
  }, [router]);

  const filtered = useMemo(() => {
    return journalEntries.filter((je: any) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        je.entryNumber?.toLowerCase().includes(q) ||
        je.reference?.toLowerCase().includes(q) ||
        je.description?.toLowerCase().includes(q) ||
        je.id?.toLowerCase().includes(q) ||
        je.lines?.some(
          (l: any) =>
            l.account?.accountCode?.toLowerCase().includes(q) ||
            l.account?.accountName?.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "POSTED" && je.isPosted) ||
        (statusFilter === "DRAFT" && !je.isPosted);

      return matchesSearch && matchesStatus;
    });
  }, [journalEntries, search, statusFilter]);

  const handleExportCsv = () => {
    if (!filtered.length) return;
    const headers = ["Serial Number", "Status", "Date", "Reference", "Notes", "Total AED"];
    const rows = filtered.map((e: any) => {
      const total = e.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      return [
        e.entryNumber,
        e.isPosted ? "POSTED" : "DRAFT",
        new Date(e.entryDate).toISOString().split("T")[0],
        `"${e.reference || ""}"`,
        `"${e.description || ""}"`,
        total.toFixed(2),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Manual_Journals_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col">
      {/* Sleek Modern Header matching Chart of Accounts */}
      <div className="w-full bg-white px-6 pt-4 pb-3 space-y-3 shrink-0">
        {/* Top Row: Breadcrumb + Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Accounting</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-900 font-bold text-sm tracking-tight">
              Manual Journals
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh journal entries"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => router.push("/finance/journal-entries/new")}
              className="px-4 py-1.5 rounded-lg bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Journal</span>
            </button>
          </div>
        </div>

        {/* Controls Row: Clean Search + Active Filter Pills + Segmented Status Pill Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search serial, ref, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    router.replace("/finance/journal-entries");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Journal Filter Pill matching Image 4 */}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium shadow-2xs">
                <span># Journal ID is <strong>{search}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    router.replace("/finance/journal-entries");
                  }}
                  className="hover:text-indigo-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Segmented Status Filter: [ All | Posted | Draft ] */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            {(["ALL", "POSTED", "DRAFT"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All" : st === "POSTED" ? "Posted" : "Draft"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full-Viewport Table matching Chart of Accounts */}
      <div className="w-full border-t border-slate-200/90 flex-1 bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-24">Status</th>
              <th className="py-3 px-4 w-28">Date</th>
              <th className="py-3 px-4 w-44">Serial Number</th>
              <th className="py-3 px-4 min-w-[130px]">Reference</th>
              <th className="py-3 px-4 min-w-[160px]">Notes</th>
              <th className="py-3 px-4 min-w-[340px]">Journal Lines Preview</th>
              <th className="py-3 px-4 text-right w-32">Total AED</th>
              <th className="py-3 px-4 text-right w-36">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-xs">
                  Loading manual journals...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-xs">
                  No manual journals found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((entry: any) => {
                const total =
                  entry.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer text-xs"
                  >
                    <td className="px-4 py-3">
                      {entry.isPosted ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          POSTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          DRAFT
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {new Date(entry.entryDate).toISOString().split("T")[0]}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {entry.entryNumber}
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {entry.reference || "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {entry.description || "—"}
                    </td>

                    <td className="px-4 py-2 text-[11px]">
                      <div className="space-y-1">
                        {entry.lines?.slice(0, 3).map((line: any, lIdx: number) => {
                          const isDr = Number(line.debit) > 0;
                          const amt = isDr ? line.debit : line.credit;
                          return (
                            <div key={line.id || lIdx} className="flex items-center gap-2">
                              <span
                                className={`w-5 font-bold font-mono ${
                                  isDr ? "text-blue-600" : "text-amber-600"
                                }`}
                              >
                                {isDr ? "Dr" : "Cr"}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-slate-800 font-medium truncate max-w-[200px]">
                                {line.account?.accountCode} - {line.account?.accountName}
                              </span>
                              <span className="font-mono text-slate-500 ml-auto font-medium">
                                {Number(amt).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                        {entry.lines?.length > 3 && (
                          <span className="text-[10px] text-slate-400 italic">
                            + {entry.lines.length - 3} more lines...
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatAed(total)}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                      {entry.user?.fullName || "Accountant"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200/90 flex justify-between items-center text-xs text-slate-500 shrink-0">
        <span>Showing {filtered.length} of {journalEntries.length} records</span>
        <span className="font-mono">UAE FTA Double-Entry Standard</span>
      </div>

      {/* Journal Details Modal */}
      <JournalDetailsModal
        isOpen={!!selectedEntry}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}

export default function ManualJournalsListingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading journals...</div>}>
      <ManualJournalsContent />
    </Suspense>
  );
}
