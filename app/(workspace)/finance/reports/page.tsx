"use client";

import { useState } from "react";
import { QuotationItem, QuotationMeta } from "@/components/QuotationTemplate";
import { Button } from "@/components/ui";
import {
  useAccounts,
  useBalanceSheet,
  useLedger,
  useProducts,
  useProfitLoss,
  useTrialBalance,
  useVatSummary,
} from "@/lib/hooks/api-hooks";
import {
  ReportTab,
  ExecutiveSummaryReport,
  QuotationReport,
  ProfitLossReport,
  BalanceSheetReport,
  TrialBalanceReport,
  GeneralLedgerReport,
  VatPositionReport,
  QuotationPrintModal,
} from "./components";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    customer: "",
    attention: "",
    address: "",
    trn: "",
    mobile: "",
    project: "",
    location: "",
    reference: "",
    preparedBy: "",
    contact: "",
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
            <Button
              key={t.id}
              variant={isActive ? "outline" : "ghost"}
              size="md"
              onClick={() => setActiveTab(t.id)}
              className={`text-xs ${
                isActive
                  ? "bg-white text-slate-900 shadow-xs border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.label}
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

      {activeTab === "quotation" && (
        <QuotationReport
          dynamicQuotationMeta={dynamicQuotationMeta}
          dynamicQuotationItems={dynamicQuotationItems}
          products={products}
        />
      )}

      {activeTab === "profit-loss" && (
        <ProfitLossReport profitLoss={profitLoss} isLoading={plLoading} />
      )}

      {activeTab === "balance-sheet" && (
        <BalanceSheetReport balanceSheet={balanceSheet} isLoading={bsLoading} />
      )}

      {activeTab === "trial-balance" && (
        <TrialBalanceReport trialBalance={trialBalance} isLoading={tbLoading} />
      )}

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

      <QuotationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        dynamicQuotationMeta={dynamicQuotationMeta}
        dynamicQuotationItems={dynamicQuotationItems}
        products={products}
      />
    </div>
  );
}
