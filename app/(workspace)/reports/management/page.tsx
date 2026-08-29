"use client";

import { useMemo, useState } from "react";
import {
  useProfitLoss,
  useBalanceSheet,
  useVatSummary,
  useReceivables,
  usePayables,
} from "@/lib/hooks/api-hooks";
import { PrintIcon } from "@/components/icons";
import { Button, Modal } from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportSummaryChart,
  ChartBarItem,
} from "@/components/reports/ReportSummaryChart";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Building2,
  DollarSign,
  Scale,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function ManagementReportsPage() {
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: vatSummary } = useVatSummary();
  const { data: receivables } = useReceivables();
  const { data: payables } = usePayables();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Financial Metrics Calculations
  const totalRevenue = Number(
    profitLoss?.totalIncome ?? (profitLoss as any)?.revenue ?? 0,
  );
  const directExpenses = Number(profitLoss?.totalDirectExpenses ?? 0);
  const grossProfit = Number(
    profitLoss?.grossProfit ?? totalRevenue - directExpenses,
  );
  const operatingExpenses = Number(profitLoss?.totalOperatingExpenses ?? 0);
  const netProfit = Number(
    profitLoss?.netProfit ?? grossProfit - operatingExpenses,
  );

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const currentAssets = Number(balanceSheet?.totalCurrentAssets ?? 0);
  const fixedAssets = Number(balanceSheet?.totalFixedAssets ?? 0);
  const totalAssets = Number(
    balanceSheet?.totalAssets ?? currentAssets + fixedAssets,
  );
  const currentLiabilities = Number(balanceSheet?.totalCurrentLiabilities ?? 0);
  const totalLiabilities = Number(
    balanceSheet?.totalLiabilities ?? currentLiabilities,
  );
  const totalEquity = Number(
    balanceSheet?.totalEquity ?? totalAssets - totalLiabilities,
  );

  const workingCapital = currentAssets - currentLiabilities;
  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  const totalAR = Number(receivables?.totalReceivables ?? 0);
  const totalAP = Number(payables?.totalPayables ?? 0);
  const netTradingCapital = totalAR - totalAP;

  // Visual Chart Data
  const financialHealthChartData: ChartBarItem[] = [
    {
      label: "Revenue",
      sublabel: "Total Sales",
      value: totalRevenue,
      color: "#0f172a",
    },
    {
      label: "Gross Profit",
      sublabel: "After Direct COGS",
      value: grossProfit,
      color: "#059669",
    },
    {
      label: "Overheads",
      sublabel: "Operating Costs",
      value: operatingExpenses,
      color: "#dc2626",
    },
    {
      label: "Net Profit",
      sublabel: "Net Earnings",
      value: netProfit,
      color: netProfit >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Receivables",
      sublabel: "Client A/R",
      value: totalAR,
      color: "#0284c7",
    },
    {
      label: "Payables",
      sublabel: "Vendor A/P",
      value: totalAP,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Management &amp; Executive Performance Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
              Executive KPI &amp; Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — High-level executive KPI
            metrics, working capital health, <br /> liquidity ratios, and
            statutory performance indicators.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsPrintSummaryOpen(true)}
          icon={<PrintIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Billed Revenue
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
            <TrendingUp size={13} /> Gross Margin: {grossMargin.toFixed(1)}%
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Net Operating Profit
          </p>
          <p
            className={`text-2xl font-black mt-1 ${
              netProfit >= 0 ? "text-emerald-800" : "text-rose-700"
            }`}
          >
            {formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Net Return: {netMargin.toFixed(1)}% on turnover
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Net Working Capital
          </p>
          <p
            className={`text-2xl font-black mt-1 ${
              workingCapital >= 0 ? "text-blue-800" : "text-amber-700"
            }`}
          >
            {formatCurrency(workingCapital)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Current Assets minus Current Liabilities
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Liquidity Ratio
          </p>
          <p
            className={`text-2xl font-black mt-1 ${
              currentRatio >= 1.5
                ? "text-emerald-800"
                : currentRatio >= 1.0
                  ? "text-blue-800"
                  : "text-rose-700"
            }`}
          >
            {currentRatio > 0 ? `${currentRatio.toFixed(2)}x` : "1.00x"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRatio >= 1.5
              ? "Strong Liquidity Buffer"
              : currentRatio >= 1.0
                ? "Adequate Working Capital"
                : "Tight Working Capital"}
          </p>
        </div>
      </div>

      <ReportSummaryChart
        title="Executive Financial Performance & Balance Sheet Drivers"
        subtitle="Visual snapshot of revenue, profitability thresholds, and trading capital exposure"
        data={financialHealthChartData}
        primaryLegend="Financial Balance (AED)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Profitability &amp; Operational Margin Structure
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of commercial income versus direct &amp; operating
                costs
              </p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={18} />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Gross Billed Revenue:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Direct Fitout / Material Costs (COGS):
              </span>
              <span className="font-mono font-bold text-rose-700">
                -{formatCurrency(directExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-emerald-900 font-bold">Gross Profit:</span>
              <div className="text-right">
                <span className="font-mono font-black text-emerald-800 block">
                  {formatCurrency(grossProfit)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {grossMargin.toFixed(1)}% of Revenue
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Operating &amp; Admin Overheads:
              </span>
              <span className="font-mono font-bold text-slate-700">
                -{formatCurrency(operatingExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 text-white">
              <span className="font-bold text-sm">Net Operating Profit:</span>
              <div className="text-right">
                <span className="font-mono font-black text-sm text-emerald-400 block">
                  {formatCurrency(netProfit)}
                </span>
                <span className="text-[10px] text-slate-300">
                  {netMargin.toFixed(1)}% Net Margin
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Balance Sheet &amp; Capital Structure
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current and fixed asset backing versus commercial obligations
              </p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Scale size={18} />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Total Current Liquid Assets:
              </span>
              <span className="font-mono font-bold text-blue-900">
                {formatCurrency(currentAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Fixed &amp; Non-Current Assets:
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(fixedAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-blue-900 font-bold">
                Total Capital Assets:
              </span>
              <span className="font-mono font-black text-blue-950">
                {formatCurrency(totalAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Current Short-Term Liabilities:
              </span>
              <span className="font-mono font-bold text-amber-700">
                {formatCurrency(currentLiabilities)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 text-white">
              <span className="font-bold text-sm">
                Total Equity &amp; Retained Capital:
              </span>
              <span className="font-mono font-black text-sm text-emerald-400">
                {formatCurrency(totalEquity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm">
              Working Capital &amp; Trade Exposure Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client accounts receivable (A/R) versus supplier accounts payable
              (A/P)
            </p>
          </div>
          <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
            <Activity size={18} />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Accounts Receivable (A/R)
            </span>
            <span className="text-xl font-black text-emerald-800 block mt-1">
              {formatCurrency(totalAR)}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Realizable customer assets
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Accounts Payable (A/P)
            </span>
            <span className="text-xl font-black text-amber-700 block mt-1">
              {formatCurrency(totalAP)}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Short-term supplier obligations
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Net Trade Surplus / (Deficit)
            </span>
            <span
              className={`text-xl font-black block mt-1 ${
                netTradingCapital >= 0 ? "text-blue-900" : "text-rose-700"
              }`}
            >
              {formatCurrency(netTradingCapital)}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              A/R minus A/P commercial balance
            </span>
          </div>
        </div>
      </div>

      {isPrintSummaryOpen && (
        <Modal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          title="Print Executive Management Statement"
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs print:p-0">
            <div
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 print:border-none print:shadow-none print:p-0"
              id="management-print-area"
            >
              <table className="print-page-table w-full border-collapse">
                <thead className="print-page-header-group">
                  <tr>
                    <th className="p-0 font-normal text-left border-none">
                      <div className="mb-4">
                        <QuotationHeader className="-mx-6 -mt-6 mb-4 print:m-0" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tfoot className="print-page-footer-group">
                  <tr>
                    <td className="p-0 border-none">
                      <div className="h-[80px] w-full hidden print:block" />
                    </td>
                  </tr>
                </tfoot>

                <tbody className="print-page-body-group">
                  <tr>
                    <td className="p-0 border-none align-top">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                          <div>
                            <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                              Executive Performance Statement
                            </span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                              MANAGEMENT &amp; BOARD REPORT
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-700 font-mono font-bold text-xs">
                              Statutory Executive Audit
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Generated:{" "}
                              {new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Billed Revenue
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {formatCurrency(totalRevenue)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Net Profit
                            </span>
                            <span className="font-mono font-black text-emerald-800">
                              {formatCurrency(netProfit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Working Capital
                            </span>
                            <span className="font-mono font-black text-blue-900">
                              {formatCurrency(workingCapital)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Liquidity Ratio
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {currentRatio.toFixed(2)}x
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-900 text-xs">
                              Income &amp; Margin
                            </h4>
                            <div className="rounded-xl border border-slate-200 p-3 space-y-1.5 font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Gross Revenue:
                                </span>
                                <span className="font-bold">
                                  {formatCurrency(totalRevenue)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Direct Costs:
                                </span>
                                <span className="text-rose-700">
                                  -{formatCurrency(directExpenses)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-100 pt-1">
                                <span className="text-emerald-800 font-bold font-sans">
                                  Gross Profit:
                                </span>
                                <span className="font-bold text-emerald-800">
                                  {formatCurrency(grossProfit)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Operating Overheads:
                                </span>
                                <span>
                                  -{formatCurrency(operatingExpenses)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
                                <span className="font-sans">Net Profit:</span>
                                <span className="text-emerald-800">
                                  {formatCurrency(netProfit)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-900 text-xs">
                              Balance Sheet Summary
                            </h4>
                            <div className="rounded-xl border border-slate-200 p-3 space-y-1.5 font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Current Assets:
                                </span>
                                <span className="font-bold">
                                  {formatCurrency(currentAssets)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Fixed Assets:
                                </span>
                                <span>{formatCurrency(fixedAssets)}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-100 pt-1">
                                <span className="font-sans text-blue-900 font-bold">
                                  Total Assets:
                                </span>
                                <span className="font-bold text-blue-900">
                                  {formatCurrency(totalAssets)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">
                                  Current Liabilities:
                                </span>
                                <span className="text-amber-700">
                                  {formatCurrency(currentLiabilities)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
                                <span className="font-sans">Total Equity:</span>
                                <span className="text-emerald-800">
                                  {formatCurrency(totalEquity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div>
                <QuotationFooter />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPrintSummaryOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => window.print()}
                icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              >
                Print Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
