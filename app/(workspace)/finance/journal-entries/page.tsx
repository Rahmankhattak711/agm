"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJournalEntries } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import {
  Plus,
  Search,
  Download,
  X,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { JournalDetailsModal } from "./components/JournalDetailsModal";

// Helper to format any legacy or long serial number into clean short format
function formatJournalSerial(entryNumber: string): string {
  if (!entryNumber) return "—";
  
  // Clean up legacy doubled prefixes e.g. JE-INV-INV-2026-0001-3809 => JE-INV-0001
  if (entryNumber.includes("INV")) {
    const match = entryNumber.match(/(\d+)(?:-\d+)?$/);
    if (match) return `JE-INV-${match[1].padStart(4, "0")}`;
  }
  if (entryNumber.includes("REC")) {
    const match = entryNumber.match(/(\d+)(?:-\d+)?$/);
    if (match) return `JE-REC-${match[1].padStart(4, "0")}`;
  }
  if (entryNumber.includes("BILL")) {
    const match = entryNumber.match(/(\d+)(?:-\d+)?$/);
    if (match) return `JE-BILL-${match[1].padStart(4, "0")}`;
  }
  if (entryNumber.startsWith("SYS-MJ-")) {
    const match = entryNumber.match(/SYS-MJ-(\d+)/);
    if (match) return `JE-${match[1].padStart(4, "0")}`;
  }

  return entryNumber;
}

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
      if (journalEntries.length > 0) {
        const q = urlSearch.toLowerCase().trim();
        const found = journalEntries.find(
          (je: any) =>
            je.entryNumber?.toLowerCase() === q ||
            formatJournalSerial(je.entryNumber || "").toLowerCase() === q ||
            je.reference?.toLowerCase() === q ||
            je.id?.toLowerCase() === q
        );
        if (found) {
          setSelectedEntry(found);
        }
      }
    }
  }, [urlSearch, journalEntries]);

  // Warm up other finance pages for instant transitions
  useEffect(() => {
    router.prefetch("/finance/reports/profit-and-loss");
    router.prefetch("/finance/general-ledger");
    router.prefetch("/finance/accounts");
  }, [router]);

  const filtered = useMemo(() => {
    return journalEntries.filter((je: any) => {
      const q = search.toLowerCase().trim();
      const serial = formatJournalSerial(je.entryNumber || "");
      const matchesSearch =
        !q ||
        serial.toLowerCase().includes(q) ||
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

  // Status counts
  const statusCounts = useMemo(() => {
    let posted = 0;
    let draft = 0;
    journalEntries.forEach((je: any) => {
      if (je.isPosted) posted++;
      else draft++;
    });
    return {
      all: journalEntries.length,
      posted,
      draft,
    };
  }, [journalEntries]);

  // Total amount in view
  const totalAmountInView = useMemo(() => {
    return filtered.reduce((sum: number, je: any) => {
      const entryTotal = je.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      return sum + entryTotal;
    }, 0);
  }, [filtered]);

  const handleExportCsv = () => {
    if (!filtered.length) return;
    const headers = ["Serial Number", "Status", "Date", "Reference", "Notes", "Total AED"];
    const rows = filtered.map((e: any) => {
      const total = e.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      return [
        formatJournalSerial(e.entryNumber),
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
    link.download = `Journal_Entries_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col font-sans select-none">
      {/* ── Tier 1: Page Title & Executive Actions Bar ────────────────── */}
      <div className="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Journal Entries
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                {journalEntries.length} entries
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              General ledger journal vouchers, double-entry audit trail, and posted accounting movements
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Journal Entries"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Add Journal Primary CTA */}
          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries/new")}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold shadow-xs hover:shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Journal</span>
          </button>
        </div>
      </div>

      {/* ── Tier 2: Status Navigation & Search Strip ───────────────────── */}
      <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200/70 gap-0.5 shadow-2xs">
            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>All Entries</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === "ALL"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {statusCounts.all}
              </span>
            </button>

            {/* Posted */}
            <button
              type="button"
              onClick={() => setStatusFilter("POSTED")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "POSTED"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Posted</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === "POSTED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {statusCounts.posted}
              </span>
            </button>

            {/* Draft */}
            <button
              type="button"
              onClick={() => setStatusFilter("DRAFT")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "DRAFT"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Drafts</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === "DRAFT"
                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {statusCounts.draft}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial, ref, accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-2xs"
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
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Full-Viewport Table ─────────────────────────────────────── */}
      <div className="w-full flex-1 bg-white overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed select-none">
          <colgroup>
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-44" />
            <col className="" />
            <col className="w-32" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-bold text-[10px] uppercase tracking-wider select-none sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-2.5 px-3 text-left w-24">Status</th>
              <th className="py-2.5 px-3 text-left w-28">Date</th>
              <th className="py-2.5 px-3 text-left w-32">Serial Number</th>
              <th className="py-2.5 px-3 text-left w-32">Reference</th>
              <th className="py-2.5 px-3 text-left w-44">Notes</th>
              <th className="py-2.5 px-3 text-left">Journal Lines Preview</th>
              <th className="py-2.5 px-3 text-right w-32">Total AED</th>
              <th className="py-2.5 px-3 text-right w-28">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center text-slate-400 text-xs font-medium">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading journal vouchers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-slate-700 font-semibold text-xs">No journal entries found</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {search ? "Try adjusting your search criteria" : "Create your first journal voucher to get started."}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((entry: any) => {
                const total =
                  entry.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
                const shortSerial = formatJournalSerial(entry.entryNumber);

                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="border-b border-slate-100 hover:bg-indigo-50/20 transition-colors cursor-pointer text-xs group"
                  >
                    {/* 1. Status Badge */}
                    <td className="px-3 py-2.5 align-middle">
                      {entry.isPosted ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>POSTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>DRAFT</span>
                        </span>
                      )}
                    </td>

                    {/* 2. Date */}
                    <td className="px-3 py-2.5 font-mono text-slate-600 align-middle">
                      {new Date(entry.entryDate).toISOString().split("T")[0]}
                    </td>

                    {/* 3. Short Serial Number */}
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200/60 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 group-hover:text-indigo-700 transition-colors">
                        {shortSerial}
                      </span>
                    </td>

                    {/* 4. Reference */}
                    <td className="px-3 py-2.5 font-medium text-slate-700 align-middle truncate" title={entry.reference}>
                      {entry.reference || entry.lines?.find((l: any) => l.costCenter || l.invoiceNumber)?.costCenter || entry.lines?.find((l: any) => l.costCenter || l.invoiceNumber)?.invoiceNumber || "—"}
                    </td>

                    {/* 5. Notes / Description */}
                    <td className="px-3 py-2.5 text-slate-500 align-middle truncate" title={entry.description}>
                      {entry.description || "—"}
                    </td>

                    {/* 6. Journal Lines Preview (Fluid) */}
                    <td className="px-3 py-2 align-middle min-w-0">
                      <div className="space-y-1">
                        {entry.lines?.slice(0, 3).map((line: any, lIdx: number) => {
                          const isDr = Number(line.debit) > 0;
                          const amt = isDr ? line.debit : line.credit;
                          return (
                            <div key={line.id || lIdx} className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-5 text-center text-[10px] font-bold font-mono px-1 py-0.2 rounded shrink-0 ${
                                  isDr
                                    ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                    : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                }`}
                              >
                                {isDr ? "Dr" : "Cr"}
                              </span>
                              <span
                                className="px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200/70 text-slate-700 text-[10.5px] font-medium truncate max-w-[200px]"
                                title={`${line.account?.accountCode} - ${line.account?.accountName}`}
                              >
                                {line.account?.accountCode} - {line.account?.accountName}
                              </span>
                              <span className="font-mono text-slate-700 ml-auto font-medium text-[11px] tabular-nums shrink-0">
                                {Number(amt).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                        {entry.lines?.length > 3 && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            + {entry.lines.length - 3} more account lines...
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7. Total AED */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 align-middle whitespace-nowrap">
                      {formatAed(total)}
                    </td>

                    {/* 8. Created By */}
                    <td className="px-3 py-2.5 text-right text-slate-500 text-[11px] align-middle truncate" title={entry.user?.fullName}>
                      {entry.user?.fullName || "Accountant"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Status Footer Bar ────────────────────────────────────────────── */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-600 font-medium flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <span>
            Displaying: <strong className="text-slate-900 font-mono font-bold">{filtered.length}</strong> of {journalEntries.length} journals
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Total Turnover: <strong className="text-indigo-700 font-mono font-bold">{formatAed(totalAmountInView)}</strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>UAE FTA Accrual Basis · Double-Entry Standard</span>
        </div>
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
