"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "./Button";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  globalFilterPlaceholder?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records found",
  emptyMessage = "There are no records matching your criteria.",
  pageSize = 10,
  showPagination = true,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-100/90 border-b border-slate-200/80"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap ${
                        canSort
                          ? "cursor-pointer select-none hover:text-slate-800 transition-colors"
                          : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}

                        {canSort && (
                          <span
                            className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold transition-all ${
                              sortDirection
                                ? "bg-agm-green text-white"
                                : "text-slate-300 hover:text-slate-500"
                            }`}
                          >
                            {sortDirection === "asc"
                              ? "▲"
                              : sortDirection === "desc"
                                ? "▼"
                                : "↕"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`border-b border-slate-100 ${rowIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                >
                  {columns.map((_, colIdx) => {
                    const widths = [
                      "w-3/4",
                      "w-1/2",
                      "w-4/5",
                      "w-2/3",
                      "w-5/6",
                      "w-3/5",
                    ];
                    const width = widths[(rowIdx + colIdx) % widths.length];
                    return (
                      <td key={colIdx} className="py-3.5 px-4">
                        <div
                          className={`h-3 ${width} rounded-md bg-slate-200/70 animate-pulse`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg text-slate-400">
                      🗂
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      {emptyTitle}
                    </p>
                    {emptyMessage && (
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        {emptyMessage}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={`border-b border-slate-100 last:border-0 transition-colors duration-100 ${
                    rowIdx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  } ${
                    onRowClick
                      ? "cursor-pointer hover:bg-emerald-50/40"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-3.5 px-4 text-slate-800 align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && data.length > pageSize && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            –{" "}
            <span className="font-bold text-slate-700">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length,
              )}
            </span>{" "}
            of <span className="font-bold text-slate-700">{data.length}</span>{" "}
            entries
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-[11px] font-black text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
