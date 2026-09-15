"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

export interface OperationsActivityItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  activityType: "Leave" | "Attendance" | "Bonus" | "Asset";
  date: string;
  detail: string;
  status: "Approved" | "Present" | "Pending" | "Absent" | "Rejected";
}

interface OperationsRecentActivityTableProps {
  data: OperationsActivityItem[];
}

export default function OperationsRecentActivityTable({
  data,
}: OperationsRecentActivityTableProps) {
  const columns = useMemo<ColumnDef<OperationsActivityItem>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: () => <span className="font-normal">Employee</span>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-medium text-agm-text block">
                {row.employeeName}
              </span>
              <span className="text-[10px] text-agm-muted block">
                {row.employeeCode}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: () => <span className="font-normal">Department</span>,
        cell: (info) => (
          <span className="font-normal text-agm-muted">
            {info.getValue<string>() || "Operations"}
          </span>
        ),
      },
      {
        accessorKey: "activityType",
        header: () => <span className="font-normal">Activity</span>,
        cell: (info) => (
          <span className="font-medium text-agm-text">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "detail",
        header: () => <span className="font-normal">Details</span>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-normal text-agm-text block">
                {row.detail}
              </span>
              <span className="text-[10px] text-agm-muted block">
                {row.date}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-right font-normal w-24">Status</div>,
        cell: (info) => {
          const status = info.getValue<string>();
          const isGreen = status === "Present" || status === "Approved";
          const isYellow = status === "Pending";
          const isRed = status === "Absent" || status === "Rejected";

          return (
            <div className="text-right">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal border ${
                  isGreen
                    ? "bg-agm-green-soft text-agm-green-2 border-agm-green/25"
                    : isYellow
                      ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                      : isRed
                        ? "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
                        : "bg-agm-box-bg text-agm-muted border-agm-box-border"
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
    <div className="p-5 bg-[#ffffff] border border-agm-box-border rounded-[12px] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-agm-box-border">
        <h3 className="text-sm font-medium text-agm-text">
          Recent operational activity
        </h3>
        <Link
          href="/operations/attendance"
          className="text-xs font-normal text-agm-muted hover:text-agm-text transition-colors"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="py-6 text-center text-xs text-agm-muted font-normal">
          No operational activity logged yet.
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
                  className="hover:bg-agm-box-bg transition-colors"
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
