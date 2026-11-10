"use client";

import React from "react";
import { Search } from "lucide-react";

export const STATUS_TABS = [
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
}) => {
  return (
    <div
      className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
      style={{
        backgroundColor: "#f4f7fb",
        border: "1px solid #cbd5e1",
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilter(tab.id)}
              style={
                isActive
                  ? {
                      backgroundColor: "#1d4ed8",
                      color: "#ffffff",
                      borderColor: "#1d4ed8",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      borderColor: "#cbd5e1",
                    }
              }
              className="px-2.5 py-1 text-xs font-normal rounded-lg border transition-all cursor-pointer"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search return #, PO reference, vendor, reason..."
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
          }}
          className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
        />
      </div>
    </div>
  );
};

export default PurchaseReturnsFilters;
