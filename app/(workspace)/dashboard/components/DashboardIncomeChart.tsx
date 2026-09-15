"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DashboardIncomeChartProps {
  labels: string[];
  revenueData: number[];
  costData: number[];
}

export default function DashboardIncomeChart({
  labels,
  revenueData,
  costData,
}: DashboardIncomeChartProps) {
  const chartData: ChartData<"bar"> = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "#344b60",
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 18,
          barPercentage: 0.8,
          categoryPercentage: 0.6,
        },
        {
          label: "Operating cost",
          data: costData,
          backgroundColor: "#657484",
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 18,
          barPercentage: 0.8,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [labels, revenueData, costData]);

  const chartOptions: ChartOptions<"bar"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: false,
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          },
        },
        tooltip: {
          backgroundColor: "#263b4d",
          padding: 8,
          cornerRadius: 6,
          titleFont: { family: "'Inter', sans-serif", size: 11, weight: 500 },
          bodyFont: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw || 0);
              return ` ${ctx.dataset.label}: AED ${val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          },
          border: { display: false },
        },
        y: {
          grid: { color: "#dbe2db" },
          ticks: {
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 10, weight: 400 },
            callback: (val) => {
              const num = Number(val);
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
              if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
              return num.toLocaleString();
            },
          },
          border: { display: false },
        },
      },
    };
  }, []);

  return (
    <div className="p-5 bg-white border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-4">
      <div>
        <h3 className="text-sm font-medium text-agm-text">
          Income statement and margins
        </h3>
      </div>

      <div className="w-full h-56 relative">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
