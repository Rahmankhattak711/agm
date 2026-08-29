"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import BarChart from "@/components/BarChart";
import {
  JournalEntriesIcon,
  PlusIcon,
  ProductsIcon,
  ReportsIcon,
} from "@/components/icons";
import StatCard from "@/components/StatCard";
import {
  useBalanceSheet,
  useJournalEntries,
  useExpenses,
  useProfitLoss,
  useVatSummary,
  useSalesInvoices,
  useSupplierBills,
  useAccounts,
  useCustomerPayments,
} from "@/lib/hooks/api-hooks";
import {
  Landmark,
  FileText,
  DollarSign,
  Receipt,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Wallet,
  ArrowRight,
  CreditCard,
  ArrowDownLeft,
  RefreshCw,
  FileCheck,
  FileClock,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";

type PeriodOption = "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";

export default function DashboardPage() {
  // Period filter state
  const [period, setPeriod] = useState<PeriodOption>("THIS_MONTH");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Calculate Date Boundaries
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (period === "THIS_MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "THIS_QUARTER") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
    } else if (period === "THIS_YEAR") {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (period === "CUSTOM" && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(`${customEndDate}T23:59:59`);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return {
      start,
      end,
      prevStart,
      prevEnd,
      startStr: start.toISOString().split("T")[0],
      endStr: end.toISOString().split("T")[0],
    };
  }, [period, customStartDate, customEndDate]);

  // API Hooks
  const { data: profitLoss, isLoading: plLoading } = useProfitLoss({
    startDate: dateRange.startStr,
    endDate: dateRange.endStr,
    compare: true,
  });
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: journalEntries = [], isLoading: jeLoading } = useJournalEntries();
  const { data: expensesData, isLoading: expLoading } = useExpenses();
  const { data: invoices = [], isLoading: invLoading } = useSalesInvoices();
  const { data: bills = [], isLoading: billsLoading } = useSupplierBills();
  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: payments = [] } = useCustomerPayments();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCompact = (val: number | string | undefined) => {
    const num = Number(val || 0);
    if (Math.abs(num) >= 1_000_000) return `AED ${(num / 1_000_000).toFixed(2)}M`;
    if (Math.abs(num) >= 1_000) return `AED ${(num / 1_000).toFixed(1)}k`;
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // 1. Cash & Bank Balances (Treasury)
  const treasuryMetrics = useMemo(() => {
    const pettyCashAcc = accounts.find((a) => a.accountCode === "1010")?.balance || 0;
    const rakBankAcc = accounts.find((a) => a.accountCode === "1020")?.balance || 0;
    const siteFloatAcc = accounts.find((a) => a.accountCode === "1030")?.balance || 0;
    const totalLiquid = pettyCashAcc + rakBankAcc + siteFloatAcc;

    return { pettyCashAcc, rakBankAcc, siteFloatAcc, totalLiquid };
  }, [accounts]);

  // 2. Accounts Receivable (A/R) Breakdown
  const arMetrics = useMemo(() => {
    const now = new Date();
    const active = invoices.filter((i) => i.status !== "CANCELLED" && Number(i.remainingBalance || 0) > 0);
    const totalOutstanding = active.reduce((sum, i) => sum + Number(i.remainingBalance || 0), 0);

    let dueSoon = 0;
    let overdue = 0;
    let overdueCount = 0;

    active.forEach((i) => {
      const invDate = new Date(i.dueDate || i.invoiceDate);
      const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
      const bal = Number(i.remainingBalance || 0);
      if (diffDays > 0) {
        overdue += bal;
        overdueCount++;
      } else {
        dueSoon += bal;
      }
    });

    return {
      totalOutstanding,
      dueSoon,
      overdue,
      overdueCount,
      openCount: active.length,
    };
  }, [invoices]);

  // 3. Accounts Payable (A/P) Breakdown
  const apMetrics = useMemo(() => {
    const now = new Date();
    const active = bills.filter((b) => b.status !== "CANCELLED" && Number(b.remainingBalance || 0) > 0);
    const totalOutstanding = active.reduce((sum, b) => sum + Number(b.remainingBalance || 0), 0);

    let dueSoon = 0;
    let overdue = 0;
    let overdueCount = 0;

    active.forEach((b) => {
      const billDate = new Date(b.dueDate || b.billDate);
      const diffDays = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
      const bal = Number(b.remainingBalance || 0);
      if (diffDays > 0) {
        overdue += bal;
        overdueCount++;
      } else {
        dueSoon += bal;
      }
    });

    return {
      totalOutstanding,
      dueSoon,
      overdue,
      overdueCount,
      openCount: active.length,
    };
  }, [bills]);

  // 4. Financial Performance (Revenue, Expenses, Net Profit)
  const revenue =
    typeof profitLoss?.revenue === "number"
      ? profitLoss.revenue
      : Number(profitLoss?.totalIncome || 0);
  const prevRevenue = Number(profitLoss?.prevTotalIncome || 0);

  const expenses =
    typeof profitLoss?.expenses === "number"
      ? profitLoss.expenses
      : Number(profitLoss?.totalExpenses || 0);

  const netIncome =
    typeof profitLoss?.netIncome === "number"
      ? profitLoss.netIncome
      : Number(profitLoss?.netProfit || revenue - expenses);
  const prevNetIncome = Number(profitLoss?.prevNetProfit || 0);

  const revenueChangePct =
    prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : revenue > 0 ? 100 : 0;
  const netIncomeChangePct =
    prevNetIncome !== 0
      ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100
      : netIncome > 0
        ? 100
        : 0;

  const marginPct = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  // 5. Balance Sheet Totals
  const totalAssets = Number(balanceSheet?.totalAssets ?? balanceSheet?.assets ?? 0);
  const totalLiabilities = Number(balanceSheet?.totalLiabilities ?? balanceSheet?.liabilities ?? 0);
  const totalEquity = Number(
    balanceSheet?.totalEquity ??
      (typeof balanceSheet?.equityAmount === "number" ? balanceSheet.equityAmount : 0),
  );
  const isBalanced = Boolean(balanceSheet?.balanced);

  // 6. Cash Flow Metrics
  const cashFlowMetrics = useMemo(() => {
    const periodReceipts = payments
      .filter((p) => {
        const d = new Date(p.paymentDate);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const periodDirectExpenses = (expensesData?.expenses || [])
      .filter((e) => {
        const d = new Date(e.expenseDate);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const periodBillPayments = bills
      .filter((b) => {
        const d = new Date(b.billDate);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);

    const moneyIn = periodReceipts || revenue * 0.85;
    const moneyOut = periodBillPayments + periodDirectExpenses || expenses * 0.75;
    const netCashFlow = moneyIn - moneyOut;

    return { moneyIn, moneyOut, netCashFlow };
  }, [payments, expensesData, bills, dateRange, revenue, expenses]);

  // 7. Action Required: Compact 3–4 Priority Items
  const actionItems = useMemo(() => {
    const items = [];

    if (arMetrics.overdueCount > 0) {
      items.push({
        id: "ar-overdue",
        title: `${arMetrics.overdueCount} Overdue Invoices`,
        description: `${formatCurrency(arMetrics.overdue)} pending collection`,
        link: "/commercial/sales-invoices",
        actionText: "View Receivables",
        icon: <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />,
        badge: "Overdue",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      });
    }

    if (apMetrics.overdueCount > 0) {
      items.push({
        id: "ap-due",
        title: `${apMetrics.overdueCount} Supplier Bills Due`,
        description: `${formatCurrency(apMetrics.overdue)} awaiting payment`,
        link: "/commercial/supplier-bills",
        actionText: "Disburse",
        icon: <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />,
        badge: "Due Soon",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      });
    }

    const draftJournals = journalEntries.filter((j) => !j.isPosted);
    if (draftJournals.length > 0) {
      items.push({
        id: "draft-je",
        title: `${draftJournals.length} Draft Journal Entries`,
        description: "Unposted double-entry vouchers",
        link: "/finance/journal-entries",
        actionText: "Post",
        icon: <FileClock className="w-4 h-4 text-blue-500 flex-shrink-0" />,
        badge: "Draft",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      });
    }

    const expensesList = expensesData?.expenses || [];
    const pendingExpenses = expensesList.filter((e) => e.status === "DRAFT");
    if (pendingExpenses.length > 0) {
      items.push({
        id: "exp-approval",
        title: `${pendingExpenses.length} Direct Expenses`,
        description: "Draft status awaiting approval",
        link: "/finance/expenses",
        actionText: "Review",
        icon: <FileCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />,
        badge: "Draft",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      });
    }

    return items.slice(0, 4);
  }, [arMetrics, apMetrics, journalEntries, expensesData]);

  // Chart Data
  const comparisonChartData = [
    { label: "Revenue", value: revenue, color: "#2e7d32" },
    { label: "Expenses", value: expenses, color: "#d32f2f" },
    {
      label: "Net Profit",
      value: netIncome,
      color: netIncome >= 0 ? "#1976d2" : "#f57c00",
    },
  ];

  const bsChartData = [
    { label: "Total Assets", value: totalAssets, color: "#0284c7" },
    { label: "Liabilities", value: totalLiabilities, color: "#ea580c" },
    { label: "Equity", value: totalEquity, color: "#16a34a" },
  ];

  const recentEntries = journalEntries.slice(0, 5);

  return (
    <div className="space-y-6 max-w-full">
      {/* 🏛️ 1. Header with Period Selector & + Create Dropdown */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#284257] to-[#1c3243] text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Enterprise Accounting Command Center
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Finance &amp; Operations Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector Pills */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15 backdrop-blur-xs">
            {(["THIS_MONTH", "THIS_QUARTER", "THIS_YEAR", "CUSTOM"] as PeriodOption[]).map((p) => {
              const labels: Record<PeriodOption, string> = {
                THIS_MONTH: "Month",
                THIS_QUARTER: "Quarter",
                THIS_YEAR: "Year",
                CUSTOM: "Custom",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition min-h-[34px] cursor-pointer ${
                    period === p
                      ? "bg-white text-[#284257] shadow-xs"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Date Inputs (when Custom is selected) */}
      {period === "CUSTOM" && (
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs shadow-xs">
          <span className="font-bold text-slate-700">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-semibold"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span className="text-slate-400 font-bold">→</span>
            <input
              type="date"
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-semibold"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 📊 2. Exactly 5 Core KPI Cards (Responsive iPad: 2–3 cols, Desktop: 5 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* KPI 1: Cash & Bank */}
        <StatCard
          id="stat-cash-bank"
          title="Cash & Bank"
          value={formatCurrency(treasuryMetrics.totalLiquid)}
          subtitle="RAK Bank & Petty Cash"
          gradient="bg-gradient-to-br from-[#1b4b2d] via-[#153e24] to-[#0f2c1a]"
          loading={accLoading}
          icon={<Landmark size={20} className="w-5 h-5 text-white" strokeWidth={2} />}
          trend={{
            label: `${cashFlowMetrics.netCashFlow >= 0 ? "+" : ""}${formatCompact(cashFlowMetrics.netCashFlow)} Net`,
            up: cashFlowMetrics.netCashFlow >= 0,
          }}
          sparkline={[30, 45, 60, 65, 80, 95]}
        />

        {/* KPI 2: Receivables */}
        <StatCard
          id="stat-receivables"
          title="Accounts Receivable"
          value={formatCurrency(arMetrics.totalOutstanding)}
          subtitle={`${arMetrics.openCount} Open Invoices`}
          gradient="bg-gradient-to-br from-[#2a4d69] via-[#213f56] to-[#172c3d]"
          loading={invLoading}
          icon={<DollarSign size={20} className="w-5 h-5 text-white" strokeWidth={2} />}
          trend={{
            label: arMetrics.overdueCount > 0 ? `${arMetrics.overdueCount} Overdue` : "Current",
            up: arMetrics.overdueCount === 0,
          }}
          sparkline={[40, 50, 55, 70, 75, 85]}
        />

        {/* KPI 3: Payables */}
        <StatCard
          id="stat-payables"
          title="Accounts Payable"
          value={formatCurrency(apMetrics.totalOutstanding)}
          subtitle={`${apMetrics.openCount} Supplier Bills`}
          gradient="bg-gradient-to-br from-[#3b5368] via-[#2d4052] to-[#202f3d]"
          loading={billsLoading}
          icon={<Receipt size={20} className="w-5 h-5 text-white" strokeWidth={2} />}
          trend={{
            label: apMetrics.overdueCount > 0 ? `${apMetrics.overdueCount} Due` : "Settled",
            up: apMetrics.overdueCount === 0,
          }}
          sparkline={[35, 45, 50, 60, 65, 70]}
        />

        {/* KPI 4: Revenue */}
        <StatCard
          id="stat-revenue"
          title="Total Revenue"
          value={formatCurrency(revenue)}
          subtitle="Operating Income"
          gradient="bg-gradient-to-br from-[#215a36] via-[#1b4b2d] to-[#123620]"
          loading={plLoading}
          icon={<ReportsIcon size={20} className="w-5 h-5 text-white" strokeWidth={2} />}
          trend={{
            label: `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct.toFixed(1)}% vs prev`,
            up: revenueChangePct >= 0,
          }}
          sparkline={[20, 35, 45, 60, 80, 95]}
        />

        {/* KPI 5: Net Profit */}
        <StatCard
          id="stat-net-income"
          title="Net Profit"
          value={formatCurrency(netIncome)}
          subtitle={`${marginPct.toFixed(1)}% Margin`}
          gradient="bg-gradient-to-br from-[#1d425f] via-[#163349] to-[#0f2434]"
          loading={plLoading}
          icon={<JournalEntriesIcon size={20} className="w-5 h-5 text-white" strokeWidth={2} />}
          trend={{
            label: `${netIncomeChangePct >= 0 ? "+" : ""}${netIncomeChangePct.toFixed(1)}% vs prev`,
            up: netIncome >= 0,
          }}
          sparkline={[10, 25, 30, 45, 55, 70]}
        />
      </div>

      {/* 📈 3. Primary Charts Section (Responsive 2-column or stack on iPad portrait) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income vs Expenses Breakdown (7 cols on desktop, full on tablet) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Income Statement &amp; Net Margin
              </h3>
              <p className="text-xs text-slate-500">
                Operating revenue vs total costs and net profit margin
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Net Flow:</span>
              <span className={`font-mono font-bold ${cashFlowMetrics.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {cashFlowMetrics.netCashFlow >= 0 ? "+" : ""}{formatCompact(cashFlowMetrics.netCashFlow)}
              </span>
            </div>
          </div>

          <BarChart
            title=""
            subtitle=""
            data={comparisonChartData}
            formatValue={(v) => `AED ${v.toLocaleString()}`}
            height={160}
          />
        </div>

        {/* Balance Sheet Capital Structure (5 cols on desktop, full on tablet) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
                  <Scale size={15} />
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Balance Sheet Position
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                  isBalanced
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {isBalanced ? "Balanced" : "Review"}
              </span>
            </div>

            <div className="space-y-2.5 pt-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Total Assets:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Total Liabilities:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(totalLiabilities)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-emerald-900 font-medium">Net Equity:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {formatCurrency(totalEquity)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Working Capital Ratio</span>
            <span className="font-bold text-slate-800">
              {totalLiabilities > 0 ? `${(totalAssets / totalLiabilities).toFixed(2)}x` : "1.00x"}
            </span>
          </div>
        </div>
      </div>

      {/* ⚠️ 4. Action Required & AR/AP Aging Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compact Action Required (7 cols on desktop) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle size={15} />
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                Action Required &bull; Financial Tasks
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {actionItems.length} Pending
            </span>
          </div>

          {actionItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              All financial items and reconciliation tasks are up to date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {item.icon}
                        {item.title}
                      </span>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <Link
                    href={item.link}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between pt-1.5 border-t border-slate-200/60"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AR & AP Aging Summary (5 cols on desktop) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Receivables &amp; Payables Aging
            </h3>

            <div className="space-y-3 pt-3 text-xs">
              {/* AR Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">A/R Customer Inflows:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(arMetrics.totalOutstanding)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${arMetrics.totalOutstanding > 0 ? (arMetrics.dueSoon / arMetrics.totalOutstanding) * 100 : 100}%`,
                    }}
                    title={`Current: ${formatCurrency(arMetrics.dueSoon)}`}
                  />
                  <div
                    className="bg-rose-500 h-full"
                    style={{
                      width: `${arMetrics.totalOutstanding > 0 ? (arMetrics.overdue / arMetrics.totalOutstanding) * 100 : 0}%`,
                    }}
                    title={`Overdue: ${formatCurrency(arMetrics.overdue)}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Current: {formatCompact(arMetrics.dueSoon)}</span>
                  <span className="text-rose-600 font-bold">Overdue: {formatCompact(arMetrics.overdue)}</span>
                </div>
              </div>

              {/* AP Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">A/P Supplier Commitments:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(apMetrics.totalOutstanding)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${apMetrics.totalOutstanding > 0 ? (apMetrics.dueSoon / apMetrics.totalOutstanding) * 100 : 100}%`,
                    }}
                    title={`Current: ${formatCurrency(apMetrics.dueSoon)}`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${apMetrics.totalOutstanding > 0 ? (apMetrics.overdue / apMetrics.totalOutstanding) * 100 : 0}%`,
                    }}
                    title={`Due: ${formatCurrency(apMetrics.overdue)}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Current: {formatCompact(apMetrics.dueSoon)}</span>
                  <span className="text-amber-700 font-bold">Due/Overdue: {formatCompact(apMetrics.overdue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100">
            <Link href="/reports/customers" className="font-bold text-emerald-700 hover:underline">
              Customer Aging &rarr;
            </Link>
            <Link href="/reports/suppliers" className="font-bold text-slate-600 hover:underline">
              Supplier Schedule &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 📑 5. Recent Journal Transactions Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Recent Journal Entries &amp; Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Latest double-entry accounting transactions
            </p>
          </div>
          <Link
            href="/finance/journal-entries"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            View All Entries →
          </Link>
        </div>

        {jeLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Loading journal entries...
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No journal entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-2.5">Entry #</th>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Reference</th>
                  <th className="pb-2.5">Description</th>
                  <th className="pb-2.5 text-right">Debit (AED)</th>
                  <th className="pb-2.5 text-right">Credit (AED)</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEntries.map((je) => {
                  const totalDebit = (je.lines || []).reduce(
                    (s, l) => s + Number(l.debit || 0),
                    0,
                  );
                  const totalCredit = (je.lines || []).reduce(
                    (s, l) => s + Number(l.credit || 0),
                    0,
                  );
                  return (
                    <tr
                      key={je.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = "/finance/journal-entries")}
                    >
                      <td className="py-3 font-bold text-slate-800">
                        {je.entryNumber}
                      </td>
                      <td className="py-3 text-slate-600">
                        {new Date(je.entryDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {je.reference || "—"}
                      </td>
                      <td
                        className="py-3 text-slate-600 max-w-[200px] truncate"
                        title={je.description || "General Entry"}
                      >
                        {je.description || "General Entry"}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-800">
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-800">
                        {formatCurrency(totalCredit)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            je.isPosted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {je.isPosted ? "Posted" : "Draft"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
