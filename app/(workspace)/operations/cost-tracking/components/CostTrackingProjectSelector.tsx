import React from "react";
import { Project } from "@/lib/hooks/api-hooks";
import { Select } from "@/components/ui";

interface CostTrackingProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export function CostTrackingProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
}: CostTrackingProjectSelectorProps) {
  return (
    <div className="bg-agm-card rounded-2xl border border-agm-border shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <label className="text-xs font-bold text-agm-text uppercase tracking-wider whitespace-nowrap">
          Select Project:
        </label>
        <Select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          options={projects.map((p) => ({
            value: p.id,
            label: `${p.projectCode} — ${p.name}`,
          }))}
          containerClassName="flex-1"
          className="text-xs font-bold text-agm-text bg-agm-box-bg border-agm-box-border"
        />
      </div>
    </div>
  );
}
