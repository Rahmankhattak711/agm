"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { FileSpreadsheetIcon, ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export default function CashFlowReportPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(2026);

  const { data: cf, isLoading } = useQuery({
    queryKey: ["cash-flow", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/cash-flow?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load Cash Flow");
      return await res.json();
    },
  });

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/finance/reports")}
            className="h-8 w-8 p-0"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Reports &gt; <span className="text-foreground font-medium">Financial Statements</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Statement of Cash Flows (IFRS)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={2025}>FY 2025</option>
            <option value={2026}>FY 2026</option>
            <option value={2027}>FY 2027</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-9 gap-1.5"
          >
            <FileSpreadsheetIcon className="w-4 h-4 text-emerald-600" />
            Print / Export
          </Button>
        </div>
      </div>

      {/* Cash Flow Statement Card */}
      <div className="border border-border rounded-xl bg-card shadow-sm p-6 space-y-6 text-xs">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            Calculating Cash Flow activities...
          </div>
        ) : (
          <>
            {/* 1. Operating Activities */}
            <div className="space-y-3">
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wide border-b border-border pb-2">
                1. Cash Flows from Operating Activities
              </h2>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Cash received from customers & commercial invoices</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatAed(cf?.operating.inflows || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Cash paid to suppliers, staff, & site expenses</span>
                  <span className="font-mono font-medium text-rose-600">
                    -{formatAed(cf?.operating.outflows || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t border-border/70 text-foreground">
                <span>Net Cash Provided by Operating Activities</span>
                <span className="font-mono text-primary">{formatAed(cf?.operating.net || 0)}</span>
              </div>
            </div>

            {/* 2. Investing Activities */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wide border-b border-border pb-2">
                2. Cash Flows from Investing Activities
              </h2>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Purchase of plant, equipment & fixed assets</span>
                  <span className="font-mono font-medium text-muted-foreground">
                    {cf?.investing.outflows > 0 ? `-${formatAed(cf.investing.outflows)}` : "AED 0.00"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t border-border/70 text-foreground">
                <span>Net Cash Used in Investing Activities</span>
                <span className="font-mono">{formatAed(cf?.investing.net || 0)}</span>
              </div>
            </div>

            {/* 3. Financing Activities */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wide border-b border-border pb-2">
                3. Cash Flows from Financing Activities
              </h2>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Owner capital contributions & loan settlements</span>
                  <span className="font-mono font-medium text-muted-foreground">
                    {formatAed(cf?.financing.net || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t border-border/70 text-foreground">
                <span>Net Cash from Financing Activities</span>
                <span className="font-mono">{formatAed(cf?.financing.net || 0)}</span>
              </div>
            </div>

            {/* Net Change and Reconciliation */}
            <div className="pt-4 border-t-2 border-border/90 space-y-2 bg-muted/20 p-4 rounded-lg">
              <div className="flex justify-between items-center font-bold text-sm text-foreground">
                <span>Net Increase / (Decrease) in Cash & Cash Equivalents</span>
                <span className={`font-mono ${cf?.netChangeInCash >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatAed(cf?.netChangeInCash || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Cash and Cash Equivalents at Beginning of Year</span>
                <span className="font-mono">{formatAed(cf?.openingCash || 0)}</span>
              </div>
              <div className="flex justify-between items-center font-extrabold text-sm pt-2 border-t border-border text-foreground">
                <span>Cash and Cash Equivalents at End of Year (Bank & Petty Cash)</span>
                <span className="font-mono text-primary font-black">
                  {formatAed(cf?.closingCash || 0)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
