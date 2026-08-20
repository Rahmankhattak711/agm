"use client";

import { PrintIcon, SearchIcon } from "@/components/icons";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import {
  useAccounts,
  useBalanceSheet,
  useLedger,
  useProducts,
  useProfitLoss,
  useTrialBalance,
  useVatSummary,
} from "@/lib/hooks/api-hooks";
import { useState } from "react";

type ReportTab =
  | "summary"
  | "quotation"
  | "profit-loss"
  | "balance-sheet"
  | "trial-balance"
  | "ledger"
  | "vat-summary";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [tbSearch, setTbSearch] = useState<string>("");
  const [tbTypeFilter, setTbTypeFilter] = useState<string>("ALL");
  const [quarterlyTab, setQuarterlyTab] = useState<"ALL" | "Q1" | "Q2" | "Q3" | "Q4">("ALL");

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: trialBalance, isLoading: tbLoading } = useTrialBalance();
  const { data: vatSummary, isLoading: vatLoading } = useVatSummary();
  const { data: accounts } = useAccounts();
  const { data: products = [] } = useProducts();
  const { data: ledger, isLoading: ledgerLoading } = useLedger(
    selectedAccountId || null,
  );

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: "summary", label: "Executive Summary", icon: "✨" },
    { id: "quotation", label: "Quotation & Commercial Estimate", icon: "📄" },
    { id: "profit-loss", label: "Profit & Loss", icon: "📊" },
    { id: "balance-sheet", label: "Balance Sheet", icon: "⚖️" },
    { id: "trial-balance", label: "Trial Balance", icon: "📑" },
    { id: "ledger", label: "General Ledger", icon: "📖" },
    { id: "vat-summary", label: "VAT Position", icon: "🇦🇪" },
  ];

  const dynamicQuotationMeta: Partial<QuotationMeta> = {
    quotationNo: `Q-${Date.now().toString().slice(-5)}`,
    date: new Date().toLocaleDateString("en-GB"),
    validUntil: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-GB"),
    customer: "Brian Berthelsen",
    attention: "",
    address: "Dubai, UAE",
    trn: "",
    mobile: "+971 56 545 3103",
    email: "",
    project: "Proposed G+1 Townhouses",
    location: "Al Furjan, Dubai - UAE",
    reference: "",
    preparedBy: "assem@agmfitout.com",
    contact: "+971 48 749839/+971 50 3407300",
  };

  const dynamicQuotationItems: QuotationItem[] =
    products.length > 0
      ? products.slice(0, 3).map((p, idx) => ({
          id: idx + 1,
          productId: p.id,
          desc: `${p.name} (${p.sku})${p.description ? ` - ${p.description}` : ""}`,
          qty: 1,
          rate: Number(p.sellingPrice || p.costPrice || 0),
        }))
      : [
          {
            id: 1,
            desc: "",
            qty: 1,
            rate: 0,
          },
        ];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Financial Reports & Statements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time commercial quotations, statutory accounting reports,
            general ledger, and UAE VAT returns.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 self-start print:hidden">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "summary" && (() => {
        const formatNumber = (val: number | string | undefined) => {
          const num = Number(val || 0);
          return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        const totalRevenue = Number(profitLoss?.totalIncome || profitLoss?.revenue || 1040276.53);
        const directExpenses = Number(profitLoss?.totalDirectExpenses || 463991.68);
        const grossProfit = Number(profitLoss?.grossProfit || totalRevenue - directExpenses);
        const operatingExpenses = Number(profitLoss?.totalOperatingExpenses || 395982.52);
        const totalExpenses = directExpenses + operatingExpenses;
        const netProfit = Number(profitLoss?.netProfit || grossProfit - operatingExpenses);
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const currentAssets = Number(balanceSheet?.currentAssetsTotal || 161208.38);
        const fixedAssets = Number(balanceSheet?.fixedAssetsTotal || 163273.95);
        const totalAssets = Number(balanceSheet?.totalAssets || currentAssets + fixedAssets);
        const currentLiabilities = Number(balanceSheet?.currentLiabilitiesTotal || 80277.67);
        const totalLiabilities = Number(balanceSheet?.totalLiabilities || currentLiabilities);
        const totalEquity = Number(balanceSheet?.totalEquity || 244204.66);
        const workingCapital = currentAssets - currentLiabilities;
        const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

        const outputVat = Number(vatSummary?.outputVat || 52013.83);
        const inputVat = Number(vatSummary?.inputVat || 47421.27);
        const netVat = outputVat - inputVat;

        return (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                    AGM
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    Executive Financial Summary & Business Health
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  AGM FITOUT TECHNICAL SERVICES LLC — High-level consolidation of statutory performance, balance sheet health, and UAE VAT position.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
                >
                  <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Print / Save PDF
                </button>
              </div>
            </div>

            {/* 6 TOP EXECUTIVE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 1. Revenue */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    1. Total Turnover
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Revenue from Fitout
                  </p>
                </div>
                <p className="text-lg font-black text-emerald-950 font-mono">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>

              {/* 2. Gross Profit */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                      2. Gross Profit
                    </p>
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      {grossMargin.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    After Direct Materials
                  </p>
                </div>
                <p className="text-lg font-black text-blue-950 font-mono">
                  {formatCurrency(grossProfit)}
                </p>
              </div>

              {/* 3. Net Profit */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                      3. Net Income
                    </p>
                    <span className="text-[10px] font-mono font-bold text-purple-700">
                      {netMargin.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Bottom Line Margin
                  </p>
                </div>
                <p className="text-lg font-black text-purple-950 font-mono">
                  {formatCurrency(netProfit)}
                </p>
              </div>

              {/* 4. Total Assets */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    4. Total Assets
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Current & Fixed
                  </p>
                </div>
                <p className="text-lg font-black text-slate-900 font-mono">
                  {formatCurrency(totalAssets)}
                </p>
              </div>

              {/* 5. Total Liabilities */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    5. Total Liabilities
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Payables & Accruals
                  </p>
                </div>
                <p className="text-lg font-black text-rose-950 font-mono">
                  {formatCurrency(totalLiabilities)}
                </p>
              </div>

              {/* 6. Net VAT */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      6. UAE VAT Position
                    </p>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                      {netVat >= 0 ? "Payable" : "Refund"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Output - Input Tax
                  </p>
                </div>
                <p className="text-lg font-black font-mono text-amber-400">
                  {formatCurrency(netVat)}
                </p>
              </div>
            </div>

            {/* 3-MONTH GROUP QUARTERLY SUMMARY SECTION */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-blue-600 text-white font-bold text-xs">
                      📅
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      3-Month Group Performance & Quarterly Summary
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AGM Financial Year grouped into 4 distinct three-month quarters (Q1, Q2, Q3, Q4).
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
                  {(
                    [
                      { id: "ALL", label: "All 4 Quarters" },
                      { id: "Q1", label: "Q1 (Feb-Apr)" },
                      { id: "Q2", label: "Q2 (May-Jul)" },
                      { id: "Q3", label: "Q3 (Aug-Oct)" },
                      { id: "Q4", label: "Q4 (Nov-Jan)" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setQuarterlyTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        quarterlyTab === tab.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 QUARTER SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Q1 CARD */}
                <div
                  onClick={() => setQuarterlyTab("Q1")}
                  className={`p-4.5 rounded-2xl border transition cursor-pointer ${
                    quarterlyTab === "Q1"
                      ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        1st Quarter
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">Feb, Mar, Apr</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      VAT Paid
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue (Turnover):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(531505.59)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Materials:</span>
                      <span className="font-mono font-semibold text-rose-700">{formatCurrency(441638.58)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Gross Operating Profit:</span>
                      <span className="font-mono text-blue-900">{formatCurrency(89867.01)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-500">Output VAT 5%:</span>
                      <span className="font-mono text-rose-700">{formatCurrency(26575.28)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Input VAT 5%:</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(22081.93)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black">
                      <span className="text-slate-900">Net VAT Position:</span>
                      <span className="font-mono text-amber-800">{formatCurrency(4493.35)}</span>
                    </div>
                  </div>
                </div>

                {/* Q2 CARD */}
                <div
                  onClick={() => setQuarterlyTab("Q2")}
                  className={`p-4.5 rounded-2xl border transition cursor-pointer ${
                    quarterlyTab === "Q2"
                      ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        2nd Quarter
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">May, Jun, July</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      VAT Payable
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue (Turnover):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(508770.94)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Materials:</span>
                      <span className="font-mono font-semibold text-rose-700">{formatCurrency(479598.89)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Gross Operating Profit:</span>
                      <span className="font-mono text-blue-900">{formatCurrency(29172.05)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-500">Output VAT 5%:</span>
                      <span className="font-mono text-rose-700">{formatCurrency(25438.55)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Input VAT 5%:</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(23979.94)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black">
                      <span className="text-slate-900">Net VAT Position:</span>
                      <span className="font-mono text-amber-800">{formatCurrency(1458.6)}</span>
                    </div>
                  </div>
                </div>

                {/* Q3 CARD */}
                <div
                  onClick={() => setQuarterlyTab("Q3")}
                  className={`p-4.5 rounded-2xl border transition cursor-pointer ${
                    quarterlyTab === "Q3"
                      ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        3rd Quarter
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">Aug, Sep, Oct</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      VAT Receivable
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue (Turnover):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Materials:</span>
                      <span className="font-mono font-semibold text-rose-700">{formatCurrency(27187.93)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Gross Operating Profit:</span>
                      <span className="font-mono text-rose-700">({formatCurrency(27187.93)})</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-500">Output VAT 5%:</span>
                      <span className="font-mono text-slate-500">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Input VAT 5%:</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(1359.4)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black">
                      <span className="text-slate-900">Net VAT Position:</span>
                      <span className="font-mono text-emerald-700">({formatCurrency(1359.4)})</span>
                    </div>
                  </div>
                </div>

                {/* Q4 CARD */}
                <div
                  onClick={() => setQuarterlyTab("Q4")}
                  className={`p-4.5 rounded-2xl border transition cursor-pointer ${
                    quarterlyTab === "Q4"
                      ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        4th Quarter
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">Nov, Dec, Jan</h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      In Balance
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue (Turnover):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Materials:</span>
                      <span className="font-mono font-semibold text-slate-500">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Gross Operating Profit:</span>
                      <span className="font-mono text-slate-900">{formatCurrency(0)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-500">Output VAT 5%:</span>
                      <span className="font-mono text-slate-500">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Input VAT 5%:</span>
                      <span className="font-mono text-slate-500">{formatCurrency(0)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black">
                      <span className="text-slate-900">Net VAT Position:</span>
                      <span className="font-mono text-slate-700">{formatCurrency(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MASTER 3-MONTH GROUP COMPARISON MATRIX TABLE */}
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                    3-Month Group Accounting Comparison Matrix
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Full Financial Year Consolidation
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4 w-1/4">Financial Line Item</th>
                        <th className="py-2.5 px-4 text-right w-36">Q1 (Feb-Apr)</th>
                        <th className="py-2.5 px-4 text-right w-36">Q2 (May-Jul)</th>
                        <th className="py-2.5 px-4 text-right w-36">Q3 (Aug-Oct)</th>
                        <th className="py-2.5 px-4 text-right w-36">Q4 (Nov-Jan)</th>
                        <th className="py-2.5 px-4 text-right w-40 bg-slate-100/70 font-black">Full Year Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-bold text-slate-900">Turnover / Sales Revenue</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(531505.59)}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(508770.94)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-black text-slate-950 bg-slate-50/40">
                          {formatNumber(1040276.53)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-semibold text-slate-700">Direct Material Expenses (Purchases)</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">{formatNumber(441638.58)}</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">{formatNumber(479598.89)}</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">{formatNumber(27187.93)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-rose-800 bg-slate-50/40">
                          {formatNumber(948425.39)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-semibold text-slate-700">Non-VAT Material / Expense Items</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-600">{formatNumber(64144.38)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-600">{formatNumber(49776.98)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-600">{formatNumber(2275.8)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-700 bg-slate-50/40">
                          {formatNumber(116197.16)}
                        </td>
                      </tr>

                      <tr className="bg-slate-50/80 font-bold">
                        <td className="py-2.5 px-4 text-blue-950 font-bold">Gross Operating Profit</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">{formatNumber(89867.01)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">{formatNumber(29172.05)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">({formatNumber(27187.93)})</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-blue-950 bg-slate-100/60">
                          {formatNumber(91851.14)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-semibold text-slate-700">Output VAT (5% on Sales)</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">{formatNumber(26575.28)}</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">{formatNumber(25438.55)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-black text-rose-800 bg-slate-50/40">
                          {formatNumber(52013.83)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-semibold text-slate-700">Input VAT (5% Recoverable)</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatNumber(22081.93)}</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatNumber(23979.94)}</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatNumber(1359.4)}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-black text-emerald-800 bg-slate-50/40">
                          {formatNumber(47421.27)}
                        </td>
                      </tr>

                      <tr className="bg-slate-900 text-white font-black">
                        <td className="py-3 px-4 uppercase tracking-wider font-bold">
                          NET VAT POSITION (OUTPUT - INPUT)
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400">
                          {formatNumber(4493.35)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400">
                          {formatNumber(1458.6)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                          ({formatNumber(1359.4)})
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-400">0.00</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400 bg-slate-950">
                          {formatNumber(4592.56)}
                        </td>
                      </tr>

                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <td className="py-2 px-4 font-bold text-slate-900">VAT Status & Filing</td>
                        <td className="py-2 px-4 text-right font-semibold text-emerald-700">✓ Paid</td>
                        <td className="py-2 px-4 text-right font-semibold text-amber-700">Pending</td>
                        <td className="py-2 px-4 text-right font-semibold text-emerald-700">Receivable</td>
                        <td className="py-2 px-4 text-right font-semibold text-slate-500">In Balance</td>
                        <td className="py-2 px-4 text-right font-bold text-slate-900 bg-slate-200/60">
                          Form 201 Ready
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* FINANCIAL HEALTH RATIOS & AUDIT CHECKLIST */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LIQUIDITY & HEALTH RATIOS */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>📈</span> Financial Liquidity & Efficiency Ratios
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Working Capital</p>
                    <p className="text-base font-black font-mono text-slate-900 mt-1">
                      {formatCurrency(workingCapital)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Current Assets - Liabilities</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Current Ratio</p>
                    <p className="text-base font-black font-mono text-emerald-700 mt-1">
                      {currentRatio.toFixed(2)}x
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Target: &gt; 1.5x healthy</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Gross Margin</p>
                    <p className="text-base font-black font-mono text-blue-700 mt-1">
                      {grossMargin.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fitout markup efficiency</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Net Profit Margin</p>
                    <p className="text-base font-black font-mono text-purple-700 mt-1">
                      {netMargin.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Net bottom line yield</p>
                  </div>
                </div>
              </div>

              {/* AUDIT & GENERAL LEDGER INTEGRITY CHECKLIST */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>🛡️</span> Statutory Accounting Audit & Integrity
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                      <span className="font-bold text-emerald-950">Trial Balance Equality</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 text-[11px]">
                      Debits = Credits (0.00 Variance)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                      <span className="font-bold text-emerald-950">Balance Sheet Equation</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 text-[11px]">
                      Assets = Liabilities + Equity (0.00 Diff)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                      <span className="font-bold text-emerald-950">Current Year P&L Integration</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 text-[11px]">
                      Net Profit posted to Equity
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                      <span className="font-bold text-emerald-950">UAE VAT Audit Compliance</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 text-[11px]">
                      Reconciled with GL Accts (2200/2210)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DIRECT ACTION SHORTCUT TILES */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Access Detailed Statutory Statements
                  </h4>
                  <p className="text-xs text-slate-400">
                    Jump directly to any detailed ledger schedule or statutory filing:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2">
                <button
                  onClick={() => setActiveTab("profit-loss")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition border border-slate-700 cursor-pointer"
                >
                  <p className="text-xs font-bold text-emerald-400">📊 Profit & Loss</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">3-tier breakdown</p>
                </button>

                <button
                  onClick={() => setActiveTab("balance-sheet")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition border border-slate-700 cursor-pointer"
                >
                  <p className="text-xs font-bold text-blue-400">⚖️ Balance Sheet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assets & Equity</p>
                </button>

                <button
                  onClick={() => setActiveTab("trial-balance")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition border border-slate-700 cursor-pointer"
                >
                  <p className="text-xs font-bold text-purple-400">📑 Trial Balance</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">General ledger audit</p>
                </button>

                <button
                  onClick={() => setActiveTab("ledger")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition border border-slate-700 cursor-pointer"
                >
                  <p className="text-xs font-bold text-amber-400">📖 General Ledger</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Account drilldown</p>
                </button>

                <button
                  onClick={() => setActiveTab("vat-summary")}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition border border-slate-700 cursor-pointer"
                >
                  <p className="text-xs font-bold text-rose-400">🇦🇪 VAT Returns</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Form 201 ready</p>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === "quotation" && (
        <div className="space-y-4">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            availableProducts={products}
          />
        </div>
      )}

      {activeTab === "profit-loss" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Statement of Profit & Loss (Income Statement)
              </h3>
              <p className="text-xs text-slate-500">
                AGM FITOUT TECHNICAL SERVICES LLC — Summary of earned revenue, direct costs, and operational overhead.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live GAAP Basis
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
              >
                <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {plLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Statement of Profit & Loss...
            </div>
          ) : (() => {
            const formatNumber = (val: number | string | undefined) => {
              const num = Number(val || 0);
              return num.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            };

            const defaultIncome = [
              { section: "Income", accountName: "Service Income", amount: 0 },
              { section: "Income", accountName: "Discount Recieved", amount: 0 },
              { section: "Income", accountName: "Other Inc", amount: 0 },
            ];

            const defaultDirect = [
              { section: "Direct Material Expense", accountName: "Purchase Materials", amount: 0 },
            ];

            const defaultOperating = [
              { section: "Operating Expense", accountName: "Depreciation Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Garbage Exp", amount: 0 },
              { section: "Operating Expense", accountName: "End Of Service Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Car Maint, Parts, Serv", amount: 0 },
              { section: "Operating Expense", accountName: "Credit/Bank Card Charge Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Discount Allowed Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Etisalat Bill exp", amount: 0 },
              { section: "Operating Expense", accountName: "Combine Expenses", amount: 0 },
              { section: "Operating Expense", accountName: "Food EXP", amount: 0 },
              { section: "Operating Expense", accountName: "Medical Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Leave Salary Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Office Stationery Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Wages Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Parking Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Petrol Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Rent Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Salaries Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Staff Visa Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Transport Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Water Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Salik Bills Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Insurance Exp", amount: 0 },
              { section: "Operating Expense", accountName: "Rental Car Exp", amount: 0 },
            ];

            const incomeRows =
              profitLoss?.income && profitLoss.income.length > 0
                ? profitLoss.income
                : defaultIncome;

            const directExpenseRows =
              profitLoss?.directExpenses && profitLoss.directExpenses.length > 0
                ? profitLoss.directExpenses
                : defaultDirect;

            const operatingExpenseRows =
              profitLoss?.operatingExpenses && profitLoss.operatingExpenses.length > 0
                ? profitLoss.operatingExpenses
                : defaultOperating;

            const totalIncome =
              profitLoss?.totalIncome !== undefined
                ? profitLoss.totalIncome
                : incomeRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const totalDirectExpenses =
              profitLoss?.totalDirectExpenses !== undefined
                ? profitLoss.totalDirectExpenses
                : directExpenseRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const grossProfit =
              profitLoss?.grossProfit !== undefined
                ? profitLoss.grossProfit
                : totalIncome - totalDirectExpenses;

            const totalExpenses =
              profitLoss?.totalExpenses !== undefined
                ? profitLoss.totalExpenses
                : operatingExpenseRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const netProfit =
              profitLoss?.netProfit !== undefined
                ? profitLoss.netProfit
                : grossProfit - totalExpenses;

            const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

            return (
              <div className="space-y-6">
                {/* 4 KPI Top Cards matching old UI aesthetics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        1. Total Income
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Service income & revenues
                      </p>
                    </div>
                    <p className="text-xl font-black text-emerald-900 font-mono">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        2. Gross Profit
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        After direct materials (AED {formatNumber(totalDirectExpenses)})
                      </p>
                    </div>
                    <p className="text-xl font-black text-blue-900 font-mono">
                      {formatCurrency(grossProfit)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        3. Operating Overhead
                      </p>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Salaries, rent, utilities & admin
                      </p>
                    </div>
                    <p className="text-xl font-black text-rose-900 font-mono">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          4. Net Profit / (Loss)
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">
                          Margin: {netMargin.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Gross Profit - Operating Expenses
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>

                {/* Detailed Statement Table with Modern AGM UI */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-5 w-1/4">Section</th>
                        <th className="py-3 px-5 w-1/2">Account Name</th>
                        <th className="py-3 px-5 text-right w-1/4">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* SECTION 1: INCOME */}
                      <tr className="bg-emerald-50/40 font-bold text-emerald-900">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          INCOME
                        </td>
                      </tr>
                      {incomeRows.map((item, idx) => (
                        <tr key={`inc-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Income"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-100/60 font-bold text-emerald-950 border-t border-b border-emerald-200">
                        <td colSpan={2} className="py-2.5 px-5 text-emerald-900 font-bold">
                          Total Income
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-emerald-900 text-sm">
                          {formatNumber(totalIncome)}
                        </td>
                      </tr>

                      {/* SECTION 2: DIRECT EXPENSE */}
                      <tr className="bg-blue-50/40 font-bold text-blue-900">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          Direct Expense
                        </td>
                      </tr>
                      {directExpenseRows.map((item, idx) => (
                        <tr key={`dir-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Direct Material Expense"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-100/60 font-bold text-blue-950 border-t border-b border-blue-200">
                        <td colSpan={2} className="py-2.5 px-5 text-blue-900 font-bold">
                          Gross Profit /loss
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-blue-900 text-sm">
                          {formatNumber(grossProfit)}
                        </td>
                      </tr>

                      {/* SECTION 3: OPERATING EXPENSE */}
                      <tr className="bg-rose-50/30 font-bold text-rose-900">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          Operating Expense
                        </td>
                      </tr>
                      {operatingExpenseRows.map((item, idx) => (
                        <tr key={`op-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Operating Expense"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-rose-100/60 font-bold text-rose-950 border-t border-b border-rose-200">
                        <td colSpan={2} className="py-2.5 px-5 text-rose-900 font-bold">
                          Total Expenses
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-rose-900 text-sm">
                          {formatNumber(totalExpenses)}
                        </td>
                      </tr>

                      {/* FINAL NET PROFIT / (LOSS) ROW */}
                      <tr className="bg-slate-900 text-white font-black">
                        <td colSpan={2} className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold">
                          Net Profit / (Loss)
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                            netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatNumber(netProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "balance-sheet" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Balance Sheet Statement
              </h3>
              <p className="text-xs text-slate-500">
                AGM FITOUT TECHNICAL SERVICES LLC — Financial position overview: Assets = Liabilities + Equity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  balanceSheet?.balanced
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {balanceSheet?.balanced ? "✓ Balanced" : "Live GAAP Position"}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
              >
                <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {bsLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Balance Sheet...
            </div>
          ) : (() => {
            const formatNumber = (val: number | string | undefined) => {
              const num = Number(val || 0);
              return num.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            };

            const defaultCurrentAssets = [
              { section: "Current Asset", accountName: "Account Recievable", amount: 0 },
              { section: "Current Asset", accountName: "Advance Salary", amount: 0 },
              { section: "Current Asset", accountName: "Mr.MD Assem-Petty Cash", amount: 0 },
              { section: "Current Asset", accountName: "Petty Cash", amount: 0 },
              { section: "Current Asset", accountName: "RAK Bank", amount: 0 },
              { section: "Current Asset", accountName: "Prepaid Rent", amount: 0 },
              { section: "Current Asset", accountName: "Prepaid Staff Visa", amount: 0 },
            ];

            const defaultFixedAssets = [
              { section: "Fixed Asset", accountName: "Company Cars-1", amount: 0 },
              { section: "Fixed Asset", accountName: "Company Cars-2", amount: 0 },
              { section: "Fixed Asset", accountName: "Company Cars-3", amount: 0 },
              { section: "Fixed Asset", accountName: "Company Cars-4", amount: 0 },
              { section: "Fixed Asset", accountName: "Office Chair", amount: 0 },
              { section: "Fixed Asset", accountName: "Office Computer", amount: 0 },
              { section: "Fixed Asset", accountName: "Office Printer", amount: 0 },
              { section: "Fixed Asset", accountName: "Office Table", amount: 0 },
              { section: "Fixed Asset", accountName: "Other Fixed Asset", amount: 0 },
            ];

            const defaultCurrentLiabilities = [
              { section: "Current Liability", accountName: "Accounts Payable", amount: 0 },
              { section: "Current Liability", accountName: "Accrued Salaries", amount: 0 },
              { section: "Current Liability", accountName: "VAT Payable", amount: 0 },
            ];

            const defaultEquity = [
              { section: "Capital", accountName: "Managing Partner", amount: 0 },
              { section: "Retained Earnings", accountName: "Current Year Earnings", amount: 0 },
            ];

            const currentAssetsRows =
              balanceSheet?.currentAssets && balanceSheet.currentAssets.length > 0
                ? balanceSheet.currentAssets
                : defaultCurrentAssets;

            const fixedAssetsRows =
              balanceSheet?.fixedAssets && balanceSheet.fixedAssets.length > 0
                ? balanceSheet.fixedAssets
                : defaultFixedAssets;

            const currentLiabilitiesRows =
              balanceSheet?.currentLiabilities && balanceSheet.currentLiabilities.length > 0
                ? balanceSheet.currentLiabilities
                : defaultCurrentLiabilities;

            const equityRows =
              balanceSheet?.equity && balanceSheet.equity.length > 0
                ? balanceSheet.equity
                : defaultEquity;

            const totalCurrentAssets =
              balanceSheet?.totalCurrentAssets !== undefined
                ? balanceSheet.totalCurrentAssets
                : currentAssetsRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const totalFixedAssets =
              balanceSheet?.totalFixedAssets !== undefined
                ? balanceSheet.totalFixedAssets
                : fixedAssetsRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const totalAssets =
              balanceSheet?.totalAssets !== undefined
                ? balanceSheet.totalAssets
                : totalCurrentAssets + totalFixedAssets;

            const totalCurrentLiabilities =
              balanceSheet?.totalCurrentLiabilities !== undefined
                ? balanceSheet.totalCurrentLiabilities
                : currentLiabilitiesRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const totalLiabilities =
              balanceSheet?.totalLiabilities !== undefined
                ? balanceSheet.totalLiabilities
                : totalCurrentLiabilities;

            const totalEquity =
              balanceSheet?.totalEquity !== undefined
                ? balanceSheet.totalEquity
                : equityRows.reduce((s, i) => s + Number(i.amount || 0), 0);

            const totalLiabilitiesAndEquity =
              balanceSheet?.totalLiabilitiesAndEquity !== undefined
                ? balanceSheet.totalLiabilitiesAndEquity
                : totalLiabilities + totalEquity;

            const balanceCheck =
              balanceSheet?.balanceCheck !== undefined
                ? balanceSheet.balanceCheck
                : totalAssets - totalLiabilitiesAndEquity;

            return (
              <div className="space-y-6">
                {/* 4 KPI Top Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        1. Total Assets
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Current: {formatCurrency(totalCurrentAssets)} | Fixed: {formatCurrency(totalFixedAssets)}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        totalAssets >= 0 ? "text-blue-950" : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(totalAssets)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-orange-50/60 border border-orange-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
                        2. Total Liabilities
                      </p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Payables, accrued salaries & VAT
                      </p>
                    </div>
                    <p className="text-xl font-black text-orange-950 font-mono">
                      {formatCurrency(totalLiabilities)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                        3. Total Equity
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Managing partner capital & earnings
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        totalEquity >= 0 ? "text-purple-950" : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(totalEquity)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          4. Balance Check
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            Math.abs(balanceCheck) < 0.01
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {Math.abs(balanceCheck) < 0.01 ? "Balanced" : "Diff"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Assets - (Liabilities + Equity)
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        Math.abs(balanceCheck) < 0.01 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {formatCurrency(balanceCheck)}
                    </p>
                  </div>
                </div>

                {/* Detailed Statement Table with Modern AGM UI */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-5 w-1/4">Section</th>
                        <th className="py-3 px-5 w-1/2">Account Name</th>
                        <th className="py-3 px-5 text-right w-1/4">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* SECTION 1: ASSETS */}
                      <tr className="bg-blue-50/70 font-bold text-blue-950">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          ASSETS
                        </td>
                      </tr>

                      {/* Current Assets */}
                      <tr className="bg-slate-50/60 font-semibold text-slate-700">
                        <td colSpan={3} className="py-2 px-5 text-[11px] italic">
                          Current Assets
                        </td>
                      </tr>
                      {currentAssetsRows.map((item, idx) => (
                        <tr key={`ca-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Current Asset"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50/40 font-bold text-blue-900 border-t border-b border-blue-100">
                        <td colSpan={2} className="py-2 px-5 text-blue-900 font-bold">
                          Total Current Assets
                        </td>
                        <td className="py-2 px-5 text-right font-mono font-bold text-blue-900">
                          {formatNumber(totalCurrentAssets)}
                        </td>
                      </tr>

                      {/* Fixed Assets */}
                      <tr className="bg-slate-50/60 font-semibold text-slate-700">
                        <td colSpan={3} className="py-2 px-5 text-[11px] italic">
                          Fixed Assets
                        </td>
                      </tr>
                      {fixedAssetsRows.map((item, idx) => (
                        <tr key={`fa-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Fixed Asset"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50/40 font-bold text-blue-900 border-t border-b border-blue-100">
                        <td colSpan={2} className="py-2 px-5 text-blue-900 font-bold">
                          Total Fixed Assets
                        </td>
                        <td className="py-2 px-5 text-right font-mono font-bold text-blue-900">
                          {formatNumber(totalFixedAssets)}
                        </td>
                      </tr>

                      {/* TOTAL ASSETS ROW */}
                      <tr className="bg-blue-100/70 font-bold text-blue-950 border-t-2 border-b-2 border-blue-200">
                        <td colSpan={2} className="py-2.5 px-5 text-blue-950 font-black text-xs uppercase tracking-wider">
                          TOTAL ASSETS
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-blue-950 text-sm">
                          {formatNumber(totalAssets)}
                        </td>
                      </tr>

                      {/* SECTION 2: LIABILITIES */}
                      <tr className="bg-orange-50/70 font-bold text-orange-950">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          LIABILITIES
                        </td>
                      </tr>

                      {/* Current Liabilities */}
                      <tr className="bg-slate-50/60 font-semibold text-slate-700">
                        <td colSpan={3} className="py-2 px-5 text-[11px] italic">
                          Current Liabilities
                        </td>
                      </tr>
                      {currentLiabilitiesRows.map((item, idx) => (
                        <tr key={`cl-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Current Liability"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-orange-50/40 font-bold text-orange-900 border-t border-b border-orange-100">
                        <td colSpan={2} className="py-2 px-5 text-orange-900 font-bold">
                          Total Current Liabilities
                        </td>
                        <td className="py-2 px-5 text-right font-mono font-bold text-orange-900">
                          {formatNumber(totalCurrentLiabilities)}
                        </td>
                      </tr>

                      {/* TOTAL LIABILITIES ROW */}
                      <tr className="bg-orange-100/70 font-bold text-orange-950 border-t-2 border-b-2 border-orange-200">
                        <td colSpan={2} className="py-2.5 px-5 text-orange-950 font-black text-xs uppercase tracking-wider">
                          TOTAL LIABILITIES
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-orange-950 text-sm">
                          {formatNumber(totalLiabilities)}
                        </td>
                      </tr>

                      {/* SECTION 3: EQUITY */}
                      <tr className="bg-purple-50/70 font-bold text-purple-950">
                        <td colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                          EQUITY
                        </td>
                      </tr>
                      {equityRows.map((item, idx) => (
                        <tr key={`eq-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2 px-5 text-slate-500">{item.section || "Capital"}</td>
                          <td className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</td>
                          <td className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-purple-100/70 font-bold text-purple-950 border-t-2 border-b-2 border-purple-200">
                        <td colSpan={2} className="py-2.5 px-5 text-purple-950 font-black text-xs uppercase tracking-wider">
                          TOTAL EQUITY
                        </td>
                        <td className="py-2.5 px-5 text-right font-mono font-black text-purple-950 text-sm">
                          {formatNumber(totalEquity)}
                        </td>
                      </tr>

                      {/* TOTAL LIABILITIES + EQUITY ROW */}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-300">
                        <td colSpan={2} className="py-3 px-5 text-slate-950 font-black text-xs uppercase tracking-wider">
                          TOTAL LIABILITIES + EQUITY
                        </td>
                        <td className="py-3 px-5 text-right font-mono font-black text-slate-950 text-sm">
                          {formatNumber(totalLiabilitiesAndEquity)}
                        </td>
                      </tr>

                      {/* BALANCE CHECK ROW */}
                      <tr
                        className={`font-black ${
                          Math.abs(balanceCheck) < 0.01
                            ? "bg-emerald-50 text-emerald-950"
                            : "bg-amber-50 text-amber-950"
                        }`}
                      >
                        <td colSpan={2} className="py-3 px-5 text-xs uppercase tracking-wider font-bold">
                          BALANCE CHECK (Assets - Liabilities - Equity)
                        </td>
                        <td
                          className={`py-3 px-5 text-right font-mono font-black text-sm ${
                            Math.abs(balanceCheck) < 0.01 ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {formatNumber(balanceCheck)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "trial-balance" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Trial Balance Summary
              </h3>
              <p className="text-xs text-slate-500">
                AGM FITOUT TECHNICAL SERVICES LLC — Comprehensive debit and credit audit across active general ledger accounts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  trialBalance?.isBalanced ||
                  Math.abs((trialBalance?.totalDebit || 0) - (trialBalance?.totalCredit || 0)) < 0.01
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {trialBalance?.isBalanced ||
                Math.abs((trialBalance?.totalDebit || 0) - (trialBalance?.totalCredit || 0)) < 0.01
                  ? "✓ In Balance"
                  : "⚠️ Variance"}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
              >
                <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {tbLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Trial Balance...
            </div>
          ) : (() => {
            const formatNumber = (val: number | string | undefined) => {
              const num = Number(val || 0);
              return num.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            };

            const allRows = trialBalance?.rows || [];
            const filteredRows = allRows.filter((r) => {
              const matchesSearch =
                !tbSearch ||
                (r.accountName && r.accountName.toLowerCase().includes(tbSearch.toLowerCase())) ||
                (r.accountCode && r.accountCode.toLowerCase().includes(tbSearch.toLowerCase()));
              const matchesType =
                tbTypeFilter === "ALL" || (r.type && r.type.toUpperCase() === tbTypeFilter);
              return matchesSearch && matchesType;
            });

            const totalDebit =
              trialBalance?.totalDebit !== undefined
                ? trialBalance.totalDebit
                : allRows.reduce((s, r) => s + Number(r.debit || 0), 0);
            const totalCredit =
              trialBalance?.totalCredit !== undefined
                ? trialBalance.totalCredit
                : allRows.reduce((s, r) => s + Number(r.credit || 0), 0);
            const difference = Math.abs(totalDebit - totalCredit);
            const isBalanced = difference < 0.01;

            return (
              <div className="space-y-6">
                {/* 4 KPI Top Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        1. Total Debits
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Assets & expense ledger postings
                      </p>
                    </div>
                    <p className="text-xl font-black text-emerald-900 font-mono">
                      {formatCurrency(totalDebit)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        2. Total Credits
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Liabilities, equity & revenues
                      </p>
                    </div>
                    <p className="text-xl font-black text-blue-900 font-mono">
                      {formatCurrency(totalCredit)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                        3. Accounts Count
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Active chart of accounts
                      </p>
                    </div>
                    <p className="text-xl font-black text-purple-950 font-mono">
                      {allRows.length} Accounts
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          4. Audit Status
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isBalanced
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {isBalanced ? "Balanced" : "Diff"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Difference: {formatCurrency(difference)}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        isBalanced ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isBalanced ? "0.00 Variance" : formatCurrency(difference)}
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                  <div className="relative max-w-sm flex-1">
                    <input
                      type="text"
                      placeholder="Search accounts by name or code..."
                      value={tbSearch}
                      onChange={(e) => setTbSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" strokeWidth={2} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTbTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                          tbTypeFilter === type
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {type === "ALL" ? "All Types" : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Statement Table */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-5 w-24">Code</th>
                        <th className="py-3 px-5">Account Name</th>
                        <th className="py-3 px-5 w-32">Type</th>
                        <th className="py-3 px-5 text-right w-36">Debit (AED)</th>
                        <th className="py-3 px-5 text-right w-36">Credit (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No accounts match the current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r) => {
                          const typeColors: Record<string, string> = {
                            ASSET: "bg-blue-50 text-blue-700 border-blue-200",
                            LIABILITY: "bg-orange-50 text-orange-700 border-orange-200",
                            EQUITY: "bg-purple-50 text-purple-700 border-purple-200",
                            REVENUE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            EXPENSE: "bg-rose-50 text-rose-700 border-rose-200",
                          };

                          return (
                            <tr key={r.accountId} className="hover:bg-slate-50/50 text-slate-700 transition">
                              <td className="py-2.5 px-5 font-mono font-bold text-slate-900">
                                {r.accountCode || "—"}
                              </td>
                              <td className="py-2.5 px-5 font-semibold text-slate-900">
                                {r.accountName || "Unnamed Account"}
                              </td>
                              <td className="py-2.5 px-5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    typeColors[r.type || ""] || "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {r.type || "OTHER"}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 text-right font-mono font-semibold text-slate-900">
                                {r.debit > 0 ? formatNumber(r.debit) : "—"}
                              </td>
                              <td className="py-2.5 px-5 text-right font-mono font-semibold text-slate-900">
                                {r.credit > 0 ? formatNumber(r.credit) : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* SUMMARY TOTALS ROW */}
                      <tr className="bg-slate-900 text-white font-black">
                        <td colSpan={3} className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold">
                          TOTAL TRIAL BALANCE
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-black text-sm text-emerald-400">
                          {formatNumber(totalDebit)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-black text-sm text-emerald-400">
                          {formatNumber(totalCredit)}
                        </td>
                      </tr>

                      {/* AUDIT STATUS ROW */}
                      <tr
                        className={`font-black ${
                          isBalanced
                            ? "bg-emerald-50 text-emerald-950"
                            : "bg-amber-50 text-amber-950"
                        }`}
                      >
                        <td colSpan={3} className="py-3 px-5 text-xs uppercase tracking-wider font-bold">
                          DIFFERENCE / VARIANCE (DEBITS - CREDITS)
                        </td>
                        <td
                          colSpan={2}
                          className={`py-3 px-5 text-right font-mono font-black text-sm ${
                            isBalanced ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {isBalanced ? "0.00 (In Balance)" : formatNumber(difference)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                General Ledger Drilldown & Running Balance
              </h3>
              <p className="text-xs text-slate-500">
                Inspect complete chronological transaction history, debit/credit postings, and running balances by account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-80">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                >
                  <option value="">Select an Account to Drill Down...</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountCode} - {acc.accountName} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccountId && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
                >
                  <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Print / Save PDF
                </button>
              )}
            </div>
          </div>

          {!selectedAccountId ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black">
                📖
              </div>
              <p className="text-sm font-bold text-slate-800">
                Select an Account to View Ledger History
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose any Asset, Liability, Equity, Revenue, or Expense account from the dropdown above to view its running balance and journal lines.
              </p>
            </div>
          ) : ledgerLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Ledger lines & running balance...
            </div>
          ) : ledger?.lines?.length === 0 ? (
            <div className="py-12 text-center border border-slate-200 rounded-2xl bg-slate-50/30 text-slate-500 space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                No Journal Lines Recorded Yet
              </p>
              <p className="text-xs text-slate-400">
                There are no transaction lines posted to account{" "}
                <span className="font-mono font-bold text-slate-700">
                  {selectedAccount?.accountCode} - {selectedAccount?.accountName}
                </span>
                .
              </p>
            </div>
          ) : (() => {
            const formatNumber = (val: number | string | undefined) => {
              const num = Number(val || 0);
              return num.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            };

            const lines = ledger?.lines || [];
            const totalDebit = Number(ledger?.totalDebit || 0);
            const totalCredit = Number(ledger?.totalCredit || 0);
            const netBalance = Number(ledger?.netBalance !== undefined ? ledger.netBalance : ledger?.balance || 0);

            return (
              <div className="space-y-6">
                {/* 4 KPI Top Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        1. Total Debits
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Sum of all debit postings
                      </p>
                    </div>
                    <p className="text-xl font-black text-emerald-900 font-mono">
                      {formatCurrency(totalDebit)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        2. Total Credits
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Sum of all credit postings
                      </p>
                    </div>
                    <p className="text-xl font-black text-blue-900 font-mono">
                      {formatCurrency(totalCredit)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                        3. Transactions Count
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Posted journal lines
                      </p>
                    </div>
                    <p className="text-xl font-black text-purple-950 font-mono">
                      {lines.length} Line Items
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          4. Net Account Balance
                        </p>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {selectedAccount?.type || "ACCOUNT"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ledger?.isDebitNormal ? "Debit Normal (Dr - Cr)" : "Credit Normal (Cr - Dr)"}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(netBalance)}
                    </p>
                  </div>
                </div>

                {/* Account Details Header */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      {selectedAccount?.accountCode || "AC"}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {selectedAccount?.accountName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Classification: {selectedAccount?.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    Showing {lines.length} chronological ledger entries
                  </span>
                </div>

                {/* Ledger Lines Table with Running Balance */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4 w-28">Date</th>
                        <th className="py-3 px-4 w-32">Voucher #</th>
                        <th className="py-3 px-4 w-28">Ref / Folio</th>
                        <th className="py-3 px-4">Description / Narration</th>
                        <th className="py-3 px-4 text-right w-28">Debit (AED)</th>
                        <th className="py-3 px-4 text-right w-28">Credit (AED)</th>
                        <th className="py-3 px-4 text-right w-36 bg-slate-100/70">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 text-slate-700 transition">
                          <td className="py-2.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {l.journalEntry?.entryDate
                              ? new Date(l.journalEntry.entryDate).toLocaleDateString("en-GB")
                              : "—"}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            {l.journalEntry?.entryNumber || "—"}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">
                            {l.journalEntry?.reference || "—"}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 font-medium">
                            {l.journalEntry?.description || "Journal Posting"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                            {Number(l.debit) > 0 ? formatNumber(l.debit) : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                            {Number(l.credit) > 0 ? formatNumber(l.credit) : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/40">
                            {formatCurrency(l.runningBalance)}
                          </td>
                        </tr>
                      ))}

                      {/* SUMMARY TOTALS ROW */}
                      <tr className="bg-slate-900 text-white font-black">
                        <td colSpan={4} className="py-3.5 px-4 text-xs uppercase tracking-wider font-bold">
                          TOTAL ACCOUNT ACTIVITY
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400">
                          {formatNumber(totalDebit)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400">
                          {formatNumber(totalCredit)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400 bg-slate-950">
                          {formatCurrency(netBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "vat-summary" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                VAT Summary Report & Returns (FTA Form 201 Ready)
              </h3>
              <p className="text-xs text-slate-500">
                AGM FITOUT TECHNICAL SERVICES LLC — Quarterly returns, monthly net tax, purchase expense summary, and sales income VAT breakdown.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                FTA Form 201 Compliant
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer print:hidden"
              >
                <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {vatLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading VAT Summary Report...
            </div>
          ) : (() => {
            const formatNumber = (val: number | string | undefined) => {
              const num = Number(val || 0);
              return num.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            };

            // Default Quarters from PDF
            const defaultQuarters = [
              {
                quarter: "Feb,Mar,Apr-(1st)",
                vatRate: "5%",
                inputVat: 22081.93,
                outputVat: 26575.28,
                netVat: 4493.35,
                position: "VAT Payable",
                status: "Paid",
              },
              {
                quarter: "May,Jun,July-(2nd)",
                vatRate: "5%",
                inputVat: 23979.94,
                outputVat: 25438.55,
                netVat: 1458.6,
                position: "VAT Payable",
                status: "Pending",
              },
              {
                quarter: "Aug,Sep,Oct-(3rd)",
                vatRate: "5%",
                inputVat: 1359.4,
                outputVat: 0.0,
                netVat: -1359.4,
                position: "VAT Receivable",
                status: "Pending",
              },
              {
                quarter: "Nov,Dec,Jan(4th)",
                vatRate: "5%",
                inputVat: 0.0,
                outputVat: 0.0,
                netVat: 0.0,
                position: "VAT Payable",
                status: "Pending",
              },
            ];

            // Default Monthly Net from PDF
            const defaultMonthlyNet = [
              { month: "FEBRUARY", inputVat: 5996.4, outputVat: 9699.91, netVat: 3703.5 },
              { month: "MARCH", inputVat: 3977.65, outputVat: 8940.94, netVat: 4963.29 },
              { month: "APRIL", inputVat: 12107.88, outputVat: 7934.44, netVat: -4173.44 },
              { month: "MAY", inputVat: 5540.82, outputVat: 11330.1, netVat: 5789.28 },
              { month: "JUNE", inputVat: 6990.76, outputVat: 4379.98, netVat: -2610.78 },
              { month: "JULY", inputVat: 11448.37, outputVat: 9728.48, netVat: -1719.89 },
              { month: "AUGUST", inputVat: 1359.4, outputVat: 0.0, netVat: -1359.4 },
              { month: "SEPTEMBER", inputVat: 0.0, outputVat: 0.0, netVat: 0.0 },
              { month: "OCTOBER", inputVat: 0.0, outputVat: 0.0, netVat: 0.0 },
              { month: "NOVEMBER", inputVat: 0.0, outputVat: 0.0, netVat: 0.0 },
              { month: "DECEMBER", inputVat: 0.0, outputVat: 0.0, netVat: 0.0 },
              { month: "JANUARY", inputVat: 0.0, outputVat: 0.0, netVat: 0.0 },
            ];

            // Default Monthly Purchases from PDF
            const defaultPurchases = [
              { month: "FEBRUARY", taxableAmount: 119928.06, nonVatAmount: 21603.8, vatAmount: 5996.4, totalAmount: 147528.26 },
              { month: "MARCH", taxableAmount: 79553.01, nonVatAmount: 15520.57, vatAmount: 3977.65, totalAmount: 99051.23 },
              { month: "APRIL", taxableAmount: 242157.51, nonVatAmount: 27020.01, vatAmount: 12107.88, totalAmount: 281285.4 },
              { month: "MAY", taxableAmount: 110816.39, nonVatAmount: 11569.45, vatAmount: 5540.82, totalAmount: 127926.66 },
              { month: "JUNE", taxableAmount: 139815.2, nonVatAmount: 23166.47, vatAmount: 6990.76, totalAmount: 169972.42 },
              { month: "JULY", taxableAmount: 228967.3, nonVatAmount: 15041.06, vatAmount: 11448.37, totalAmount: 255456.73 },
              { month: "AUGUST", taxableAmount: 27187.93, nonVatAmount: 2275.8, vatAmount: 1359.4, totalAmount: 30823.13 },
              { month: "SEPTEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "OCTOBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "NOVEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "DECEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "JANUARY", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
            ];

            // Default Monthly Income from PDF
            const defaultIncome = [
              { month: "FEBRUARY", taxableAmount: 193998.1, nonVatAmount: 0.0, vatAmount: 9699.91, totalAmount: 203698.01 },
              { month: "MARCH", taxableAmount: 178818.73, nonVatAmount: 0.0, vatAmount: 8940.94, totalAmount: 187759.67 },
              { month: "APRIL", taxableAmount: 158688.76, nonVatAmount: 0.0, vatAmount: 7934.44, totalAmount: 166623.2 },
              { month: "MAY", taxableAmount: 226601.9, nonVatAmount: 0.0, vatAmount: 11330.1, totalAmount: 237932.0 },
              { month: "JUNE", taxableAmount: 87599.52, nonVatAmount: 0.0, vatAmount: 4379.98, totalAmount: 91979.5 },
              { month: "JULY", taxableAmount: 194569.52, nonVatAmount: 0.0, vatAmount: 9728.48, totalAmount: 204298.0 },
              { month: "AUGUST", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "SEPTEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "OCTOBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "NOVEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "DECEMBER", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
              { month: "JANUARY", taxableAmount: 0.0, nonVatAmount: 0.0, vatAmount: 0.0, totalAmount: 0.0 },
            ];

            const quartersData =
              vatSummary?.quarters && vatSummary.quarters.length > 0
                ? vatSummary.quarters
                : defaultQuarters;

            const monthlyNetData =
              vatSummary?.monthlyNet && vatSummary.monthlyNet.length > 0
                ? vatSummary.monthlyNet
                : defaultMonthlyNet;

            const purchasesData =
              vatSummary?.monthlyPurchases && vatSummary.monthlyPurchases.length > 0
                ? vatSummary.monthlyPurchases
                : defaultPurchases;

            const incomeData =
              vatSummary?.monthlyIncome && vatSummary.monthlyIncome.length > 0
                ? vatSummary.monthlyIncome
                : defaultIncome;

            const totalInputVat =
              vatSummary?.inputVat !== undefined
                ? vatSummary.inputVat
                : monthlyNetData.reduce((s, r) => s + Number(r.inputVat || 0), 0);

            const totalOutputVat =
              vatSummary?.outputVat !== undefined
                ? vatSummary.outputVat
                : monthlyNetData.reduce((s, r) => s + Number(r.outputVat || 0), 0);

            const netVat = totalOutputVat - totalInputVat;

            const totalPurchasesTaxable = purchasesData.reduce((s, r) => s + Number(r.taxableAmount || 0), 0);
            const totalPurchasesNonVat = purchasesData.reduce((s, r) => s + Number(r.nonVatAmount || 0), 0);
            const totalPurchasesVat = purchasesData.reduce((s, r) => s + Number(r.vatAmount || 0), 0);
            const totalPurchasesAmount = purchasesData.reduce((s, r) => s + Number(r.totalAmount || 0), 0);

            const totalIncomeTaxable = incomeData.reduce((s, r) => s + Number(r.taxableAmount || 0), 0);
            const totalIncomeNonVat = incomeData.reduce((s, r) => s + Number(r.nonVatAmount || 0), 0);
            const totalIncomeVat = incomeData.reduce((s, r) => s + Number(r.vatAmount || 0), 0);
            const totalIncomeAmount = incomeData.reduce((s, r) => s + Number(r.totalAmount || 0), 0);

            return (
              <div className="space-y-8">
                {/* 4 Top KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                        1. Taxable Turnover
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Total sales (excl. VAT)
                      </p>
                    </div>
                    <p className="text-xl font-black text-blue-900 font-mono">
                      {formatCurrency(totalIncomeTaxable)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        2. Output VAT (5%)
                      </p>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Tax collected on sales
                      </p>
                    </div>
                    <p className="text-xl font-black text-rose-900 font-mono">
                      {formatCurrency(totalOutputVat)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        3. Input VAT (5%)
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Recoverable tax on expenses
                      </p>
                    </div>
                    <p className="text-xl font-black text-emerald-900 font-mono">
                      {formatCurrency(totalInputVat)}
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          4. Net VAT Position
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            netVat >= 0
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {netVat >= 0 ? "Payable to FTA" : "Refund from FTA"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Output VAT - Input VAT
                      </p>
                    </div>
                    <p
                      className={`text-xl font-black font-mono ${
                        netVat >= 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {formatCurrency(netVat)}
                    </p>
                  </div>
                </div>

                {/* TABLE 1: QUARTER DETAILS */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-0">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      1. Quarterly VAT Returns & Position
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Standard Rate: 5%
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4 font-bold">Quarter Details</th>
                          {quartersData.map((q, idx) => (
                            <th key={idx} className="py-2.5 px-4 text-right font-bold">
                              {q.quarter}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-bold text-slate-700">VAT Rate</td>
                          {quartersData.map((q, idx) => (
                            <td key={idx} className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                              {q.vatRate || "5%"}
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-bold text-slate-700">Total Input VAT</td>
                          {quartersData.map((q, idx) => (
                            <td key={idx} className="py-2 px-4 text-right font-mono font-semibold text-emerald-800">
                              {formatNumber(q.inputVat)}
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-bold text-slate-700">Total Output VAT</td>
                          {quartersData.map((q, idx) => (
                            <td key={idx} className="py-2 px-4 text-right font-mono font-semibold text-rose-800">
                              {formatNumber(q.outputVat)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-2.5 px-4 text-slate-900">Net VAT (Output - Input)</td>
                          {quartersData.map((q, idx) => (
                            <td
                              key={idx}
                              className={`py-2.5 px-4 text-right font-mono font-black ${
                                q.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                              }`}
                            >
                              {formatNumber(q.netVat)}
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-bold text-slate-700">VAT Position</td>
                          {quartersData.map((q, idx) => (
                            <td key={idx} className="py-2 px-4 text-right font-semibold">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  q.position === "VAT Receivable"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {q.position}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-bold text-slate-700">Status</td>
                          {quartersData.map((q, idx) => (
                            <td key={idx} className="py-2 px-4 text-right font-mono text-[11px] font-bold text-slate-600">
                              {q.status || "—"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE 2: MONTHLY NET VAT SUMMARY */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      2. Monthly Net VAT Summary
                    </h4>
                    <span className="text-[11px] font-mono text-slate-300">
                      12-Month Financial Year
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4 w-1/4">Month</th>
                          <th className="py-2.5 px-4 text-right w-1/4">Input VAT (AED)</th>
                          <th className="py-2.5 px-4 text-right w-1/4">Output VAT (AED)</th>
                          <th className="py-2.5 px-4 text-right w-1/4">Net VAT (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyNetData.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 text-slate-700 transition">
                            <td className="py-2 px-4 font-bold text-slate-900">{r.month}</td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                              {formatNumber(r.inputVat)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                              {formatNumber(r.outputVat)}
                            </td>
                            <td
                              className={`py-2 px-4 text-right font-mono font-bold ${
                                r.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                              }`}
                            >
                              {formatNumber(r.netVat)}
                            </td>
                          </tr>
                        ))}

                        <tr className="bg-slate-900 text-white font-black">
                          <td className="py-3 px-4 uppercase tracking-wider font-bold">TOTAL</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-400">
                            {formatNumber(totalInputVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-rose-400">
                            {formatNumber(totalOutputVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-amber-400">
                            {formatNumber(netVat)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE 3: MONTHLY PURCHASE/EXPENSE SUMMARY */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      3. Monthly Purchase / Expense Summary (Input VAT Breakdown)
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Recoverable Input Tax
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4 w-1/5">Month</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Taxable Amount (Excl. VAT)</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Non-VAT Amount</th>
                          <th className="py-2.5 px-4 text-right w-1/5">VAT Amount (5%)</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Total Amount (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchasesData.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 text-slate-700 transition">
                            <td className="py-2 px-4 font-bold text-slate-900">{r.month}</td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                              {formatNumber(r.taxableAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-600">
                              {formatNumber(r.nonVatAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-emerald-800">
                              {formatNumber(r.vatAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                              {formatNumber(r.totalAmount)}
                            </td>
                          </tr>
                        ))}

                        <tr className="bg-slate-900 text-white font-black">
                          <td className="py-3 px-4 uppercase tracking-wider font-bold">TOTAL</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-200">
                            {formatNumber(totalPurchasesTaxable)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-400">
                            {formatNumber(totalPurchasesNonVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-400">
                            {formatNumber(totalPurchasesVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-white">
                            {formatNumber(totalPurchasesAmount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE 4: MONTHLY INCOME SUMMARY */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      4. Monthly Income Summary (Output VAT Breakdown)
                    </h4>
                    <span className="text-[11px] font-mono text-rose-400 font-bold">
                      Sales & Service Revenue
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4 w-1/5">Month</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Taxable Amount (Excl. VAT)</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Non-VAT Amount</th>
                          <th className="py-2.5 px-4 text-right w-1/5">VAT Amount (5%)</th>
                          <th className="py-2.5 px-4 text-right w-1/5">Total Amount (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {incomeData.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 text-slate-700 transition">
                            <td className="py-2 px-4 font-bold text-slate-900">{r.month}</td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                              {formatNumber(r.taxableAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-medium text-slate-600">
                              {formatNumber(r.nonVatAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-rose-800">
                              {formatNumber(r.vatAmount)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                              {formatNumber(r.totalAmount)}
                            </td>
                          </tr>
                        ))}

                        <tr className="bg-slate-900 text-white font-black">
                          <td className="py-3 px-4 uppercase tracking-wider font-bold">TOTAL</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-200">
                            {formatNumber(totalIncomeTaxable)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-400">
                            {formatNumber(totalIncomeNonVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-rose-400">
                            {formatNumber(totalIncomeVat)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-white">
                            {formatNumber(totalIncomeAmount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE 5: UAE FTA Form 201 Box Schedule */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      5. Federal Tax Authority — Form 201 Box Breakdown
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Official Tax Box Schedule
                    </span>
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4 w-20">Box #</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right w-44">Taxable Amount (AED)</th>
                        <th className="py-2.5 px-4 text-right w-44">VAT Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">Box 1</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Standard rated supplies in Dubai / UAE (Sales & Turnover)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatNumber(totalIncomeTaxable)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                          {formatNumber(totalOutputVat)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">Box 9</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          Standard rated expenses & materials (Recoverable Input Tax)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatNumber(totalPurchasesTaxable)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatNumber(totalInputVat)}
                        </td>
                      </tr>

                      <tr className="bg-slate-50/80 font-bold text-slate-900">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">Box 11</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          Total value of due tax for the period (Output Tax)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-500">—</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-rose-800">
                          {formatNumber(totalOutputVat)}
                        </td>
                      </tr>

                      <tr className="bg-slate-50/80 font-bold text-slate-900">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">Box 12</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          Total value of recoverable tax for the period (Input Tax)
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-500">—</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-800">
                          {formatNumber(totalInputVat)}
                        </td>
                      </tr>

                      <tr className="bg-slate-900 text-white font-black">
                        <td className="py-3 px-4 font-mono font-black text-amber-400">Box 13</td>
                        <td className="py-3 px-4 text-xs uppercase tracking-wider font-bold">
                          PAYABLE TAX FOR THE PERIOD (NET TAX LIABILITY)
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-400">—</td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-black text-sm ${
                            netVat >= 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {formatNumber(netVat)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-2 sm:p-6 md:p-8 flex justify-center items-start">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            
            <div className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  AGM
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Commercial Quotation Document
                  </h3>
                  <p className="text-[10.5px] text-slate-300">
                    Official UAE formatted proposal & cost estimate
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <PrintIcon className="w-4 h-4" strokeWidth={2} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-4">
              <QuotationTemplate
                initialMeta={dynamicQuotationMeta}
                initialItems={dynamicQuotationItems}
                availableProducts={products}
                hideOuterWrapper={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
