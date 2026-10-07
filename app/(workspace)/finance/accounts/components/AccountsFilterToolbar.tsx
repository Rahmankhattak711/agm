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
    { id: "SYSTEM", label: "System Accounts" },
  ];

  return (
    <FilterBar
      tabs={statusTabs}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search account code, title, or parent..."
      totalCount={totalDisplayed}
      countLabel="Accounts Displayed"
      rightAction={
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
      }
    />
  );
}
export default AccountsFilterToolbar;
