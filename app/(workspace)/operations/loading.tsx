"use client";

import {
  SkeletonCard,
  SkeletonFilters,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/ui";

export default function OperationsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <SkeletonPageHeader />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonFilters />

      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
