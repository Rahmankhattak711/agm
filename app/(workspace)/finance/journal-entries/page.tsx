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
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Scale,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { JournalDetailsModal } from "./components/JournalDetailsModal";

// Helper to format any legacy or long serial number into clean short format
function formatJournalSerial(entryNumber: string): string {
  if (!entryNumber) return "-";

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

  const { data: journalEntries = [], isLoading, refetch, isFetching } = useJournalEntries();

  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "DRAFT">("ALL");
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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

  // Reset to page 1 when search, statusFilter, or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  const startIndex = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, filtered.length);

  // Metrics & Status counts
  const metrics = useMemo(() => {
    let posted = 0;
    let draft = 0;
    let totalAllAmount = 0;
    let postedAmount = 0;
    let draftAmount = 0;

    journalEntries.forEach((je: any) => {
      const amt =
        je.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      totalAllAmount += amt;
      if (je.isPosted) {
        posted++;
        postedAmount += amt;
      } else {
        draft++;
        draftAmount += amt;
      }
    });

    return {
      all: journalEntries.length,
      posted,
      draft,
      totalAllAmount,
      postedAmount,
      draftAmount,
    };
  }, [journalEntries]);

  const totalAmountInView = useMemo(() => {
    return filtered.reduce((sum: number, je: any) => {
      const entryTotal =
        je.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      return sum + entryTotal;
    }, 0);
  }, [filtered]);

  const handleExportCsv = () => {
    if (!filtered.length) return;
    const headers = [
      "Serial Number",
      "Status",
      "Date",
      "Reference",
      "Notes",
      "Total AED",
    ];
    const rows = filtered.map((e: any) => {
      const total =
        e.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
      return [
        formatJournalSerial(e.entryNumber),
        e.isPosted ? "POSTED" : "DRAFT",
        new Date(e.entryDate).toISOString().split("T")[0],
        `"${e.reference || ""}"`,
        `"${e.description || ""}"`,
        total.toFixed(2),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Journal_Entries_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER (MATCHING FIXED ASSETS & COA)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div>
          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            Journal Entries
          </h1>
          <p className="text-[11.5px] font-normal text-slate-500 mt-0.5">
            General ledger journal vouchers, double-entry audit trail, and posted accounting movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!filtered.length}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries/new")}
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Journal</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH & FILTER BOX
          ========================================================================= */}
      <div
        className="rounded-xl p-3 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2.5">
          {/* Search Input */}
          <div className="flex-1">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search serial number, reference, notes, or account..."
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    router.replace("/finance/journal-entries");
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Select */}
          <div className="w-full md:w-52">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              STATUS
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All statuses ({metrics.all})</option>
              <option value="POSTED">Posted ({metrics.posted})</option>
              <option value="DRAFT">Drafts ({metrics.draft})</option>
            </select>
          </div>

          {/* Search & Refresh Buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="flex-1 md:flex-initial justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                router.replace("/finance/journal-entries");
                refetch();
              }}
              disabled={isFetching}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Reset & Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS (LIGHT COLOR + CLEAR BORDERS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Total Journals (Soft Slate-Blue) */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer"
          style={{
            backgroundColor: "#f1f5f9",
            border:
              statusFilter === "ALL"
                ? "1.5px solid #1d4ed8"
                : "1px solid #cbd5e1",
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
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL JOURNALS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
              {metrics.all}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              {formatAed(metrics.totalAllAmount)}
            </span>
          </div>
        </button>

        {/* Card 2: Posted Vouchers (Soft Mint/Green) */}
        <button
          type="button"
          onClick={() => setStatusFilter("POSTED")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer"
          style={{
            backgroundColor: "#f0fdf4",
            border:
              statusFilter === "POSTED"
                ? "1.5px solid #1d4ed8"
                : "1px solid #86efac",
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
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              POSTED VOUCHERS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
              {metrics.posted}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              {formatAed(metrics.postedAmount)}
            </span>
          </div>
        </button>

        {/* Card 3: Draft Vouchers (Soft Warm Yellow/Amber) */}
        <button
          type="button"
          onClick={() => setStatusFilter("DRAFT")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer"
          style={{
            backgroundColor: "#fefce8",
            border:
              statusFilter === "DRAFT"
                ? "1.5px solid #1d4ed8"
                : "1px solid #fde047",
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
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              DRAFT VOUCHERS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
              {metrics.draft}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              {formatAed(metrics.draftAmount)}
            </span>
          </div>
        </button>

        {/* Card 4: Filtered Turnover (Soft Rose/Pink) */}
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
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL TURNOVER
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totalAmountInView)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              Double-entry balanced
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. JOURNAL RECORDS TABLE WITH SOFT LIGHT-BLUE HEADER BAR
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
            Journal records
          </h3>
          <span className="text-[11px] text-slate-500 font-normal">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[860px] text-left text-xs border-collapse select-none">
            <thead>
              <tr
                className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <th className="py-2.5 px-4 w-36 whitespace-nowrap">VOUCHER / DATE</th>
                <th className="py-2.5 px-4 w-56 whitespace-nowrap">REFERENCE / NOTES</th>
                <th className="py-2.5 px-4 whitespace-nowrap">JOURNAL LINES PREVIEW</th>
                <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap">TOTAL AED</th>
                <th className="py-2.5 px-4 w-36 whitespace-nowrap">STATUS / BY</th>
                <th className="py-2.5 px-4 text-right w-20 whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="text-xs font-normal">Loading journal records...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1 max-w-sm mx-auto">
                      <BookOpen className="w-7 h-7 text-slate-300 mb-1" />
                      <h4 className="font-medium text-slate-700 text-xs">
                        No journal records found
                      </h4>
                      <p className="text-[11px] font-normal text-slate-400">
                        {search.trim() || statusFilter !== "ALL"
                          ? "Try adjusting your search or status filter."
                          : "Click '+ Add Journal' to create your first journal voucher."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry: any) => {
                  const total =
                    entry.lines?.reduce(
                      (s: number, l: any) => s + Number(l.debit || 0),
                      0
                    ) || 0;
                  const shortSerial = formatJournalSerial(entry.entryNumber);
                  const formattedDate = new Date(entry.entryDate)
                    .toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .replace(/ /g, "-");
                  const refText =
                    entry.reference ||
                    entry.lines?.find((l: any) => l.costCenter || l.invoiceNumber)
                      ?.costCenter ||
                    entry.lines?.find((l: any) => l.costCenter || l.invoiceNumber)
                      ?.invoiceNumber ||
                    "-";

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* 1. VOUCHER / DATE */}
                      <td className="py-2.5 px-4 align-top whitespace-nowrap">
                        <div
                          className="font-mono font-medium text-xs uppercase"
                          style={{ color: "#1d4ed8" }}
                        >
                          {shortSerial}
                        </div>
                        <div className="text-slate-400 text-[10.5px] font-normal mt-0.5">
                          {formattedDate}
                        </div>
                      </td>

                      {/* 2. REFERENCE / NOTES */}
                      <td className="py-2.5 px-4 align-top max-w-[240px]">
                        <div
                          className="font-normal text-slate-800 text-xs truncate"
                          title={refText}
                        >
                          {refText}
                        </div>
                        <div
                          className="text-slate-500 text-[11px] font-normal truncate mt-0.5"
                          title={entry.description}
                        >
                          {entry.description || "Manual journal entry"}
                        </div>
                      </td>

                      {/* 3. JOURNAL LINES PREVIEW */}
                      <td className="py-2.5 px-4 align-top min-w-0">
                        <div className="space-y-1">
                          {entry.lines?.slice(0, 3).map((line: any, lIdx: number) => {
                            const isDr = Number(line.debit) > 0;
                            const amt = isDr ? line.debit : line.credit;
                            return (
                              <div
                                key={line.id || lIdx}
                                className="flex items-center gap-1.5 min-w-0"
                              >
                                <span
                                  style={
                                    isDr
                                      ? {
                                          backgroundColor: "#eff6ff",
                                          color: "#1d4ed8",
                                          border: "1px solid #93c5fd",
                                        }
                                      : {
                                          backgroundColor: "#fefce8",
                                          color: "#a16207",
                                          border: "1px solid #fde047",
                                        }
                                  }
                                  className="w-6 text-center text-[9.5px] font-medium font-mono px-1 py-0.2 rounded shrink-0"
                                >
                                  {isDr ? "Dr" : "Cr"}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                  }}
                                  className="px-2 py-0.2 rounded text-slate-700 text-[11px] font-normal truncate max-w-[230px]"
                                  title={`${line.account?.accountCode} - ${line.account?.accountName}`}
                                >
                                  {line.account?.accountCode} - {line.account?.accountName}
                                </span>
                                <span className="font-mono text-slate-600 ml-auto font-normal text-[11px] tabular-nums shrink-0">
                                  {Number(amt).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            );
                          })}
                          {entry.lines?.length > 3 && (
                            <div className="text-[10.5px] text-slate-400 font-normal">
                              + {entry.lines.length - 3} more account lines...
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. TOTAL AED */}
                      <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">
                          {formatAed(total)}
                        </div>
                        <div className="text-[10.5px] font-normal text-slate-400 mt-0.5">
                          {entry.lines?.length || 0} lines
                        </div>
                      </td>

                      {/* 5. STATUS / CREATED BY */}
                      <td className="py-2.5 px-4 align-top whitespace-nowrap">
                        <div>
                          {entry.isPosted ? (
                            <span
                              style={{
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                              }}
                              className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide"
                            >
                              POSTED
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fde68a",
                              }}
                              className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide"
                            >
                              DRAFT
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[10.5px] font-normal text-slate-500 mt-1 truncate max-w-[130px]"
                          title={entry.user?.fullName}
                        >
                          {entry.user?.fullName || "Accountant"}
                        </div>
                      </td>

                      {/* 6. ACTIONS */}
                      <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                        <div
                          className="inline-flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Journal Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination & Bottom Summary Bar */}
        <div
          className="px-4 py-2.5 text-[11px] text-slate-500 font-normal flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            backgroundColor: "#f4f7fb",
            borderTop: "1px solid #cbd5e1",
          }}
        >
          {/* Left: Showing range & Rows per page */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 w-full sm:w-auto">
            <span>
              Showing{" "}
              <span className="text-slate-800 font-medium">{startIndex}</span> to{" "}
              <span className="text-slate-800 font-medium">{endIndex}</span> of{" "}
              <span className="text-slate-800 font-medium">{filtered.length}</span>{" "}
              records
            </span>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10.5px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
                className="rounded-lg px-2 py-1 text-[11px] font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span className="text-slate-300 hidden md:inline">•</span>

            <span className="hidden md:inline">
              Turnover:{" "}
              <span className="font-medium" style={{ color: "#1d4ed8" }}>
                {formatAed(totalAmountInView)}
              </span>
            </span>
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              style={{
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
              }}
              className="h-7 px-2.5 rounded-lg text-[11px] font-normal text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - safeCurrentPage) <= 1;
                })
                .reduce<Array<number | string>>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-[11px] text-slate-400 select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(Number(item))}
                      style={
                        safeCurrentPage === item
                          ? {
                              backgroundColor: "#1d4ed8",
                              color: "#ffffff",
                              border: "1px solid #1e40af",
                            }
                          : {
                              backgroundColor: "#ffffff",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                            }
                      }
                      className="h-7 min-w-[28px] px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center"
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              style={{
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
              }}
              className="h-7 px-2.5 rounded-lg text-[11px] font-normal text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-normal text-slate-400">
          Loading journal entries...
        </div>
      }
    >
      <ManualJournalsContent />
    </Suspense>
  );
}
