"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export interface ChartBarItem {
  label: string;
  sublabel?: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  secondaryColor?: string;
}

export interface ReportSummaryChartProps {
  title: string;
  subtitle?: string;
  data: ChartBarItem[];
  primaryLegend?: string;
  secondaryLegend?: string;
  formatValue?: (v: number) => string;
  height?: number;
}

export const ReportSummaryChart: React.FC<ReportSummaryChartProps> = ({
  title,
  subtitle,
  data = [],
  primaryLegend = "Total Invoiced",
  secondaryLegend = "Settled / Collected",
  formatValue = (v) =>
    `AED ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`,
  height = 180,
}) => {
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.value || 0, d.secondaryValue || 0]),
    1,
  );

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <BarChart3 size={16} />
            </span>
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span className="font-semibold text-slate-600">
              {primaryLegend}
            </span>
          </div>
          {secondaryLegend && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="font-semibold text-slate-600">
                {secondaryLegend}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="relative flex items-end justify-around gap-4 pt-6 pb-2 px-3 bg-slate-50/70 rounded-2xl border border-slate-100 overflow-x-auto"
        style={{ minHeight: height }}
      >
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 py-10">
            No chart data available for the selected period.
          </div>
        ) : (
          data.map((item, idx) => {
            const pHeight = Math.max((item.value / maxVal) * 80, 4);
            const sHeight =
              item.secondaryValue !== undefined
                ? Math.max((item.secondaryValue / maxVal) * 80, 4)
                : null;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center min-w-[70px] max-w-[130px] group cursor-pointer"
              >
                <div className="mb-2 text-center transition-transform group-hover:-translate-y-1">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200/80 shadow-xs text-[10px] font-bold text-slate-800 font-mono">
                    {formatValue(item.value)}
                  </span>
                </div>

                <div className="w-full h-32 flex items-end justify-center gap-1.5 rounded-xl bg-slate-200/30 p-1.5">
                  <div
                    className="w-full rounded-md transition-all duration-500 shadow-2xs group-hover:opacity-90"
                    style={{
                      height: `${pHeight}%`,
                      backgroundColor: item.color || "#0f172a",
                    }}
                    title={`${primaryLegend}: ${formatValue(item.value)}`}
                  />

                  {sHeight !== null && (
                    <div
                      className="w-full rounded-md transition-all duration-500 shadow-2xs group-hover:opacity-90"
                      style={{
                        height: `${sHeight}%`,
                        backgroundColor: item.secondaryColor || "#059669",
                      }}
                      title={`${secondaryLegend}: ${formatValue(item.secondaryValue || 0)}`}
                    />
                  )}
                </div>

                <span className="mt-2 text-[11px] font-bold text-slate-700 text-center truncate w-full">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[9.5px] text-slate-400 text-center truncate w-full">
                    {item.sublabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportSummaryChart;
