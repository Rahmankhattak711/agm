"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProfitLossReport } from "@/app/(workspace)/finance/reports/components/ProfitLossReport";
import { PageHeader } from "@/components/ui";

export default function FinanceReportsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        backButton={{
          label: "Reports Hub",
          onClick: () => router.push("/finance/reports"),
        }}
        title="Profit & Loss Statement"
        description="Comprehensive statement of revenue, direct project expenses, operating costs, and net profit."
      />

      <div>
        <ProfitLossReport />
      </div>
    </div>
  );
}
