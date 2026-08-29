"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
);

export interface BarChartItem {
  label: string;
  value: number;
  color: string;
  gradient?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function BarChart({
  data = [],
  title,
  subtitle,
  height = 175,
  formatValue = (v) =>
    `AED ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
}: BarChartProps) {
  const chartData: ChartData<"bar"> = useMemo(() => {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);
    const backgroundColors = data.map((d) => d.color);

    return {
      labels,
      datasets: [
        {
          label: "Amount (AED)",
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34,
          barPercentage: 0.5,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<"bar"> = useMemo(() => {
    const minVal = Math.min(...data.map((d) => d.value), 0);
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 650,
        easing: "easeOutQuart",
      },
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
          displayColors: true,
          boxPadding: 4,
          titleFont: {
            size: 11,
            weight: "bold",
          },
          bodyFont: {
            size: 12,
            weight: "bold",
          },
          callbacks: {
            label: (context) => {
              const val = context.parsed.y ?? context.raw ?? 0;
              return ` ${formatValue(Number(val))}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#475569",
            font: {
              size: 11,
              weight: "bold",
            },
            padding: 4,
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: minVal >= 0,
          grid: {
            color: "rgba(226, 232, 240, 0.75)",
          },
          ticks: {
            color: "#94a3b8",
            font: {
              size: 10,
            },
            padding: 4,
            callback: (val) => {
              const num = Number(val);
              if (Math.abs(num) >= 1_000_000)
                return `${(num / 1_000_000).toFixed(1)}M`;
              if (Math.abs(num) >= 1_000)
                return `${(num / 1_000).toFixed(0)}k`;
              return num.toLocaleString();
            },
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [data, formatValue]);

  return (
    <div className="flex flex-col space-y-3 w-full">
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-bold text-sm text-slate-900">{title}</h3>}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div
        className="w-full relative bg-slate-50/40 rounded-xl p-2 border border-slate-100/90 overflow-hidden"
        style={{ height }}
      >
        <Bar data={chartData} options={options} />
      </div>

      {/* Clean Bottom Breakdown Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {item.label}
              </span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-[11px] shrink-0 ml-1.5">
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
