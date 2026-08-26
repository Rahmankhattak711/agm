"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2.5 w-40" />
    </div>
  );
}

export function SkeletonPageHeader({
  withButton = true,
  className = "",
}: {
  withButton?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 ${className}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>

      {withButton && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      )}
    </div>
  );
}

export function SkeletonFilters({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}
    >
      <Skeleton className="h-9 w-full sm:w-80 rounded-xl" />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 6,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  const widths = ["w-3/4", "w-1/2", "w-4/5", "w-2/3", "w-5/6", "w-3/5"];

  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs ${className}`}
    >
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <th key={colIdx} className="py-3 px-4">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/40">
              {Array.from({ length: columns }).map((_, colIdx) => {
                const width = widths[(rowIdx + colIdx) % widths.length];
                return (
                  <td key={colIdx} className="py-3.5 px-4">
                    <Skeleton className={`h-3.5 ${width}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const heights = ["h-28", "h-40", "h-20", "h-36", "h-44", "h-24"];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className={`w-full max-w-[48px] ${heights[i % heights.length]} rounded-t-lg`}
              />
              <Skeleton className="h-2.5 w-8" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
