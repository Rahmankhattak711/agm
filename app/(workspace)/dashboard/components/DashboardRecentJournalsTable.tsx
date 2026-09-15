"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

export interface RecentJournalItem {
  id: string;
  journalId: string;
  date: string;
  amount: number;
  status: "Posted" | "Draft";
}

interface DashboardRecentJournalsTableProps {
  data: RecentJournalItem[];
}

export default function DashboardRecentJournalsTable({
  data,
}: DashboardRecentJournalsTableProps) {
  const columns = useMemo<ColumnDef<RecentJournalItem>[]>(
    () => [
      {
        accessorKey: "journalId",
        header: () => <span className="font-normal">Journal ID</span>,
        cell: (info) => (
          <span className="font-medium text-agm-text">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: () => <span className="font-normal">Date</span>,
        cell: (info) => (
          <span className="font-normal text-agm-muted">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right font-normal">Amount</div>,
        cell: (info) => {
          const val = info.getValue<number>();
          return (
            <div className="text-right font-medium text-agm-text">
              {`AED ${val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-right font-normal w-24">Status</div>,
        cell: (info) => {
          const status = info.getValue<string>();
          const isPosted = status === "Posted";
          return (
            <div className="text-right">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal border ${
                  isPosted
                    ? "bg-agm-green-soft text-agm-green-2 border-agm-green/25"
                    : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                }`}
              >
                {status}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-5 bg-white border border-agm-box-border rounded-[12px] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-agm-box-border">
        <h3 className="text-sm font-medium text-agm-text">
          Recent journal entries
        </h3>
        <Link
          href="/finance/journal-entries"
          className="text-xs font-normal text-agm-muted hover:text-agm-text transition-colors"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="py-6 text-center text-xs text-agm-muted font-normal">
          No journal entries recorded in the system yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-agm-box-border text-agm-muted"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="pb-2 font-normal">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-agm-box-border/60">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-agm-box-bg transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = "/finance/journal-entries")
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
