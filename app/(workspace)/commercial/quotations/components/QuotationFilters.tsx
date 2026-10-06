"use client";

import React from "react";
import { Button, Input } from "@/components/ui";
import { SearchIcon, CloseIcon } from "@/components/icons";

export interface QuotationFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  totalCount: number;
}

const TABS = [
  { id: "ALL", label: "All Proposals" },
  { id: "DRAFT", label: "Drafts" },
  { id: "SENT", label: "Sent Quotes" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "REJECTED", label: "Declined" },
];

export const QuotationFilters: React.FC<QuotationFiltersProps> = ({
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
          {totalCount} Proposals Listed
        </span>
      </div>

      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Input
            leftIcon={<SearchIcon size={14} className="text-slate-400" />}
            placeholder="Search quotation number, client, project..."
            containerClassName="w-full"
            className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs pr-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationFilters;
