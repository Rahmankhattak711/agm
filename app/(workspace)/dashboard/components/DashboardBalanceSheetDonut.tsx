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
import { formatCurrency } from "@/lib/utils/format";

ChartJS.register(ArcElement, Tooltip);

interface DashboardBalanceSheetDonutProps {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export default function DashboardBalanceSheetDonut({
  totalAssets,
  totalLiabilities,
  totalEquity,
}: DashboardBalanceSheetDonutProps) {
  const hasData = totalAssets > 0 || totalLiabilities > 0 || totalEquity > 0;

  const donutData: ChartData<"doughnut"> = useMemo(() => {
    return {
      labels: ["Assets", "Liabilities", "Equity"],
      datasets: [
        {
          data: hasData
            ? [totalAssets, totalLiabilities, totalEquity]
            : [0, 0, 0],
          backgroundColor: ["#344b60", "#d97706", "#28633a"],
          borderWidth: 0,
        },
      ],
    };
  }, [hasData, totalAssets, totalLiabilities, totalEquity]);

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
            label: (ctx) =>
              ` ${ctx.label}: ${formatCurrency(Number(ctx.raw || 0))}`,
          },
        },
      },
    };
  }, []);

  return (
    <div className="p-5 bg-white border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-4">
      <div>
        <h3 className="text-sm font-medium text-agm-text">
          Balance sheet position
        </h3>
      </div>

      <div className="w-full h-36 relative">
        <Doughnut data={donutData} options={donutOptions} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-agm-box-border text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-agm-muted font-normal">
            <span className="w-2 h-2 rounded-xs bg-agm-navy" />
            <span>Assets</span>
          </div>
          <div className="font-medium text-agm-text mt-0.5">
            {formatCurrency(totalAssets)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-agm-muted font-normal">
            <span className="w-2 h-2 rounded-xs bg-[#d97706]" />
            <span>Liabilities</span>
          </div>
          <div className="font-medium text-agm-text mt-0.5">
            {formatCurrency(totalLiabilities)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-agm-muted font-normal">
            <span className="w-2 h-2 rounded-xs bg-agm-green" />
            <span>Equity</span>
          </div>
          <div className="font-medium text-agm-text mt-0.5">
            {formatCurrency(totalEquity)}
          </div>
        </div>
      </div>
    </div>
  );
}
