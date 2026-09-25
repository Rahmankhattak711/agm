import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { fmt } from "../types";

interface ProjectsKPIsProps {
  stats: {
    total: number;
    active: number;
    done: number;
    bud: number;
    ac: number;
    balance: number;
    balancePct: number;
  };
}

export function ProjectsKPIs({ stats }: ProjectsKPIsProps) {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Active Projects"
        value={stats.active}
        subtitle={`${stats.done} completed · ${stats.total} total`}
        variant="success"
      />
      <DashboardCard
        title="Total Budget"
        value={`AED ${fmt(stats.bud)}`}
        subtitle="Allocated project budget"
        variant="default"
      />
      <DashboardCard
        title="Total Cost Spent"
        value={`AED ${fmt(stats.ac)}`}
        subtitle={`Remaining: AED ${fmt(Math.max(0, stats.balance))}`}
        variant={stats.ac > stats.bud && stats.bud > 0 ? "danger" : "default"}
      />
      <DashboardCard
        title="Budget Balance"
        value={`AED ${fmt(stats.balance)}`}
        subtitle={stats.bud > 0 ? `${stats.balancePct}% available` : "0%"}
        variant={stats.balance >= 0 ? "success" : "danger"}
      />
    </DashboardCardGrid>
  );
}
