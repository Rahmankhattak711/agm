"use client";

import React from "react";
import { FilterBar } from "@/components/ui";

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
    <FilterBar
      tabs={TABS}
      activeTab={statusFilter}
      onTabChange={onStatusFilterChange}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search quotation number, client, project..."
      totalCount={totalCount}
      countLabel="Proposals Listed"
    />
  );
};

export default QuotationFilters;
