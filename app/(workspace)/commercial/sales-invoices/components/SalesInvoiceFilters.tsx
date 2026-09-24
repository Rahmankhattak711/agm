"use client";

import React from "react";
import { Button, Input } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

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
    <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">
          {totalCount} Invoices Listed
        </span>
      </div>

      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
        <Input
          leftIcon={<SearchIcon size={14} className="text-slate-400" />}
          placeholder="Search invoice number, client, TRN, project..."
          containerClassName="w-full sm:w-80 md:w-96"
          className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SalesInvoiceFilters;
