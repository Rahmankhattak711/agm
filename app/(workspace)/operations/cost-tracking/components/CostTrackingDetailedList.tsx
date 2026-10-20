"use client";

import React, { useMemo } from "react";
import { Project, ProjectCost } from "@/lib/hooks/api-hooks";
import { ColumnDef } from "@tanstack/react-table";
import { Button, DataTable, FilterBar } from "@/components/ui";
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
  const columns = useMemo<ColumnDef<ProjectCost>[]>(
    () => [
      {
        id: "index",
        header: () => <span className="w-8 text-center block">#</span>,
        cell: (info) => (
          <span className="font-mono text-agm-subtle text-[10px] block text-center">
            {info.row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => {
          const val = info.getValue<string>();
          return (
            <span className="font-mono text-agm-muted text-[11px] whitespace-nowrap">
              {val ? val.split("T")[0] : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: (info) => {
          const c = info.row.original;
          const catDef = CATEGORIES.find(
            (cat) =>
              cat.name.toLowerCase() === (c.category || "").toLowerCase() ||
              cat.costType === c.costType,
          );
          const IconComponent = catDef?.icon;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${catDef?.bgLight || "bg-agm-box-bg text-agm-muted border-agm-box-border"}`}
            >
              {IconComponent && (
                <IconComponent size={13} className={catDef?.color} />
              )}
              {c.category || c.costType}
            </span>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => {
          const c = info.row.original;
          return (
            <div>
              <div className="text-agm-text font-medium text-xs">
                {c.description}
              </div>
              {c.reference && (
                <span className="text-[10px] text-agm-subtle font-mono block">
                  Ref: {c.reference}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount (AED)</div>,
        cell: (info) => (
          <div className="text-right font-mono font-bold text-agm-text whitespace-nowrap text-xs">
            AED {fmt(info.getValue<number>())}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center w-14">Action</div>,
        cell: (info) => {
          if (!canModify) return null;
          const costId = info.row.original.id;
          return (
            <div className="flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDeleteCost(costId)}
                className="h-8 w-8 p-0 flex items-center justify-center text-agm-muted hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                title="Delete entry"
              >
                <TrashIcon size={18} className="w-[18px] h-[18px]" />
              </Button>
            </div>
          );
        },
      },
    ],
    [canModify, onDeleteCost],
  );

  return (
    <div className="bg-agm-card rounded-2xl border border-agm-border shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-agm-text">
          Recorded Cost Entries
        </h3>
        <p className="text-[11px] text-agm-muted">
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

      <DataTable
        columns={columns}
        data={filteredCosts}
        title={`Recorded Cost Entries — ${selectedProject?.name || "Project"}`}
        countLabel={`${filteredCosts.length} Entries`}
        pageSize={10}
        showPagination={filteredCosts.length > 10}
        emptyTitle="No expenses logged yet"
        emptyMessage="Select a category above and enter an amount to record one."
      />
    </div>
  );
}
