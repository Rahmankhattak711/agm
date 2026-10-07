"use client";

import React from "react";
import { FilterBar } from "@/components/ui";

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
    <FilterBar
      tabs={TABS}
      activeTab={statusFilter}
      onTabChange={onStatusFilterChange}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search invoice number, client, TRN, project..."
      totalCount={totalCount}
      countLabel="Invoices Listed"
    />
  );
};

export default SalesInvoiceFilters;
