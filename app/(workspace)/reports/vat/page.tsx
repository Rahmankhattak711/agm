"use client";

import { VatPositionReport } from "@/app/(workspace)/finance/reports/components/VatPositionReport";
import { useVatSummary } from "@/lib/hooks/api-hooks";
import { Button, PageHeader } from "@/components/ui";
import { PrintIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function VatReportsPage() {
  const router = useRouter();
  const { data: vatSummary, isLoading } = useVatSummary();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backButton={{
          label: "Reports Hub",
          onClick: () => router.push("/finance/reports"),
        }}
        title="VAT Return (FTA 201)"
        description="Quarterly VAT position, input and output tax reconciliation."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
            icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
          >
            Print Statement
          </Button>
        }
      />

      <VatPositionReport
        vatSummary={vatSummary}
        isLoading={isLoading}
        hideHeaderBar={true}
      />
    </div>
  );
}
