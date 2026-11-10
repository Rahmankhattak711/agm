"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileSpreadsheet,
  Scale,
  BookOpen,
  Receipt,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Percent,
  CheckCircle2,
} from "lucide-react";

interface ReportItem {
  id: string;
  name: string;
  path: string;
  tags?: string[];
  badge?: string;
}

interface ReportCategory {
  id: string;
  title: string;
  headerBg: string;
  headerBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ReportItem[];
}

export default function ReportsDirectoryHubPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");

  const categories: ReportCategory[] = useMemo(
    () => [
      {
        id: "financial-statements",
        title: "Financial Statements",
        headerBg: "#f0f7ff",
        headerBorder: "#dbeafe",
        iconBg: "#dbeafe",
        iconColor: "#1d4ed8",
        icon: TrendingUp,
        items: [
          {
            id: "pnl",
            name: "Profit and Loss Statement",
            path: "/finance/reports/profit-and-loss",
            tags: ["By Branch", "By Cost Center", "By Project"],
            badge: "Live P&L",
          },
          {
            id: "bs",
            name: "Balance Sheet",
            path: "/finance/reports/balance-sheet",
            tags: ["By Branch", "By Project"],
            badge: "A = L + E",
          },
          {
            id: "cf",
            name: "Statement of Cash Flows",
            path: "/finance/reports/cash-flow",
          },
          {
            id: "cf-ind",
            name: "Cash Flow – Indirect Method",
            path: "/finance/reports/cash-flow",
          },
          {
            id: "c-forecast",
            name: "Cash Position & Forecast",
            path: "/finance/reports/cash-flow",
          },
        ],
      },
      {
        id: "accountant-ledgers",
        title: "For Accountants & Audit",
        headerBg: "#f0fdf4",
        headerBorder: "#dcfce7",
        iconBg: "#dcfce7",
        iconColor: "#15803d",
        icon: Scale,
        items: [
          {
            id: "tb",
            name: "Trial Balance",
            path: "/finance/reports/trial-balance",
            badge: "Balanced",
          },
          {
            id: "gl",
            name: "General Ledger",
            path: "/finance/general-ledger",
          },
          {
            id: "audit",
            name: "Journal Vouchers & Audit Trail",
            path: "/finance/journal-entries",
          },
          {
            id: "soa",
            name: "Statement of Account (SOA)",
            path: "/finance/reports?tab=statement-of-account",
            tags: ["Summary", "Details"],
          },
          {
            id: "yec",
            name: "Fiscal Year-End Closing",
            path: "/finance/reports/year-end-closing",
          },
          {
            id: "coa",
            name: "Chart of Accounts",
            path: "/finance/accounts",
          },
        ],
      },
      {
        id: "tax-compliance",
        title: "UAE FTA VAT & Corporate Tax",
        headerBg: "#fffbeb",
        headerBorder: "#fef3c7",
        iconBg: "#fef9c3",
        iconColor: "#a16207",
        icon: Percent,
        items: [
          {
            id: "vat",
            name: "UAE VAT Return (FTA Form 201)",
            path: "/finance/reports/vat",
            badge: "FTA 201",
          },
          {
            id: "tax-report",
            name: "Tax Report (VAT Register)",
            path: "/finance/reports/tax-report",
            tags: ["Summary", "Details"],
          },
          {
            id: "corp-tax",
            name: "Corporate Tax – Taxable Income (9%)",
            path: "/finance/reports/corporate-tax",
            badge: "9% CT",
          },
        ],
      },
      {
        id: "consolidated",
        title: "Consolidated Statements",
        headerBg: "#fff1f2",
        headerBorder: "#ffe4e6",
        iconBg: "#ffe4e6",
        iconColor: "#be123c",
        icon: Layers,
        items: [
          {
            id: "cpnl",
            name: "Consolidated Profit & Loss",
            path: "/finance/reports/profit-and-loss",
          },
          {
            id: "cbs",
            name: "Consolidated Balance Sheet",
            path: "/finance/reports/balance-sheet",
          },
          {
            id: "ccf",
            name: "Consolidated Cash Flow",
            path: "/finance/reports/cash-flow",
          },
          {
            id: "elim",
            name: "Eliminations & Inter-Branch Ledger",
            path: "/finance/general-ledger",
          },
        ],
      },
    ],
    []
  );

  const totalReportsCount = useMemo(
    () => categories.reduce((sum, c) => sum + c.items.length, 0),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .filter((c) => activeCategoryFilter === "ALL" || c.id === activeCategoryFilter)
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            item.tags?.some((t) => t.toLowerCase().includes(q))
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, search, activeCategoryFilter]);

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            Financial Reports
          </h1>
          <span
            className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            {totalReportsCount} reports
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => router.push("/finance/reports/trial-balance")}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>Trial Balance</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/finance/reports/profit-and-loss")}
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Profit &amp; Loss</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH & CATEGORY FILTER BAR
          ========================================================================= */}
      <div
        className="rounded-xl p-3"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2.5">
          {/* Search Input */}
          <div className="flex-1">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH REPORTS
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Profit & Loss, Balance Sheet, Trial Balance, VAT 201..."
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Select */}
          <div className="w-full md:w-60">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              REPORT CATEGORY
            </label>
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Report Categories ({totalReportsCount})</option>
              <option value="financial-statements">Financial Statements (5)</option>
              <option value="accountant-ledgers">For Accountants &amp; Audit (6)</option>
              <option value="tax-compliance">UAE FTA VAT &amp; Corporate Tax (3)</option>
              <option value="consolidated">Consolidated Statements (4)</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS (QUICK REPORT SHORTCUTS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Profit & Loss */}
        <button
          type="button"
          onClick={() => router.push("/finance/reports/profit-and-loss")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer hover:opacity-95"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffffff",
              color: "#1d4ed8",
              border: "1px solid #cbd5e1",
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              INCOME STATEMENT
            </span>
            <span className="text-sm font-semibold text-slate-800 leading-snug block truncate">
              Profit &amp; Loss
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Card 2: Balance Sheet */}
        <button
          type="button"
          onClick={() => router.push("/finance/reports/balance-sheet")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer hover:opacity-95"
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
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              FINANCIAL POSITION
            </span>
            <span className="text-sm font-semibold text-slate-800 leading-snug block truncate">
              Balance Sheet
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        </button>

        {/* Card 3: Trial Balance */}
        <button
          type="button"
          onClick={() => router.push("/finance/reports/trial-balance")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer hover:opacity-95"
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
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              ACCOUNTANT VERIFICATION
            </span>
            <span className="text-sm font-semibold text-slate-800 leading-snug block truncate">
              Trial Balance
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        </button>

        {/* Card 4: UAE VAT Return 201 */}
        <button
          type="button"
          onClick={() => router.push("/finance/reports/vat")}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left transition-all cursor-pointer hover:opacity-95"
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
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              STATUTORY FILING
            </span>
            <span className="text-sm font-semibold text-slate-800 leading-snug block truncate">
              UAE VAT 201 &amp; Tax
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        </button>
      </div>

      {/* =========================================================================
          4. TWO-COLUMN BORDERED CATEGORY CARDS WITH PASTEL HEADERS
          ========================================================================= */}
      {filteredCategories.length === 0 ? (
        <div
          className="bg-white rounded-xl py-12 text-center text-slate-400"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
          <h4 className="font-medium text-slate-700 text-xs">
            No matching reports found
          </h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {filteredCategories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                style={{ border: "1px solid #cbd5e1" }}
              >
                {/* Pastel Section Header */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: cat.headerBg,
                    borderBottom: `1px solid ${cat.headerBorder}`,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: cat.iconBg,
                        color: cat.iconColor,
                      }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-slate-800 truncate">
                      {cat.title}
                    </h2>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-normal shrink-0"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {cat.items.length}
                  </span>
                </div>

                {/* Report Rows (Main Text Only) */}
                <div className="divide-y divide-slate-100">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(item.path)}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-medium text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className="text-[9.5px] font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {item.tags?.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (t.toLowerCase() === "summary")
                                router.push(`${item.path}?mode=summary`);
                              else if (t.toLowerCase() === "details")
                                router.push(`${item.path}?mode=details`);
                              else if (t.toLowerCase() === "by branch")
                                router.push(`${item.path}?groupBy=branch`);
                              else if (t.toLowerCase() === "by cost center")
                                router.push(`${item.path}?groupBy=cost-center`);
                              else if (t.toLowerCase() === "by project")
                                router.push(`${item.path}?groupBy=project`);
                              else router.push(item.path);
                            }}
                            style={{
                              backgroundColor: "#f8fafc",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md font-normal hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {t}
                          </button>
                        ))}
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
