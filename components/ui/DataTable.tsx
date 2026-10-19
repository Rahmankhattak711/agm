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
import { SpinnerIcon } from "@/components/icons";

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
  renderExpandedRow?: (row: TData) => React.ReactNode;
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
  renderExpandedRow,
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
      <div className="overflow-x-auto bg-agm-card min-w-0 max-w-full">
        <table className={`w-full text-left text-xs ${className}`}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-agm-box-bg border-b border-agm-box-border"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`py-2 px-2.5 sm:px-3 text-[10px] font-bold uppercase tracking-wider text-agm-text whitespace-nowrap ${
                        canSort
                          ? "cursor-pointer select-none hover:text-agm-navy transition-colors"
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

          <tbody className="bg-agm-card divide-y divide-agm-border font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SpinnerIcon size={24} className="text-agm-green animate-spin" />
                    <span className="text-xs font-semibold text-agm-muted">
                      Loading records...
                    </span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-agm-box-bg flex items-center justify-center text-base text-agm-subtle">
                      🗂
                    </div>
                    <p className="text-xs font-bold text-agm-text">
                      {emptyTitle}
                    </p>
                    {emptyMessage && (
                      <p className="text-[11px] text-agm-muted max-w-xs leading-relaxed">
                        {emptyMessage}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIdx) => {
                const expandedContent = renderExpandedRow
                  ? renderExpandedRow(row.original)
                  : null;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => onRowClick && onRowClick(row.original)}
                      className={`transition-colors duration-100 ${
                        rowIdx % 2 === 1 ? "bg-agm-box-bg/30" : "bg-agm-card"
                      } ${
                        onRowClick
                          ? "cursor-pointer hover:bg-agm-box-bg/60"
                          : "hover:bg-agm-box-bg/60"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-2 px-2.5 sm:px-3 text-agm-text text-xs align-middle"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedContent}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && data.length > pageSize && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-agm-box-border bg-agm-box-bg/60">
          <p className="text-[11px] text-agm-muted">
            Showing{" "}
            <span className="font-bold text-agm-text">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            –{" "}
            <span className="font-bold text-agm-text">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length,
              )}
            </span>{" "}
            of <span className="font-bold text-agm-text">{data.length}</span>{" "}
            entries
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-agm-box-border bg-agm-card text-agm-text hover:bg-agm-box-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <span className="px-2.5 py-1 text-[11px] font-bold text-agm-text bg-agm-box-bg rounded-lg border border-agm-box-border">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-agm-box-border bg-agm-card text-agm-text hover:bg-agm-box-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
        className={`rounded-2xl border border-agm-box-border overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
      >
        <div className="bg-agm-sidebar text-white py-2.5 px-4 sm:px-5 flex items-center justify-between print:bg-none print:!bg-agm-box-bg print:!text-agm-text">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white print:!text-agm-text">
            {title}
          </h4>
          {countLabel !== undefined && (
            <span className="text-[11px] font-mono text-agm-green-soft font-bold print:!text-agm-muted">
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
      className={`rounded-2xl border border-agm-box-border overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
    >
      {content}
    </div>
  );
}
