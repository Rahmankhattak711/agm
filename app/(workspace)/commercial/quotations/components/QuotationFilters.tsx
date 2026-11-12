"use client";

import React from "react";
import { Search } from "lucide-react";

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
}) => {
  return (
    <div
      className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden"
      style={{
        backgroundColor: "#f4f7fb",
        border: "1px solid #cbd5e1",
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search quotation #, client, project..."
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

export default QuotationFilters;
