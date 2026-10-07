import React from "react";
import { FilterBar } from "@/components/ui";

interface ProjectsFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  count: number;
}

const TABS = [
  { id: "ALL", label: "All Projects" },
  { id: "PLANNING", label: "Planning" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "COMPLETED", label: "Completed" },
];

export function ProjectsFilterBar({
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  count,
}: ProjectsFilterBarProps) {
  return (
    <FilterBar
      tabs={TABS}
      activeTab={statusFilter}
      onTabChange={onStatusChange}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by name, code, customer, location..."
      totalCount={count}
      countLabel="Projects Listed"
    />
  );
}
export default ProjectsFilterBar;
