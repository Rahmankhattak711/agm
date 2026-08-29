"use client";

import { Skeleton } from "@/components/ui";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <Skeleton className="h-11 w-full rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
