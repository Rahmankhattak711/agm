"use client";

import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { MonthlySheetDailyRecord } from "@/lib/hooks/api-hooks";
import { Button, Card, Input } from "@/components/ui";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { getAttendanceStatusBadge } from "@/lib/utils";

interface EmployeeSheetRosterProps {
  dailyRecords: MonthlySheetDailyRecord[];
  totalDays: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function EmployeeSheetRoster({
  dailyRecords,
  totalDays,
  statusFilter,
  onStatusFilterChange,
}: EmployeeSheetRosterProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dayNumber", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const filterOptions = [
    { id: "ALL", label: "All Days" },
    { id: "PRESENT", label: "Present" },
    { id: "ABSENT", label: "Absent" },
    { id: "LATE", label: "Late" },
    { id: "ON_LEAVE", label: "On Leave" },
    { id: "WEEKEND", label: "Weekend / Off" },
  ];

  const columns = useMemo<ColumnDef<MonthlySheetDailyRecord>[]>(
    () => [
      {
        accessorKey: "dayNumber",
        header: "Day / Date",
        enableSorting: true,
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-agm-text font-mono block">
              {row.original.date}
            </span>
            <span className="text-[10px] text-agm-muted font-medium">
              {row.original.dayName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status;
          const badgeClass = getAttendanceStatusBadge(status);

          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${badgeClass}`}
            >
              {status.replace("_", " ")}
            </span>
          );
        },
      },
      {
        accessorKey: "checkInTime",
        header: "Check In",
        enableSorting: true,
        cell: ({ row }) => {
          const time = row.original.checkInTime;
          return (
            <span className="font-mono text-agm-text">
              {time
                ? new Date(time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "checkOutTime",
        header: "Check Out",
        enableSorting: true,
        cell: ({ row }) => {
          const time = row.original.checkOutTime;
          return (
            <span className="font-mono text-agm-text">
              {time
                ? new Date(time).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "workingHours",
        header: () => <div className="text-right">Work Hours</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-agm-text">
            {row.original.workingHours > 0
              ? `${row.original.workingHours}h`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: () => <div className="text-right">Overtime</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-agm-green">
            {row.original.overtimeHours > 0
              ? `+${row.original.overtimeHours}h`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "lateMinutes",
        header: () => <div className="text-right">Late (min)</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono text-amber-800 font-semibold">
            {row.original.lateMinutes > 0
              ? `${row.original.lateMinutes}m`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: "Location / Notes",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-agm-muted text-[11px] truncate max-w-[200px]">
            {row.original.location ? `[${row.original.location}] ` : ""}
            {row.original.notes || "—"}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: dailyRecords,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={statusFilter === t.id ? "primary" : "outline"}
              onClick={() => onStatusFilterChange(t.id)}
              className={`text-xs font-semibold cursor-pointer rounded-xl h-auto py-1 px-3 ${
                statusFilter === t.id
                  ? "bg-agm-sidebar text-white border-agm-sidebar"
                  : "bg-agm-box-bg text-agm-muted hover:text-agm-text border-agm-box-border"
              }`}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-agm-muted"
            />
            <Input
              type="text"
              placeholder="Search date, notes, location..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 py-1 text-xs h-8 bg-agm-card border-agm-box-border"
            />
          </div>
          <div className="text-xs font-medium text-agm-muted whitespace-nowrap">
            {table.getRowModel().rows.length} of {totalDays} days
          </div>
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden border border-agm-box-border bg-agm-card shadow-2xs">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-agm-box-bg text-agm-muted uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-agm-box-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        className={`py-2.5 px-3 select-none ${
                          canSort
                            ? "cursor-pointer hover:bg-agm-box-border/30 transition-colors"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {isSorted === "asc" && (
                            <span className="text-agm-green font-black">▲</span>
                          )}
                          {isSorted === "desc" && (
                            <span className="text-agm-green font-black">▼</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-agm-box-border">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-agm-box-bg/70 transition-colors ${
                      row.original.isWeekend ? "bg-agm-box-bg/40" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2 px-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-agm-muted italic text-xs"
                  >
                    No daily attendance records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
