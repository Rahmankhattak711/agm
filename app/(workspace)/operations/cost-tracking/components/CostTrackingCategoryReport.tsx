import React from "react";
import { Project } from "@/lib/hooks/api-hooks";
import { CATEGORIES, fmt } from "../types";

interface CostTrackingCategoryReportProps {
  selectedProject: Project | null;
  reportData: {
    budget: number;
    totalSpent: number;
    remaining: number;
    isUnderBudget: boolean;
    categoryTotals: Record<string, number>;
    categoryCounts: Record<string, number>;
  };
}

export function CostTrackingCategoryReport({
  selectedProject,
  reportData,
}: CostTrackingCategoryReportProps) {
  return (
    <div className="bg-white rounded-2xl border border-agm-box-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-agm-box-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-agm-navy">
            {selectedProject?.name || "Project Cost Report"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Project Code:{" "}
            <strong className="font-mono text-slate-800">
              {selectedProject?.projectCode}
            </strong>
            {selectedProject?.customer?.name &&
              ` • Client: ${selectedProject.customer.name}`}
            {selectedProject?.location &&
              ` • Location: ${selectedProject.location}`}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Actual Spent
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-agm-navy">
            AED {fmt(reportData.totalSpent)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs text-agm-text">
          <thead>
            <tr className="bg-agm-green-soft text-agm-green-dark border-b border-agm-box-border font-bold">
              <th className="py-3 px-5 text-left w-[30%]">Category</th>
              <th className="py-3 px-4 text-left w-[40%] hidden sm:table-cell">
                Scope / Description
              </th>
              <th className="py-3 px-5 text-right w-[20%]">
                Total Spent (AED)
              </th>
              <th className="py-3 px-4 text-right w-[10%]">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-agm-box-border/60">
            {CATEGORIES.map((cat) => {
              const catSpent = reportData.categoryTotals[cat.key] || 0;
              const catCount = reportData.categoryCounts[cat.key] || 0;
              const sharePct =
                reportData.totalSpent > 0
                  ? ((catSpent / reportData.totalSpent) * 100).toFixed(1)
                  : "0.0";
              const hasSpend = catSpent > 0;
              const IconComp = cat.icon;

              return (
                <tr
                  key={cat.key}
                  className={`hover:bg-slate-50/70 transition ${
                    hasSpend ? "bg-white" : "bg-slate-50/20 text-slate-400"
                  }`}
                >
                  <td className="py-3 px-5 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${cat.bgLight}`}
                      >
                        <IconComp size={16} className={cat.color} />
                      </div>
                      <div>
                        <div
                          className={
                            hasSpend
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-600"
                          }
                        >
                          {cat.name}
                        </div>
                        {catCount > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {catCount} {catCount === 1 ? "entry" : "entries"}{" "}
                            recorded
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-500 hidden sm:table-cell text-xs">
                    {cat.description}
                  </td>

                  <td className="py-3 px-5 text-right font-mono font-bold text-sm">
                    <span
                      className={hasSpend ? "text-slate-900" : "text-slate-300"}
                    >
                      AED {fmt(catSpent)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-slate-600 font-medium">
                    {sharePct}%
                  </td>
                </tr>
              );
            })}

            <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
              <td className="py-3 px-5 font-black text-white text-sm">
                TOTAL PROJECT EXPENDITURE
              </td>
              <td className="py-3 px-4 text-xs text-slate-300 hidden sm:table-cell">
                Sum of all recorded labor, materials, equipment and overheads
              </td>
              <td className="py-3 px-5 text-right font-mono font-black text-sm text-emerald-300">
                AED {fmt(reportData.totalSpent)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold text-white">
                100.0%
              </td>
            </tr>

            <tr
              className={
                reportData.isUnderBudget
                  ? "bg-emerald-50/80 border-b border-emerald-200"
                  : "bg-rose-50/80 border-b border-rose-200"
              }
            >
              <td
                className={`py-2.5 px-5 font-bold text-xs ${reportData.isUnderBudget ? "text-emerald-900" : "text-rose-900"}`}
              >
                {reportData.isUnderBudget
                  ? "Budget Balance Remaining (Under Budget)"
                  : "Budget Variance (Over Budget)"}
              </td>
              <td className="py-2.5 px-4 text-slate-500 text-xs hidden sm:table-cell">
                {reportData.isUnderBudget
                  ? "Available funds remaining from approved project budget"
                  : "Total expenditure exceeds approved project budget"}
              </td>
              <td
                className={`py-2.5 px-5 text-right font-mono font-black text-sm ${reportData.isUnderBudget ? "text-emerald-700" : "text-rose-700"}`}
              >
                AED {fmt(Math.abs(reportData.remaining))}
              </td>
              <td
                className={`py-2.5 px-4 text-right font-mono font-bold text-xs ${reportData.isUnderBudget ? "text-emerald-700" : "text-rose-700"}`}
              >
                {reportData.budget > 0
                  ? `${((Math.abs(reportData.remaining) / reportData.budget) * 100).toFixed(1)}%`
                  : "0%"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
