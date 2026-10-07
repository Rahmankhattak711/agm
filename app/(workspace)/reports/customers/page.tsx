"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { StatementOfAccountReport } from "@/app/(workspace)/finance/reports/components/StatementOfAccountReport";

export default function CustomerReportsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backButton={{
          label: "Reports Hub",
          onClick: () => router.push("/finance/reports"),
        }}
        title="Customer SOA & Receivables"
        description="Customer statement of account and open receivables ledger."
      />

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
