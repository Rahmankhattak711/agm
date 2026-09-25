"use client";

import React, { Suspense } from "react";
import { StatementOfAccountReport } from "@/app/(workspace)/finance/reports/components/StatementOfAccountReport";

export default function StatementOfAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading Statement of Account...
        </div>
      }
    >
      <StatementOfAccountReport />
    </Suspense>
  );
}
