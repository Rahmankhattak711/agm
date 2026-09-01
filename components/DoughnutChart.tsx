"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface DoughnutChartItem {
  label: string;
  value: number;
  color: string;
}

export interface DoughnutChartProps {
  data: DoughnutChartItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function DoughnutChart({
  data = [],
  title,
  subtitle,
  height = 180,
  formatValue = (v) =>
    `AED ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
}: DoughnutChartProps) {
  const chartData: ChartData<"doughnut"> = useMemo(() => {
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<"doughnut"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#f8fafc",
          bodyColor: "#38bdf8",
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            label: (context) => {
              const val = Number(context.raw ?? 0);
              return ` ${formatValue(val)}`;
            },
          },
        },
      },
    };
  }, [formatValue]);

  return (
    <div className="flex flex-col justify-between h-full space-y-2">
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      <div
        className="w-full relative flex items-center justify-center"
        style={{ height }}
      >
        <Doughnut data={chartData} options={options} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100 text-xs">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-500 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
