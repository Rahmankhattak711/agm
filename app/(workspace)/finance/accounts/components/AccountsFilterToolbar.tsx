"use client";

import { FilterBar, Select } from "@/components/ui";

interface AccountsFilterToolbarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  search: string;
  setSearch: (query: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  totalDisplayed: number;
  activeDepthLevel?: number | null;
  onSelectDepthLevel?: (level: number) => void;
}

export function AccountsFilterToolbar({
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  selectedType,
  setSelectedType,
  totalDisplayed,
  activeDepthLevel,
  onSelectDepthLevel,
}: AccountsFilterToolbarProps) {
  const statusTabs = [
    { id: "ALL", label: "All Statuses" },
    { id: "ACTIVE", label: "Active Accounts" },
    { id: "INACTIVE", label: "Archived Accounts" },
    { id: "SYSTEM", label: "System Accounts" },
  ];

  return (
    <div className="space-y-3">
      <FilterBar
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search account code or name..."
        totalCount={totalDisplayed}
        countLabel="Accounts"
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            {/* Wafeq-style Depth Level Buttons [ 1 | 2 | 3 | 4 ] */}
            {onSelectDepthLevel && (
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Level:
                </span>
                {[1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onSelectDepthLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-mono font-bold ${
                      activeDepthLevel === lvl
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "hover:bg-slate-200/70 text-slate-700"
                    }`}
                    title={`Expand up to Level ${lvl}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            <Select
              containerClassName="w-full sm:w-44"
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="ASSET">1 - Assets</option>
              <option value="LIABILITY">2 - Liabilities</option>
              <option value="EQUITY">3 - Equity</option>
              <option value="REVENUE">4 - Revenue</option>
              <option value="EXPENSE">5 - Expenses</option>
            </Select>
          </div>
        }
      />
    </div>
  );
}

export default AccountsFilterToolbar;
