"use client";

import React from "react";
import { SearchIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

const STATUS_TABS = [
  { id: "ALL", label: "All Returns" },
  { id: "DRAFT", label: "Draft" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "APPROVED", label: "Approved" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
];

interface PurchaseReturnsFiltersProps {
  statusFilter: string;
  onStatusFilter: (status: string) => void;
  search: string;
  onSearch: (value: string) => void;
  count: number;
}

const PurchaseReturnsFilters: React.FC<PurchaseReturnsFiltersProps> = ({
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  count,
}) => {
  return (
    <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

        <span className="text-[11px] font-bold text-slate-500 font-mono">
          {count} Vouchers Listed
        </span>
      </div>

      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
        <Input
          leftIcon={<SearchIcon size={14} className="text-slate-400" />}
          placeholder="Search return #, PO reference, vendor, reason..."
          containerClassName="w-full sm:w-80"
          className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

export default PurchaseReturnsFilters;
