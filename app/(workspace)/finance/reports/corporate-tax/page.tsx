"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCorporateTax } from "@/lib/hooks/finance-hooks";
import {
  ChevronLeftIcon,
  PrintIcon,
  RefreshIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { useReactToPrint } from "react-to-print";

export default function CorporateTaxPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data, isLoading, refetch, isFetching } = useCorporateTax({
    year: selectedYear,
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-Corporate-Tax-Return-${selectedYear}`,
  });

  const formatAed = (val?: number) => {
    if (val === undefined || val === null || val === 0) return "—";
    return val.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatAlways = (val?: number) => {
    if (val === undefined || val === null) return "0.00";
    return val.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Top Breadcrumb & Title matching Wafeq Screenshot 5 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <button
              onClick={() => router.push("/finance/reports")}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              Reports
            </button>
            <span>&gt;</span>
            <span className="text-foreground font-medium">Corporate Tax</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Corporate Tax – Taxable Income
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              UAE Federal Law No. 47 (9%)
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computation of statutory Taxable Income derived from Audited Accounting Net Profit, adjusted for exempt revenues and non-deductible expenses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-2 border border-border rounded-lg bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshIcon className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => handlePrint()}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-background hover:bg-muted/50 text-foreground flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            Export / Print
          </button>
        </div>
      </div>

      {/* Corporate Tax Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Accounting Net Profit</div>
          <div className="text-xl font-bold text-foreground font-mono">
            AED {formatAlways(data?.totals.accountingNetProfit)}
          </div>
          <div className="text-[11px] text-muted-foreground">Audited financial result from P&amp;L</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Adjusted Taxable Income</div>
          <div className="text-xl font-bold text-indigo-600 font-mono">
            AED {formatAlways(data?.totals.taxableIncome)}
          </div>
          <div className="text-[11px] text-muted-foreground">Net of exempt &amp; non-deductibles</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Statutory Threshold</div>
          <div className="text-xl font-bold text-foreground font-mono">
            AED {formatAlways(data?.totals.taxThreshold)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">0% Tax Rate on first 375k</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Corporate Tax Due (9%)</div>
          <div className={`text-xl font-bold font-mono ${(data?.totals.corporateTaxDue || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            AED {formatAlways(data?.totals.corporateTaxDue)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {(data?.totals.taxableIncomeAboveThreshold || 0) > 0
              ? `Applied on excess: AED ${formatAlways(data?.totals.taxableIncomeAboveThreshold)}`
              : "Below taxable threshold"}
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">📅 Tax Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-xs font-medium bg-background border border-border rounded-md px-2.5 py-1 text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          UAE Corporate Tax Statutory Period: 01 Jan {selectedYear} to 31 Dec {selectedYear}
        </div>
      </div>

      {/* Monthly Comparative Grid matching Wafeq Screenshot 5 */}
      <div
        ref={printRef}
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none"
      >
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Generating statutory corporate tax grid...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-semibold min-w-[260px] sticky left-0 bg-card shadow-xs">
                    Statutory Line Items
                  </th>
                  {data?.months.map((m) => (
                    <th key={m.monthKey} className="py-3 px-3 font-semibold text-right min-w-[100px] whitespace-nowrap">
                      {m.monthLabel.split(" ")[0]}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold text-right min-w-[130px] bg-muted/60 text-foreground">
                    Full Year Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {/* ROW 1: Accounting Net Profit */}
                <tr className="hover:bg-muted/15 transition-colors font-semibold">
                  <td className="py-3 px-4 text-foreground sticky left-0 bg-card">
                    Accounting Net Profit
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-3 px-3 text-right font-mono">
                      {formatAed(m.accountingNetProfit)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-mono font-bold bg-muted/20 text-foreground">
                    {formatAed(data?.totals.accountingNetProfit)}
                  </td>
                </tr>

                {/* ROW 2: Header Less exempt revenue */}
                <tr className="bg-muted/10 text-muted-foreground">
                  <td colSpan={(data?.months.length || 12) + 2} className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider">
                    Less exempt revenue
                  </td>
                </tr>
                <tr className="hover:bg-muted/15 transition-colors text-foreground/80 pl-4">
                  <td className="py-2.5 px-4 pl-8 sticky left-0 bg-card text-muted-foreground">
                    Total exempt revenue
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {formatAed(m.exemptRevenue)}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right font-mono bg-muted/20 text-muted-foreground">
                    {formatAed(data?.totals.exemptRevenue)}
                  </td>
                </tr>

                {/* ROW 3: Header Add back non-deductible expenses */}
                <tr className="bg-muted/10 text-muted-foreground">
                  <td colSpan={(data?.months.length || 12) + 2} className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider">
                    Add back non-deductible expenses
                  </td>
                </tr>
                <tr className="hover:bg-muted/15 transition-colors text-foreground/80">
                  <td className="py-2.5 px-4 pl-8 sticky left-0 bg-card text-muted-foreground">
                    Total non-deductible expenses
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {formatAed(m.nonDeductibleExpenses)}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right font-mono bg-muted/20 text-muted-foreground">
                    {formatAed(data?.totals.nonDeductibleExpenses)}
                  </td>
                </tr>

                {/* ROW 4: Final Taxable Income (Matching Wafeq Screenshot 5) */}
                <tr className="bg-indigo-50/50 font-bold border-t-2 border-indigo-200 text-indigo-950">
                  <td className="py-3.5 px-4 text-indigo-900 sticky left-0 bg-indigo-50">
                    Taxable Income
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-3.5 px-3 text-right font-mono">
                      {formatAed(m.taxableIncome)}
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-indigo-700 bg-indigo-100/60">
                    {formatAed(data?.totals.taxableIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
