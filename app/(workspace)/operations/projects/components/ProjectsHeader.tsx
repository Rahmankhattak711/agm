import React from "react";
import { Button } from "@/components/ui";
import { LineChartIcon, PlusIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

interface ProjectsHeaderProps {
  onNewProject: () => void;
}

export function ProjectsHeader({ onNewProject }: ProjectsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-agm-box-border pb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Projects
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage active site projects, costs and team progress.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.push("/operations/cost-tracking")}
          icon={<LineChartIcon size={14} className="text-agm-green" />}
          className="cursor-pointer"
        >
          Cost Tracking
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onNewProject}
          icon={<PlusIcon size={14} />}
          className="cursor-pointer"
        >
          New Project
        </Button>
      </div>
    </div>
  );
}
