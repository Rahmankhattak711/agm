"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { StatementOfAccountReport } from "@/app/(workspace)/finance/reports/components/StatementOfAccountReport";

export default function CustomerReportsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-3 pb-3 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <ChevronLeftIcon size={12} />
            <span>Reports Hub</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">
            Customer SOA &amp; Receivables
          </span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading Statement of Account...
          </div>
        }
      >
        <StatementOfAccountReport />
      </Suspense>
    </div>
  );
}
