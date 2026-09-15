"use client";

import React from "react";
import Link from "next/link";

export interface OperationsActionItem {
  id: string;
  description: string;
  status: string;
  statusType: "danger" | "warning";
  href: string;
}

interface OperationsActionRequiredProps {
  items: OperationsActionItem[];
}

export default function OperationsActionRequired({
  items,
}: OperationsActionRequiredProps) {
  return (
    <div className="p-5 bg-[#ffffff] border border-agm-box-border rounded-[12px] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-agm-box-border">
        <h3 className="text-sm font-medium text-agm-text">Action required</h3>
        <Link
          href="/operations/leaves"
          className="text-xs font-normal text-agm-muted hover:text-agm-text transition-colors"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center text-xs text-agm-muted font-normal">
          No pending operational actions. All records up to date.
        </div>
      ) : (
        <div className="divide-y divide-agm-box-border/60 text-xs">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-agm-box-bg -mx-2 px-2 rounded-md transition-colors"
            >
              <span className="font-normal text-agm-text truncate">
                {item.description}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-normal border shrink-0 ${
                  item.statusType === "danger"
                    ? "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
                    : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                }`}
              >
                {item.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
