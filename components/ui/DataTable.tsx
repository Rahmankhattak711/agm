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

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: React.ReactNode;
  countLabel?: React.ReactNode;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  globalFilterPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  className?: string;
  wrapperClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  countLabel,
  isLoading = false,
  emptyTitle = "No records found",
  emptyMessage = "There are no records matching your criteria.",
  pageSize = 10,
  showPagination = true,
  onRowClick,
  className = "",
  wrapperClassName = "",
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

  const content = (
    <>
      <div className="overflow-x-auto bg-white min-w-0 max-w-full">
        <table className={`w-full text-left text-xs ${className}`}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50 border-b border-slate-200"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`py-2 px-2.5 sm:px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                        canSort
                          ? "cursor-pointer select-none hover:text-slate-900 transition-colors"
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

                        {canSort && sortDirection && (
                          <span className="inline-flex items-center justify-center w-3 h-3 rounded text-[8px] font-bold transition-all bg-agm-green text-white">
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white divide-y divide-slate-100 font-medium">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={rowIdx % 2 === 1 ? "bg-slate-50/40" : "bg-white"}
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
                      <td key={colIdx} className="py-2.5 px-2.5 sm:px-3">
                        <div
                          className={`h-2.5 ${width} rounded-md bg-slate-200/70 animate-pulse`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-base text-slate-400">
                      🗂
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {emptyTitle}
                    </p>
                    {emptyMessage && (
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
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
                  className={`transition-colors duration-100 ${
                    rowIdx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                  } ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-50/80"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-2 px-2.5 sm:px-3 text-slate-800 text-xs align-middle"
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
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-200 bg-slate-50/60">
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
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <span className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (title) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
      >
        <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white py-2.5 px-4 sm:px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white print:!text-slate-900">
            {title}
          </h4>
          {countLabel !== undefined && (
            <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
              {countLabel}
            </span>
          )}
        </div>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
    >
      {content}
    </div>
  );
}
