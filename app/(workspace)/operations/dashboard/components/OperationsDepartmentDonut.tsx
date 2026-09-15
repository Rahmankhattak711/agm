"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

interface DepartmentDistributionItem {
  name: string;
  count: number;
}

interface OperationsDepartmentDonutProps {
  departments: DepartmentDistributionItem[];
  totalEmployees: number;
}

const PALETTE = [
  "#344b60",
  "#28633a",
  "#d97706",
  "#4f46e5",
  "#0284c7",
  "#e11d48",
  "#657484",
  "#059669",
];

export default function OperationsDepartmentDonut({
  departments,
  totalEmployees,
}: OperationsDepartmentDonutProps) {
  const hasData =
    departments.length > 0 && departments.some((d) => d.count > 0);

  const donutData: ChartData<"doughnut"> = useMemo(() => {
    return {
      labels: departments.map((d) => d.name),
      datasets: [
        {
          data: departments.map((d) => d.count),
          backgroundColor: PALETTE.slice(0, departments.length),
          borderWidth: 0,
        },
      ],
    };
  }, [departments]);

  const donutOptions: ChartOptions<"doughnut"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#263b4d",
          padding: 8,
          cornerRadius: 6,
          titleFont: { family: "'Inter', sans-serif", size: 11, weight: 500 },
          bodyFont: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw || 0);
              const pct =
                totalEmployees > 0
                  ? ((val / totalEmployees) * 100).toFixed(0)
                  : 0;
              return ` ${ctx.label}: ${val} staff (${pct}%)`;
            },
          },
        },
      },
    };
  }, [totalEmployees]);

  return (
    <div className="p-5 bg-[#ffffff] border border-agm-box-border rounded-[12px] space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-agm-text">
          Workforce by department
        </h3>
      </div>

      <div className="relative h-[180px] w-full flex items-center justify-center">
        {hasData ? (
          <>
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-medium text-agm-text">
                {totalEmployees}
              </span>
              <span className="text-[11px] font-normal text-agm-muted">
                Total Staff
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-agm-muted">
            No department data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-agm-box-border">
        {departments.slice(0, 4).map((dept, i) => (
          <div key={dept.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <div className="min-w-0 flex-1 flex items-center justify-between text-xs">
              <span className="text-agm-muted truncate">{dept.name}</span>
              <span className="font-medium text-agm-text ml-1">
                {dept.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
