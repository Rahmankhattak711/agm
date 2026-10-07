import React from "react";
import { Project, ProjectCost } from "@/lib/hooks/api-hooks";
import { FilterBar } from "@/components/ui";
import { TrashIcon } from "@/components/icons";
import { CATEGORIES, fmt } from "../types";

interface CostTrackingDetailedListProps {
  selectedProject: Project | null;
  filteredCosts: ProjectCost[];
  search: string;
  onSearchChange: (search: string) => void;
  canModify: boolean;
  onDeleteCost: (costId: string) => void;
}

export function CostTrackingDetailedList({
  selectedProject,
  filteredCosts,
  search,
  onSearchChange,
  canModify,
  onDeleteCost,
}: CostTrackingDetailedListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-900">
          Recorded Cost Entries
        </h3>
        <p className="text-[11px] text-slate-400">
          Every single cost recorded for {selectedProject?.name}. Delete any
          mistake with one click.
        </p>
      </div>

      <FilterBar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search entries…"
        totalCount={filteredCosts.length}
        countLabel="Entries"
      />

      {filteredCosts.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 font-medium">
            No expenses logged yet for this project.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Select a category above and enter an amount to record one.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3 w-36">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right w-32">Amount</th>
                <th className="py-2.5 px-3 text-center w-16 print:hidden">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCosts.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[10px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    {c.date ? c.date.split("T")[0] : "—"}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {(() => {
                      const catDef = CATEGORIES.find(
                        (cat) =>
                          cat.name.toLowerCase() ===
                            (c.category || "").toLowerCase() ||
                          cat.costType === c.costType,
                      );
                      const IconComponent = catDef?.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${catDef?.bgLight || "bg-slate-100 text-slate-700 border-slate-200"}`}
                        >
                          {IconComponent && (
                            <IconComponent
                              size={13}
                              className={catDef?.color}
                            />
                          )}
                          {c.category || c.costType}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 font-medium">
                    <div>{c.description}</div>
                    {c.reference && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref: {c.reference}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    AED {fmt(c.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center print:hidden">
                    {canModify && (
                      <button
                        type="button"
                        onClick={() => onDeleteCost(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <TrashIcon size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
