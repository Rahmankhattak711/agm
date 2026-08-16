"use client";

import AgmLogo from "@/components/AgmLogo";
import {
  useAccounts,
  useBalanceSheet,
  useLedger,
  useProfitLoss,
  useTrialBalance,
  useVatSummary,
} from "@/lib/hooks/api-hooks";
import { useState } from "react";

type ReportTab =
  | "profit-loss"
  | "balance-sheet"
  | "trial-balance"
  | "ledger"
  | "vat-summary";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("profit-loss");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: trialBalance, isLoading: tbLoading } = useTrialBalance();
  const { data: vatSummary, isLoading: vatLoading } = useVatSummary();
  const { data: accounts } = useAccounts();
  const { data: ledger, isLoading: ledgerLoading } = useLedger(
    selectedAccountId || null,
  );

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: "profit-loss", label: "Profit & Loss", icon: "📊" },
    { id: "balance-sheet", label: "Balance Sheet", icon: "⚖️" },
    { id: "trial-balance", label: "Trial Balance", icon: "📑" },
    { id: "ledger", label: "General Ledger", icon: "📖" },
    { id: "vat-summary", label: "VAT Position", icon: "🇦🇪" },
  ];

  const getReportTitle = (tab: ReportTab) => {
    switch (tab) {
      case "profit-loss":
        return "STATEMENT OF PROFIT & LOSS (INCOME STATEMENT)";
      case "balance-sheet":
        return "BALANCE SHEET STATEMENT OF FINANCIAL POSITION";
      case "trial-balance":
        return "GENERAL TRIAL BALANCE MATRIX";
      case "ledger":
        return `GENERAL LEDGER STATEMENT - ${selectedAccount?.accountCode || ""} ${selectedAccount?.accountName || ""}`;
      case "vat-summary":
        return "UAE VAT RETURN POSITION SUMMARY (FTA 201)";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Print Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Financial Reports & Statements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time statutory accounting reports, financial statements, trial
            balance, and UAE VAT position.
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Statement / Bill
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 self-start">
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

      {/* Tab 1: Profit & Loss */}
      {activeTab === "profit-loss" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Statement of Profit & Loss (Income Statement)
              </h3>
              <p className="text-xs text-slate-500">
                Summary of earned revenue vs operational expenses.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live GAAP Basis
              </span>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {plLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Statement...
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Operating Revenue / Turnover
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Fitout, contracting and commercial services
                  </p>
                </div>
                <p className="text-lg font-black text-emerald-800 font-mono">
                  {formatCurrency(profitLoss?.revenue || 0)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-900">
                    Operating & Administrative Expenses
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Salaries, materials, rent, depreciation
                  </p>
                </div>
                <p className="text-lg font-black text-rose-800 font-mono">
                  {formatCurrency(profitLoss?.expenses || 0)}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Net Profit / (Loss)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Net Margin:{" "}
                    {(
                      ((profitLoss?.netIncome || 0) /
                        (profitLoss?.revenue || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <p
                  className={`text-2xl font-black font-mono ${
                    (profitLoss?.netIncome || 0) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {formatCurrency(profitLoss?.netIncome || 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Balance Sheet */}
      {activeTab === "balance-sheet" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Balance Sheet Statement
              </h3>
              <p className="text-xs text-slate-500">
                Financial position overview: Assets = Liabilities + Equity
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
                {balanceSheet?.balanced ? "✓ Balanced" : "⚠ Discrepancy"}
              </span>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {bsLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Balance Sheet...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  1. Total Assets
                </p>
                <p className="text-2xl font-black text-blue-950 font-mono">
                  {formatCurrency(balanceSheet?.assets || 0)}
                </p>
                <p className="text-xs text-blue-800">
                  Cash, receivables, bank, fixed assets & equipment
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                  2. Total Liabilities
                </p>
                <p className="text-2xl font-black text-orange-950 font-mono">
                  {formatCurrency(balanceSheet?.liabilities || 0)}
                </p>
                <p className="text-xs text-orange-800">
                  Accounts payable, VAT payables, short-term debt
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  3. Total Equity
                </p>
                <p className="text-2xl font-black text-purple-950 font-mono">
                  {formatCurrency(balanceSheet?.equity || 0)}
                </p>
                <p className="text-xs text-purple-800">
                  Share capital, retained earnings & reserves
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trial Balance */}
      {activeTab === "trial-balance" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Trial Balance
              </h3>
              <p className="text-xs text-slate-500">
                Summary of total debits and credits across active ledger
                accounts.
              </p>
            </div>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              🖨️ Print
            </button>
          </div>

          {tbLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Trial Balance...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">Account Name</th>
                    <th className="pb-3 px-3 text-right">Debit (AED)</th>
                    <th className="pb-3 px-3 text-right">Credit (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance?.rows?.map((r) => (
                    <tr key={r.accountId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {r.accountName || "Account"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                        {r.debit > 0 ? formatCurrency(r.debit) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                        {r.credit > 0 ? formatCurrency(r.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold bg-slate-50 text-slate-900">
                    <td className="py-3.5 px-3 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-800 font-black">
                      {formatCurrency(trialBalance?.totalDebit || 0)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-800 font-black">
                      {formatCurrency(trialBalance?.totalCredit || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: General Ledger */}
      {activeTab === "ledger" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                General Ledger Drilldown
              </h3>
              <p className="text-xs text-slate-500">
                Inspect transaction line history and running balance for a
                specific account.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full sm:w-72">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="">Select an Account...</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountCode} - {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccountId && (
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  🖨️ Print
                </button>
              )}
            </div>
          </div>

          {!selectedAccountId ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">
                Select an account to view its ledger
              </p>
              <p className="text-xs mt-1">
                Choose an account from the dropdown above to display all journal
                lines.
              </p>
            </div>
          ) : ledgerLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading Ledger lines...
            </div>
          ) : ledger?.lines?.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">
                No journal lines found for this account
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Total Debits
                  </p>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {formatCurrency(ledger?.totalDebit)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Total Credits
                  </p>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {formatCurrency(ledger?.totalCredit)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Net Account Balance
                  </p>
                  <p className="text-base font-black font-mono mt-0.5 text-emerald-400">
                    {formatCurrency(ledger?.balance)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3">Entry #</th>
                      <th className="pb-3 px-3">Description</th>
                      <th className="pb-3 px-3 text-right">Debit</th>
                      <th className="pb-3 px-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger?.lines?.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 text-slate-600">
                          {line.journalEntry?.entryDate
                            ? new Date(
                                line.journalEntry.entryDate,
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {line.journalEntry?.entryNumber || "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {line.journalEntry?.description || "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {Number(line.debit) > 0
                            ? formatCurrency(line.debit)
                            : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {Number(line.credit) > 0
                            ? formatCurrency(line.credit)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: VAT Summary */}
      {activeTab === "vat-summary" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                UAE VAT Position & Return Summary
              </h3>
              <p className="text-xs text-slate-500">
                Standard 5% VAT on sales and recoverable purchases.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                FTA Form 201 Ready
              </span>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {vatLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading VAT Return...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Output VAT (Tax on Sales)
                </p>
                <p className="text-2xl font-black text-rose-950 font-mono">
                  {formatCurrency(vatSummary?.outputVat || 0)}
                </p>
                <p className="text-xs text-rose-800">
                  Collected on taxable fitout & services rendered
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Input VAT (Recoverable Tax)
                </p>
                <p className="text-2xl font-black text-emerald-950 font-mono">
                  {formatCurrency(vatSummary?.inputVat || 0)}
                </p>
                <p className="text-xs text-emerald-800">
                  Paid on allowable supplier invoices & expenses
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Net Tax Payable / (Refund)
                </p>
                <p
                  className={`text-2xl font-black font-mono ${
                    (vatSummary?.net || 0) >= 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {formatCurrency(vatSummary?.net || 0)}
                </p>
                <p className="text-xs text-slate-300">
                  {(vatSummary?.net || 0) >= 0
                    ? "Amount payable to FTA"
                    : "Refundable from FTA"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Printable Financial Statement Document */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6 md:p-8 flex justify-center items-start">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* Top Sticky Toolbar */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Financial Statement Preview
                  </h3>
                  <p className="text-[10.5px] text-slate-300">
                    A4 statutory statement format · Ready for print & export
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
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

            {/* Printable Document Area */}
            <div
              className="p-6 sm:p-10 md:p-12 space-y-6 text-slate-900 bg-white"
              id="printable-statement"
            >
              {/* Header with AGM Branding */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
                <div className="space-y-1.5">
                  <AgmLogo size="md" collapsed={false} />
                  <div className="text-xs text-slate-600 pt-1 leading-relaxed">
                    <p className="font-bold text-slate-900">
                      AGM AESTHETIC HOUSE FITOUT COMPANY LLC
                    </p>
                    <p className="text-[11px] text-slate-500">
                      TRN / Tax Reg: 100234567890003
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Business Bay, Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1.5 shrink-0">
                  <span className="inline-block px-3.5 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-xs">
                    FINANCIAL REPORT
                  </span>
                  <div className="space-y-0.5 pt-1 text-xs">
                    <p className="text-slate-600">
                      GENERATED:{" "}
                      <span className="font-semibold text-slate-900">
                        {new Date().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    <p className="font-bold text-slate-900">CURRENCY: AED</p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                  {getReportTitle(activeTab)}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Official Financial Statement
                </p>
              </div>

              {/* Dynamic Content based on Active Tab */}
              {activeTab === "profit-loss" && (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Particulars
                        </th>
                        <th className="py-2.5 px-3 text-right">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          Total Operating Turnover / Revenue
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(profitLoss?.revenue || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-200">
                          Total Operating & Administrative Expenses
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800">
                          {formatCurrency(profitLoss?.expenses || 0)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td className="py-3 px-3 uppercase border-r border-slate-200">
                          NET PROFIT / (LOSS)
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base text-slate-900">
                          {formatCurrency(profitLoss?.netIncome || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === "balance-sheet" && (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Classification
                        </th>
                        <th className="py-2.5 px-3 text-right">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-blue-900 border-r border-slate-200">
                          1. Total Assets (Current & Non-Current)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(balanceSheet?.assets || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-orange-900 border-r border-slate-200">
                          2. Total Liabilities (Current & Long-Term)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(balanceSheet?.liabilities || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-purple-900 border-r border-slate-200">
                          3. Total Equity (Capital & Retained Earnings)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(balanceSheet?.equity || 0)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td className="py-3 px-3 uppercase border-r border-slate-200">
                          TOTAL LIABILITIES & EQUITY
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base text-slate-900">
                          {formatCurrency(
                            (balanceSheet?.liabilities || 0) +
                              (balanceSheet?.equity || 0),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === "trial-balance" && (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Account Name
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-right">
                          Debit (AED)
                        </th>
                        <th className="py-2.5 px-3 text-right">Credit (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {trialBalance?.rows?.map((r) => (
                        <tr key={r.accountId}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200">
                            {r.accountName || "Account"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200">
                            {r.debit > 0 ? formatCurrency(r.debit) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {r.credit > 0 ? formatCurrency(r.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td className="py-3 px-3 uppercase border-r border-slate-200">
                          TOTAL
                        </td>
                        <td className="py-3 px-3 text-right font-mono border-r border-slate-200">
                          {formatCurrency(trialBalance?.totalDebit || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatCurrency(trialBalance?.totalCredit || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === "ledger" && (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Date
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Entry #
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          Description
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-right">
                          Debit
                        </th>
                        <th className="py-2.5 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {ledger?.lines?.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                            {line.journalEntry?.entryDate
                              ? new Date(
                                  line.journalEntry.entryDate,
                                ).toLocaleDateString("en-GB")
                              : "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-200">
                            {line.journalEntry?.entryNumber || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                            {line.journalEntry?.description || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold border-r border-slate-200">
                            {Number(line.debit) > 0
                              ? formatCurrency(line.debit)
                              : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {Number(line.credit) > 0
                              ? formatCurrency(line.credit)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td
                          colSpan={3}
                          className="py-3 px-3 uppercase border-r border-slate-200"
                        >
                          NET RUNNING BALANCE
                        </td>
                        <td
                          colSpan={2}
                          className="py-3 px-3 text-right font-mono text-base"
                        >
                          {formatCurrency(ledger?.balance || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === "vat-summary" && (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border border-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          VAT Component
                        </th>
                        <th className="py-2.5 px-3 text-right">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-rose-900 border-r border-slate-200">
                          Output VAT (5% on Fitout Sales / Turnover)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(vatSummary?.outputVat || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-emerald-900 border-r border-slate-200">
                          Input VAT (5% Recoverable on Supplier Purchases)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(vatSummary?.inputVat || 0)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                        <td className="py-3 px-3 uppercase border-r border-slate-200">
                          NET VAT PAYABLE TO FTA
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base">
                          {formatCurrency(vatSummary?.net || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Signatures & Authorizations */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="h-14 border-b-2 border-dotted border-slate-400 mb-2" />
                  <p className="font-bold text-slate-900">Prepared By</p>
                  <p className="text-[10px] text-slate-400">
                    Senior Accountant
                  </p>
                </div>
                <div>
                  <div className="h-14 border-b-2 border-dotted border-slate-400 mb-2" />
                  <p className="font-bold text-slate-900">Reviewed By</p>
                  <p className="text-[10px] text-slate-400">
                    Chief Financial Officer
                  </p>
                </div>
                <div>
                  <div className="h-14 border-b-2 border-dotted border-slate-400 mb-2" />
                  <p className="font-bold text-slate-900">
                    Authorized Signatory
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Managing Director / Partner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
