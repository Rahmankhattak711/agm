"use client";

import {
  useAccounts,
  useBalanceSheet,
  useLedger,
  useProfitLoss,
  useTrialBalance,
  useVatSummary,
} from "@/lib/hooks/api-hooks";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  FileCheck2Icon,
  FileSpreadsheetIcon,
  ReceiptIcon,
  ScaleIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "@/components/icons";
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
  StatementOfAccountReport,
  TaxInvoicesReport,
  TrialBalanceReport,
  VatPositionReport,
} from "./components";

function ReportsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ReportTab | null;
  const [activeTab, setActiveTab] = useState<ReportTab>(
    tabParam && tabParam !== "quotation" ? tabParam : "summary",
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

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "summary",
      label: "Executive Summary",
      icon: <SparklesIcon size={14} className="text-amber-500" />,
    },
    {
      id: "statement-of-account",
      label: "Statement of Account (SOA)",
      icon: <ReceiptIcon size={14} className="text-emerald-700" />,
    },
    {
      id: "tax-invoices",
      label: "Tax Invoices",
      icon: <FileCheck2Icon size={14} className="text-emerald-600" />,
    },
    {
      id: "profit-loss",
      label: "Profit & Loss",
      icon: <TrendingUpIcon size={14} className="text-emerald-600" />,
    },
    {
      id: "balance-sheet",
      label: "Balance Sheet",
      icon: <ScaleIcon size={14} className="text-blue-600" />,
    },
    {
      id: "trial-balance",
      label: "Trial Balance",
      icon: <FileSpreadsheetIcon size={14} className="text-purple-600" />,
    },
    {
      id: "receivables",
      label: "Accounts Receivable (A/R)",
      icon: <ArrowUpRightIcon size={14} className="text-emerald-700" />,
    },
    {
      id: "payables",
      label: "Accounts Payable (A/P)",
      icon: <ArrowDownLeftIcon size={14} className="text-amber-600" />,
    },
    {
      id: "ledger",
      label: "General Ledger",
      icon: <BookOpenIcon size={14} className="text-indigo-600" />,
    },
    {
      id: "vat-summary",
      label: "VAT Position",
      icon: <ReceiptIcon size={14} className="text-teal-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Financial Statements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate real-time balance sheets, profit &amp; loss, general
            ledger, and statutory financial statements.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 overflow-x-auto no-scrollbar print:hidden">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Button
              key={t.id}
              type="button"
              variant="ghost"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 h-auto ${
                isActive
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 hover:bg-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </Button>
          );
        })}
      </div>

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
