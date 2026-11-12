"use client";

import React from "react";
import { Search } from "lucide-react";

export interface SalesInvoiceFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  totalCount: number;
}

const TABS = [
  { id: "ALL", label: "All Invoices" },
  { id: "POSTED", label: "Posted to GL" },
  { id: "PARTIALLY_PAID", label: "Partially Paid" },
  { id: "PAID", label: "Fully Paid" },
  { id: "DRAFT", label: "Drafts" },
];

export const SalesInvoiceFilters: React.FC<SalesInvoiceFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  totalCount,
}) => {
  return (
    <div
      className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
      style={{
        backgroundColor: "#f4f7fb",
        border: "1px solid #cbd5e1",
      }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1d4ed8] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-[#cbd5e1] hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search invoice #, client, TRN, project..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
          />
        </div>
        <span className="text-xs text-slate-500 font-normal whitespace-nowrap hidden sm:inline">
          Total: <strong className="text-slate-800">{totalCount}</strong>
        </span>
      </div>
    </div>
  );
};

export default SalesInvoiceFilters;
