"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge, DataTable } from "@/components/ui";

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
              <span className="font-bold text-agm-text block text-xs">
                {row.employeeName}
              </span>
              <span className="text-[10px] text-agm-green-dark font-mono font-semibold block">
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
          <span className="text-agm-muted text-xs font-medium">
            {info.getValue<string>() || "Operations"}
          </span>
        ),
      },
      {
        accessorKey: "activityType",
        header: () => <span>Activity</span>,
        cell: (info) => (
          <span className="text-xs font-semibold text-agm-text">
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
              <span className="text-agm-text text-xs block truncate max-w-xs">
                {row.detail}
              </span>
              <span className="text-[10px] text-agm-subtle font-mono block">
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

  return (
    <div className="p-4 sm:p-5 bg-agm-card border border-agm-box-border rounded-2xl shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-agm-box-border/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-agm-text">
          Recent operational activity
        </h3>
        <Link
          href="/operations/attendance"
          className="text-xs font-bold text-agm-green hover:text-agm-green-dark transition-colors"
        >
          View all →
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={data}
        showPagination={false}
        emptyTitle="No operational activity logged yet."
        emptyMessage=""
      />
    </div>
  );
}
