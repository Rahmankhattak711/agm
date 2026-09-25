import React from "react";
import { ProjectStatus } from "@/lib/hooks/api-hooks";
import { STATUS_CFG } from "../types";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PLANNING;
  const isLive = status === "IN_PROGRESS";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ring-1 ${cfg.ring} ${cfg.text} bg-white shadow-2xs whitespace-nowrap`}
    >
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`}
        />
      </span>
      {cfg.label}
    </span>
  );
}
