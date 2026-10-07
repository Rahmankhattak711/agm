"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui";

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
        header: () => <span>Employee</span>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {row.employeeName}
              </span>
              <span className="text-[10px] text-teal-800 font-mono font-semibold block">
                {row.employeeCode}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: () => <span>Department</span>,
        cell: (info) => (
          <span className="text-slate-600 text-xs font-medium">
            {info.getValue<string>() || "Operations"}
          </span>
        ),
      },
      {
        accessorKey: "activityType",
        header: () => <span>Activity</span>,
        cell: (info) => (
          <span className="text-xs font-semibold text-slate-800">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "detail",
        header: () => <span>Details</span>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="text-slate-700 text-xs block truncate max-w-xs">
                {row.detail}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {row.date}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-right">Status</div>,
        cell: (info) => {
          const status = info.getValue<string>();
          const tone =
            status === "Present" || status === "Approved"
              ? "emerald"
              : status === "Pending"
                ? "amber"
                : status === "Absent" || status === "Rejected"
                  ? "rose"
                  : "slate";

          return (
            <div className="text-right">
              <Badge tone={tone} className="text-[10px] px-2 py-0.5">
                {status}
              </Badge>
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
    <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Recent operational activity
        </h3>
        <Link
          href="/operations/attendance"
          className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
        >
          View all →
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 font-medium">
          No operational activity logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="py-2 px-2.5 sm:px-3">
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
            <tbody className="divide-y divide-slate-100 font-medium">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-2 px-2.5 sm:px-3 text-slate-800"
                    >
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
