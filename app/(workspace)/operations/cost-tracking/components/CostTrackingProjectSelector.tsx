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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
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
          className="text-xs font-bold text-slate-800 bg-slate-50"
        />
      </div>
    </div>
  );
}
