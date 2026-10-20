"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui";

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
                    : "bg-amber-50 text-amber-700 border-amber-200"
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

  return (
    <div className="p-5 bg-agm-card border border-agm-box-border rounded-xl space-y-4">
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

      <DataTable
        columns={columns}
        data={data}
        showPagination={false}
        emptyTitle="No journal entries recorded in the system yet."
        emptyMessage=""
        onRowClick={() => {
          window.location.href = "/finance/journal-entries";
        }}
      />
    </div>
  );
}
