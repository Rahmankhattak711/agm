import React from "react";
import { Project } from "@/lib/hooks/api-hooks";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { fmt } from "../types";

interface CostTrackingMetricsProps {
  selectedProject: Project | null;
  reportData: {
    budget: number;
    totalSpent: number;
    remaining: number;
    isUnderBudget: boolean;
  };
}

export function CostTrackingMetrics({
  selectedProject,
  reportData,
}: CostTrackingMetricsProps) {
  return (
    <DashboardCardGrid cols={3}>
      <DashboardCard
        title="Allocated Budget"
        value={`AED ${fmt(reportData.budget)}`}
        subtitle={
          selectedProject ? `Approved for ${selectedProject.name}` : undefined
        }
        variant="neutral"
      />
      <DashboardCard
        title="Total Cost Spent"
        value={`AED ${fmt(reportData.totalSpent)}`}
        subtitle={`${selectedProject?.costs?.length || 0} expenses recorded`}
        variant="default"
      />
      <DashboardCard
        title={reportData.isUnderBudget ? "Budget Balance" : "Budget Overrun"}
        value={`AED ${fmt(Math.abs(reportData.remaining))}`}
        subtitle={
          reportData.isUnderBudget
            ? "Remaining within budget"
            : "Exceeded approved budget"
        }
        variant={reportData.isUnderBudget ? "success" : "danger"}
      />
    </DashboardCardGrid>
  );
}
