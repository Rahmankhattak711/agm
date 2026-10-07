import React from "react";
import { Button, PageHeader } from "@/components/ui";
import { BuildingIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export function CostTrackingHeader() {
  const router = useRouter();

  return (
    <PageHeader
      title="Project Cost Tracking"
      description="Simple, real-time cost tracking report. Add an expense to update category totals instantly."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/operations/projects")}
          className="text-xs font-semibold cursor-pointer bg-agm-green hover:bg-agm-green-2 text-white"
        >
          <BuildingIcon size={14} /> Projects
        </Button>
      }
    />
  );
}
export default CostTrackingHeader;
