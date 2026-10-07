"use client";

import React from "react";
import { Project, ProjectCost } from "@/lib/hooks/api-hooks";
import {
  Button,
  FilterBar,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
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

const COLUMNS: RegisterColumn[] = [
  {
    label: "#",
    align: "center",
    compact: true,
    className: "w-10 whitespace-nowrap",
  },
  { label: "Date", compact: true, className: "w-28 whitespace-nowrap" },
  { label: "Category", compact: true, className: "w-36 whitespace-nowrap" },
  { label: "Description", compact: true },
  {
    label: "Amount (AED)",
    align: "right",
    compact: true,
    className: "w-32 whitespace-nowrap",
  },
  {
    label: "Action",
    align: "center",
    compact: true,
    hideOnPrint: true,
    className: "w-16 whitespace-nowrap pr-3",
  },
];

export function CostTrackingDetailedList({
  selectedProject,
  filteredCosts,
  search,
  onSearchChange,
  canModify,
  onDeleteCost,
}: CostTrackingDetailedListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
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
        <RegisterTable
          title={`Recorded Cost Entries — ${selectedProject?.name || "Project"}`}
          countLabel={`${filteredCosts.length} Entries`}
          columns={COLUMNS}
        >
          <TableBody className="divide-y divide-slate-100 font-medium">
            {filteredCosts.map((c, idx) => (
              <TableRow
                key={c.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <TableCell className="py-2 px-2.5 text-center font-mono text-slate-400 text-[10px]">
                  {idx + 1}
                </TableCell>
                <TableCell className="py-2 px-2.5 sm:px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                  {c.date ? c.date.split("T")[0] : "—"}
                </TableCell>
                <TableCell className="py-2 px-2.5 sm:px-3 font-semibold text-slate-800 whitespace-nowrap">
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
                          <IconComponent size={13} className={catDef?.color} />
                        )}
                        {c.category || c.costType}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 font-medium text-xs">
                  <div>{c.description}</div>
                  {c.reference && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {c.reference}
                    </span>
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  className="py-2 px-2.5 sm:px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs"
                >
                  AED {fmt(c.amount)}
                </TableCell>
                <TableCell className="py-2 px-2 sm:pr-3 text-center print:hidden whitespace-nowrap">
                  {canModify && (
                    <div className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCost(c.id)}
                        className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <TrashIcon size={18} className="w-[18px] h-[18px]" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </RegisterTable>
      )}
    </div>
  );
}
