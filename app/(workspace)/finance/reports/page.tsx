"use client";

import {
  useAccounts,
  useBalanceSheet,
  useLedger,
  useProfitLoss,
  useTrialBalance,
  useVatSummary,
} from "@/lib/hooks/api-hooks";
import { ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AccountsPayableReport,
  AccountsReceivableReport,
  BalanceSheetReport,
  ExecutiveSummaryReport,
  GeneralLedgerReport,
  ProfitLossReport,
  ReportTab,
  ReportsHubView,
  StatementOfAccountReport,
  TaxInvoicesReport,
  TrialBalanceReport,
  VatPositionReport,
} from "./components";

function ReportsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ReportTab | null;
  const [activeTab, setActiveTab] = useState<ReportTab>(
    tabParam && tabParam !== "quotation" ? tabParam : "hub",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    if (tabParam && tabParam !== "quotation") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: trialBalance, isLoading: tbLoading } = useTrialBalance();
  const { data: vatSummary, isLoading: vatLoading } = useVatSummary();
  const { data: accounts } = useAccounts();
  const { data: ledger, isLoading: ledgerLoading } = useLedger(
    selectedAccountId || null,
  );

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  const reportTitles: Record<string, string> = {
    summary: "Executive Summary",
    "statement-of-account": "Statement of Account (SOA)",
    soa: "Statement of Account (SOA)",
    "tax-invoices": "Tax Invoices",
    "profit-loss": "Profit & Loss",
    "balance-sheet": "Balance Sheet",
    "trial-balance": "Trial Balance",
    receivables: "Accounts Receivable (A/R)",
    payables: "Accounts Payable (A/P)",
    ledger: "General Ledger",
    "vat-summary": "VAT Return (FTA 201)",
  };

  const reportSubtitles: Record<string, string> = {
    summary: "High-level performance, margins, and balance sheet health.",
    "statement-of-account":
      "Customer statement of account and open receivables ledger.",
    soa: "Customer statement of account and open receivables ledger.",
    "tax-invoices": "Commercial sales invoices and billing realization.",
    "profit-loss": "Statement of income, cost of goods, and net profit.",
    "balance-sheet": "Assets, liabilities, and business net worth.",
    "trial-balance": "Debit and credit account balances audit statement.",
    receivables: "Client invoice ageing and open receivable balances.",
    payables: "Vendor bill ageing and accounts payable liabilities.",
    ledger: "Detailed transactional ledger and audit trail.",
    "vat-summary":
      "Quarterly VAT position, input and output tax reconciliation.",
  };

  return (
    <div className="space-y-6">
      {activeTab !== "hub" && (
        <div className="space-y-3 pb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("hub")}
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ChevronLeftIcon size={12} />
              <span>Reports Hub</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">
              {reportTitles[activeTab] || "Financial Statement"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {reportTitles[activeTab] || "Financial Statement"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportSubtitles[activeTab] ||
                  "Statutory accounts, commercial ledgers, and financial audit reports."}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "hub" && (
        <ReportsHubView
          onSelectReport={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {activeTab === "summary" && (
        <ExecutiveSummaryReport
          profitLoss={profitLoss}
          balanceSheet={balanceSheet}
          vatSummary={vatSummary}
          setActiveTab={setActiveTab}
        />
      )}

      {(activeTab === "statement-of-account" || activeTab === "soa") && (
        <StatementOfAccountReport
          initialCustomerId={searchParams.get("customerId")}
        />
      )}

      {activeTab === "tax-invoices" && <TaxInvoicesReport />}

      {activeTab === "profit-loss" && (
        <ProfitLossReport
          onDrillDownAccount={(accId) => {
            setSelectedAccountId(accId);
            setActiveTab("ledger");
          }}
        />
      )}

      {activeTab === "balance-sheet" && (
        <BalanceSheetReport balanceSheet={balanceSheet} isLoading={bsLoading} />
      )}

      {activeTab === "trial-balance" && (
        <TrialBalanceReport trialBalance={trialBalance} isLoading={tbLoading} />
      )}

      {activeTab === "receivables" && <AccountsReceivableReport />}

      {activeTab === "payables" && <AccountsPayableReport />}

      {activeTab === "ledger" && (
        <GeneralLedgerReport
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={setSelectedAccountId}
          selectedAccount={selectedAccount}
          ledger={ledger}
          isLoading={ledgerLoading}
        />
      )}

      {activeTab === "vat-summary" && (
        <VatPositionReport vatSummary={vatSummary} isLoading={vatLoading} />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading Financial Reports...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
