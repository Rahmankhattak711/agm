import React from "react";
import { Button, PageHeader } from "@/components/ui";
import { LineChartIcon, PlusIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

interface ProjectsHeaderProps {
  onNewProject: () => void;
}

export function ProjectsHeader({ onNewProject }: ProjectsHeaderProps) {
  const router = useRouter();

  return (
    <PageHeader
      title="Projects"
      description="Manage active site projects, costs and team progress."
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/operations/cost-tracking")}
            icon={<LineChartIcon size={14} className="text-agm-green" />}
            className="cursor-pointer font-bold text-xs"
          >
            Cost Tracking
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onNewProject}
            icon={<PlusIcon size={14} />}
            className="cursor-pointer font-bold text-xs bg-agm-green hover:bg-agm-green-2 text-white"
          >
            New Project
          </Button>
        </>
      }
    />
  );
}
export default ProjectsHeader;
