"use client";

import {
  Skeleton,
  SkeletonCard,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/ui";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <SkeletonPageHeader />

      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
