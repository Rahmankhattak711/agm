"use client";

import { VatPositionReport } from "@/app/(workspace)/finance/reports/components/VatPositionReport";
import { useVatSummary } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui";
import { PrintIcon } from "@/components/icons";

export default function VatReportsPage() {
  const { data: vatSummary, isLoading } = useVatSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            VAT &amp; Tax Compliance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — FTA Form 201 returns, 5% Output
            Tax, 5% Recoverable Input Tax, and Net Position.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
          icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
        >
          Print Statement
        </Button>
      </div>

      <VatPositionReport vatSummary={vatSummary} isLoading={isLoading} />
    </div>
  );
}
