"use client";

import { SearchIcon, LockIcon } from "@/components/icons";
import { Button, Input, Select } from "@/components/ui";

interface AccountsFilterToolbarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  search: string;
  setSearch: (query: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  totalDisplayed: number;
}

export function AccountsFilterToolbar({
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  selectedType,
  setSelectedType,
  totalDisplayed,
}: AccountsFilterToolbarProps) {
  const statusTabs = [
    { id: "ALL", label: "All Statuses" },
    { id: "ACTIVE", label: "Active Accounts" },
    { id: "INACTIVE", label: "Archived Accounts" },
    { id: "SYSTEM", label: "System Accounts", hasLock: true },
  ];

  return (
    <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                isActive
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span>{tab.label}</span>
              {tab.hasLock && (
                <LockIcon
                  size={12}
                  className={isActive ? "text-emerald-700" : "text-slate-400"}
                />
              )}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1 border-t border-slate-200/60">
        <Input
          leftIcon={<SearchIcon size={14} className="text-slate-400" />}
          placeholder="Search account code, title, or parent..."
          containerClassName="w-full sm:w-80"
          className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-bold text-slate-500 font-mono">
            {totalDisplayed} Accounts Displayed
          </span>

          <Select
            containerClassName="w-full sm:w-48"
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="ASSET">Assets (1000s)</option>
            <option value="LIABILITY">Liabilities (2000s)</option>
            <option value="EQUITY">Equity (3000s)</option>
            <option value="REVENUE">Revenue (4000s)</option>
            <option value="EXPENSE">Expenses (5000s)</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
