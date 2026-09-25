import React from "react";
import { Button } from "@/components/ui";
import { BuildingIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export function CostTrackingHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-agm-box-border pb-4 print:hidden">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Project Cost Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Simple, real-time cost tracking report. Add an expense to update
          category totals instantly.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={() => router.push("/operations/projects")}
          className="text-xs font-semibold cursor-pointer"
        >
          <BuildingIcon size={14} /> Projects
        </Button>
      </div>
    </div>
  );
}
