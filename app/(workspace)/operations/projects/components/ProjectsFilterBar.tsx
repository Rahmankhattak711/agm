import React from "react";
import { Button, Input } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

interface ProjectsFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  count: number;
}

const TABS = [
  { id: "ALL", label: "All" },
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={statusFilter === t.id ? "primary" : "ghost"}
            onClick={() => onStatusChange(t.id)}
            className="rounded-xl cursor-pointer"
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="flex-1 min-w-[200px]">
        <Input
          leftIcon={<SearchIcon size={13} className="text-slate-400" />}
          placeholder="Search by name, code, customer, location…"
          className="py-1.5 text-xs rounded-xl"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <span className="text-[11px] text-slate-400 font-mono ml-auto">
        {count} projects
      </span>
    </div>
  );
}
