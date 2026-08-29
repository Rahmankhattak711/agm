"use client";

import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <Skeleton className="h-3 w-36 bg-slate-700" />
        </div>
        <Skeleton className="h-7 w-72 bg-slate-700 rounded-lg" />
        <Skeleton className="h-3.5 w-96 bg-slate-700" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Recent Entries & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
          <SkeletonTable rows={4} columns={5} />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
