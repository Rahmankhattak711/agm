"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, SparklesIcon } from "@/components/icons";

interface ReportItem {
  id: string;
  name: string;
  path: string;
  tags?: string[];
  isNew?: boolean;
}

interface ReportCategory {
  title: string;
  items: ReportItem[];
}

export default function ReportsDirectoryHubPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const leftColumnCategories: ReportCategory[] = [
    {
      title: "Financial Statements",
      items: [
        {
          id: "pnl",
          name: "Profit and Loss",
          path: "/finance/reports/profit-and-loss",
          tags: ["By Branch", "By Cost Center", "By Project"],
        },
        {
          id: "cf",
          name: "Cash Flow",
          path: "/finance/reports/cash-flow",
        },
        {
          id: "cf-ind",
          name: "Cash Flow – Indirect Method",
          path: "/finance/reports/cash-flow",
        },
        {
          id: "bs",
          name: "Balance Sheet",
          path: "/finance/reports/balance-sheet",
          tags: ["By Branch", "By Project"],
        },
        {
          id: "c-forecast",
          name: "Cash Forecast",
          path: "/finance/reports/cash-flow",
        },
        {
          id: "mgt-pdf",
          name: "Management Reports PDF",
          path: "/finance/reports",
        },
      ],
    },
    {
      title: "Consolidated Financial Statements",
      items: [
        {
          id: "cpnl",
          name: "Consolidated P&L",
          path: "/finance/reports/profit-and-loss",
        },
        {
          id: "ccf",
          name: "Consolidated Cash Flow",
          path: "/finance/reports/cash-flow",
        },
        {
          id: "cbs",
          name: "Consolidated Balance Sheet",
          path: "/finance/reports/balance-sheet",
        },
        {
          id: "elim",
          name: "Eliminations ledger",
          path: "/finance/general-ledger",
        },
      ],
    },
  ];

  const rightColumnCategories: ReportCategory[] = [
    {
      title: "For Accountants",
      items: [
        {
          id: "tb",
          name: "Trial Balance",
          path: "/finance/reports/trial-balance",
        },
        {
          id: "soa",
          name: "Statement of Account",
          path: "/finance/reports?tab=statement-of-account",
          tags: ["Summary", "Details"],
        },
        {
          id: "gl",
          name: "General Ledger",
          path: "/finance/general-ledger",
        },
        {
          id: "audit",
          name: "Audit trail",
          path: "/finance/journal-entries",
        },
        {
          id: "bank-rec",
          name: "Bank Reconciliation Report",
          path: "/finance/accounts",
        },
        {
          id: "fcr",
          name: "Foreign Currency Revaluation",
          path: "/finance/accounts",
        },
      ],
    },
    {
      title: "Tax",
      items: [
        {
          id: "vat",
          name: "VAT",
          path: "/finance/reports/vat",
        },
        {
          id: "tax-report",
          name: "Tax Report",
          path: "/finance/reports/tax-report",
          tags: ["Summary", "Details"],
        },
        {
          id: "corp-tax",
          name: "Corporate Tax – Taxable Income",
          path: "/finance/reports/corporate-tax",
        },
      ],
    },
  ];

  const renderCategory = (cat: ReportCategory) => {
    const filteredItems = cat.items.filter(
      (item) =>
        search.trim() === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()),
    );

    if (filteredItems.length === 0) return null;

    return (
      <div key={cat.title} className="space-y-1">
        <h2 className="text-sm font-bold text-slate-900 pb-1 mb-2 tracking-tight">
          {cat.title}
        </h2>
        <div className="space-y-0.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(item.path)}
              className="flex justify-between items-center py-1.5 px-2.5 -mx-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#5e48e8] transition-colors">
                  {item.name}
                </span>
                {item.isNew && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#5e48e8]/10 text-[#5e48e8] uppercase">
                    New
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
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
                    className="text-[11px] px-2 py-0.5 rounded bg-[#f1f2f4] text-slate-600 font-medium hover:bg-[#5e48e8]/10 hover:text-[#5e48e8] transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-white text-slate-900 px-8 py-6 max-w-[1350px] mx-auto space-y-4">
      {/* 1. Sleek Top Header matching Wafeq Screenshot exactly */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reports
        </h1>

        <button
          type="button"
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </div>

      {/* 2. Search Input with subtle dashed separator line */}
      <div className="border-b border-dashed border-slate-200/90 pb-4">
        <div className="relative max-w-sm">
          <SearchIcon className="w-4 h-4 absolute left-0.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* 3. Two-Column Category Layout matching Wafeq Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 pt-2">
        {/* Left Column: Financial Statements + Consolidated Financial Statements */}
        <div className="space-y-10">
          {leftColumnCategories.map((cat) => renderCategory(cat))}
        </div>

        {/* Right Column: For Accountants + Tax */}
        <div className="space-y-10">
          {rightColumnCategories.map((cat) => renderCategory(cat))}
        </div>
      </div>
    </div>
  );
}
