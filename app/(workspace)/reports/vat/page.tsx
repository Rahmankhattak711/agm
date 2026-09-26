"use client";

import { VatPositionReport } from "@/app/(workspace)/finance/reports/components/VatPositionReport";
import { useVatSummary } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui";
import { ChevronLeftIcon, PrintIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function VatReportsPage() {
  const router = useRouter();
  const { data: vatSummary, isLoading } = useVatSummary();

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
          <span className="text-slate-800 font-bold">VAT Return</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              VAT Return (FTA 201)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quarterly VAT position, input and output tax reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
              icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Print Statement
            </Button>
          </div>
        </div>
      </div>

      <VatPositionReport
        vatSummary={vatSummary}
        isLoading={isLoading}
        hideHeaderBar={true}
      />
    </div>
  );
}
