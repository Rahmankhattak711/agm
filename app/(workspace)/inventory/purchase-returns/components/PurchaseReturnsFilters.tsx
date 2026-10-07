"use client";

import React from "react";
import { FilterBar } from "@/components/ui";

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
    <FilterBar
      tabs={STATUS_TABS}
      activeTab={statusFilter}
      onTabChange={onStatusFilter}
      search={search}
      onSearchChange={onSearch}
      searchPlaceholder="Search return #, PO reference, vendor, reason..."
      totalCount={count}
      countLabel="Vouchers Listed"
    />
  );
};

export default PurchaseReturnsFilters;
