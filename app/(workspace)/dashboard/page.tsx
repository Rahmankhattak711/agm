"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BarChart from "@/components/BarChart";
import DoughnutChart from "@/components/DoughnutChart";
import { JournalEntriesIcon, ReportsIcon } from "@/components/icons";
import StatCard from "@/components/StatCard";
import {
  useBalanceSheet,
  useJournalEntries,
  useExpenses,
  useProfitLoss,
  useSalesInvoices,
  useSupplierBills,
  useAccounts,
  useCustomerPayments,
} from "@/lib/hooks/api-hooks";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ActivityIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  FileCheckIcon,
  FileClockIcon,
  LandmarkIcon,
  PercentIcon,
  ReceiptIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  XIcon,
} from "@/components/icons";

type PeriodOption = "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";
type ChartViewMode = "P_AND_L" | "CASH_FLOW";

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DashboardPage() {
  const [initialDates] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startStr: formatYMD(start),
      endStr: formatYMD(now),
    };
  });

  const [period, setPeriod] = useState<PeriodOption>("THIS_MONTH");
  const [chartView, setChartView] = useState<ChartViewMode>("P_AND_L");
  const [customStartDate, setCustomStartDate] = useState<string>(initialDates.startStr);
  const [customEndDate, setCustomEndDate] = useState<string>(initialDates.endStr);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsCustomOpen(false);
      }
    }
    if (isCustomOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCustomOpen]);

  const applyPreset = (daysAgoStart: number, daysAgoEnd: number = 0) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgoStart);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgoEnd);
    setCustomStartDate(formatYMD(start));
    setCustomEndDate(formatYMD(end));
    setPeriod("CUSTOM");
    setIsCustomOpen(false);
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let periodLabel = "This Month";
    let shortLabel = "Month";

    if (period === "THIS_MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = now.toLocaleString("default", { month: "short", year: "numeric" });
      periodLabel = monthName;
      shortLabel = "Month";
    } else if (period === "THIS_QUARTER") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
      const qNum = Math.floor(qMonth / 3) + 1;
      periodLabel = `Q${qNum} ${now.getFullYear()}`;
      shortLabel = `Q${qNum}`;
    } else if (period === "THIS_YEAR") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      periodLabel = `FY ${now.getFullYear()}`;
      shortLabel = "Year";
    } else if (period === "CUSTOM" && customStartDate && customEndDate) {
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59.999`);
      periodLabel = `${customStartDate} to ${customEndDate}`;
      shortLabel = "Custom";
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      periodLabel = "This Month";
      shortLabel = "Month";
    }

    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return {
      start,
      end,
      prevStart,
      prevEnd,
      startStr: formatYMD(start),
      endStr: formatYMD(end),
      periodLabel,
      shortLabel,
    };
  }, [period, customStartDate, customEndDate]);

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss({
    period: "custom",
    startDate: dateRange.startStr,
    endDate: dateRange.endStr,
    compare: true,
  });
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet({
    endDate: dateRange.endStr,
  });
  const { data: journalEntries = [], isLoading: jeLoading } =
    useJournalEntries();
  const { data: expensesData } = useExpenses();
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
    if (Math.abs(num) >= 1_000_000)
      return `AED ${(num / 1_000_000).toFixed(2)}M`;
    if (Math.abs(num) >= 1_000) return `AED ${(num / 1_000).toFixed(1)}k`;
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const treasuryMetrics = useMemo(() => {
    // Dynamically aggregate all liquid cash & bank accounts directly from DB chart of accounts
    const liquidAccounts = accounts.filter((a) => {
      if (a.type !== "ASSET") return false;
      const code = parseInt(a.accountCode, 10);
      if (!isNaN(code) && code >= 1000 && code < 1100) return true;
      const name = a.accountName.toLowerCase();
      return (
        name.includes("bank") ||
        name.includes("petty cash") ||
        name.includes("float") ||
        name.includes("cash on hand")
      );
    });

    const totalLiquid = liquidAccounts.reduce(
      (sum, a) => sum + Number(a.balance || 0),
      0,
    );
    const pettyCashAcc =
      accounts.find((a) => a.accountCode === "1010")?.balance || 0;
    const rakBankAcc =
      accounts.find((a) => a.accountCode === "1020")?.balance || 0;
    const siteFloatAcc =
      accounts.find((a) => a.accountCode === "1030")?.balance || 0;

    return { pettyCashAcc, rakBankAcc, siteFloatAcc, totalLiquid, count: liquidAccounts.length };
  }, [accounts]);

  const arMetrics = useMemo(() => {
    const now = new Date();
    // Filter invoices belonging to the selected date range
    const periodInvoices = invoices.filter((i) => {
      if (i.status === "CANCELLED") return false;
      const invDateStr = (i.invoiceDate || "").slice(0, 10);
      return invDateStr >= dateRange.startStr && invDateStr <= dateRange.endStr;
    });

    const totalBilled = periodInvoices.reduce(
      (sum, i) => sum + Number(i.totalAmount || 0),
      0,
    );
    const totalCollected = periodInvoices.reduce(
      (sum, i) =>
        sum +
        Number(
          i.paidAmount ||
            (Number(i.totalAmount || 0) - Number(i.remainingBalance || 0)),
        ),
      0,
    );
    const totalOutstanding = periodInvoices.reduce(
      (sum, i) => sum + Number(i.remainingBalance || 0),
      0,
    );

    let dueSoon = 0;
    let overdue = 0;
    let overdueCount = 0;

    periodInvoices.forEach((i) => {
      const invDate = new Date(i.dueDate || i.invoiceDate);
      const diffDays = Math.floor(
        (now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const bal = Number(i.remainingBalance || 0);
      if (bal > 0) {
        if (diffDays > 0) {
          overdue += bal;
          overdueCount++;
        } else {
          dueSoon += bal;
        }
      }
    });

    const displayAmount =
      totalBilled > 0 ? totalBilled : totalOutstanding;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      displayAmount,
      dueSoon,
      overdue,
      overdueCount,
      count: periodInvoices.length,
      openCount: periodInvoices.filter((i) => Number(i.remainingBalance || 0) > 0).length,
    };
  }, [invoices, dateRange]);

  const apMetrics = useMemo(() => {
    const now = new Date();
    // Filter supplier bills belonging to the selected date range
    const periodBills = bills.filter((b) => {
      if (b.status === "CANCELLED") return false;
      const billDateStr = (b.billDate || "").slice(0, 10);
      return billDateStr >= dateRange.startStr && billDateStr <= dateRange.endStr;
    });

    const totalBilled = periodBills.reduce(
      (sum, b) => sum + Number(b.totalAmount || 0),
      0,
    );
    const totalPaid = periodBills.reduce(
      (sum, b) => sum + Number(b.paidAmount || 0),
      0,
    );
    const totalOutstanding = periodBills.reduce(
      (sum, b) => sum + Number(b.remainingBalance || 0),
      0,
    );

    let dueSoon = 0;
    let overdue = 0;
    let overdueCount = 0;

    periodBills.forEach((b) => {
      const billDate = new Date(b.dueDate || b.billDate);
      const diffDays = Math.floor(
        (now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const bal = Number(b.remainingBalance || 0);
      if (bal > 0) {
        if (diffDays > 0) {
          overdue += bal;
          overdueCount++;
        } else {
          dueSoon += bal;
        }
      }
    });

    const displayAmount =
      totalBilled > 0 ? totalBilled : totalOutstanding;

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      displayAmount,
      dueSoon,
      overdue,
      overdueCount,
      count: periodBills.length,
      openCount: periodBills.filter((b) => Number(b.remainingBalance || 0) > 0).length,
    };
  }, [bills, dateRange]);

  const revenue = Math.max(
    0,
    typeof profitLoss?.revenue === "number"
      ? profitLoss.revenue
      : Number(profitLoss?.totalIncome || 0),
  );
  const prevRevenue = Math.max(0, Number(profitLoss?.prevTotalIncome || 0));

  const expenses = Math.abs(
    typeof profitLoss?.expenses === "number"
      ? profitLoss.expenses
      : Number(profitLoss?.totalExpenses || 0),
  );

  const netIncome =
    typeof profitLoss?.netIncome === "number"
      ? profitLoss.netIncome
      : typeof profitLoss?.netProfit === "number"
        ? profitLoss.netProfit
        : revenue - expenses;
  const prevNetIncome = Number(profitLoss?.prevNetProfit || 0);

  const revenueChangePct =
    prevRevenue > 0
      ? ((revenue - prevRevenue) / prevRevenue) * 100
      : revenue > 0
        ? 100
        : 0;
  const netIncomeChangePct =
    prevNetIncome !== 0
      ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100
      : netIncome > 0
        ? 100
        : 0;

  const marginPct = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  const totalAssets = Number(
    balanceSheet?.totalAssets ?? balanceSheet?.assets ?? 0,
  );
  const totalLiabilities = Number(
    balanceSheet?.totalLiabilities ?? balanceSheet?.liabilities ?? 0,
  );
  const totalEquity = Number(
    balanceSheet?.totalEquity ??
      (typeof balanceSheet?.equityAmount === "number"
        ? balanceSheet.equityAmount
        : 0),
  );
  const isBalanced = Boolean(balanceSheet?.balanced);

  const cashFlowMetrics = useMemo(() => {
    const periodReceipts = payments
      .filter((p) => {
        const d = (p.paymentDate || "").slice(0, 10);
        return d >= dateRange.startStr && d <= dateRange.endStr;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const periodDirectExpenses = (expensesData?.expenses || [])
      .filter((e) => {
        const d = (e.expenseDate || "").slice(0, 10);
        return d >= dateRange.startStr && d <= dateRange.endStr;
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const periodBillPayments = bills
      .filter((b) => {
        const d = (b.billDate || "").slice(0, 10);
        return d >= dateRange.startStr && d <= dateRange.endStr;
      })
      .reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);

    // Strictly real database figures with no synthetic multiplier fallbacks
    const moneyIn = periodReceipts;
    const moneyOut = periodBillPayments + periodDirectExpenses;
    const netCashFlow = moneyIn - moneyOut;

    return { moneyIn, moneyOut, netCashFlow };
  }, [payments, expensesData, bills, dateRange]);

  const vatMetrics = useMemo(() => {
    const periodInvoices = invoices.filter((i) => {
      if (i.status === "CANCELLED") return false;
      const d = (i.invoiceDate || "").slice(0, 10);
      return d >= dateRange.startStr && d <= dateRange.endStr;
    });
    const periodBills = bills.filter((b) => {
      if (b.status === "CANCELLED") return false;
      const d = (b.billDate || "").slice(0, 10);
      return d >= dateRange.startStr && d <= dateRange.endStr;
    });

    const outputVat = periodInvoices.reduce(
      (sum, i) => sum + Number(i.vatAmount || 0),
      0,
    );
    const inputVat = periodBills.reduce(
      (sum, b) => sum + Number(b.vatAmount || 0),
      0,
    );
    const netVatPayable = outputVat - inputVat;
    return { outputVat, inputVat, netVatPayable };
  }, [invoices, bills, dateRange]);

  const actionItems = useMemo(() => {
    const items = [];

    if (arMetrics.overdueCount > 0) {
      items.push({
        id: "ar-overdue",
        title: `${arMetrics.overdueCount} Overdue Invoices`,
        description: `${formatCurrency(arMetrics.overdue)} pending collection`,
        link: "/commercial/sales-invoices",
        actionText: "Collect Invoices",
        icon: <AlertCircleIcon size={16} className="text-rose-500 flex-shrink-0" />,
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
        actionText: "Disburse Payment",
        icon: <ClockIcon size={16} className="text-amber-500 flex-shrink-0" />,
        badge: "Due Soon",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      });
    }

    const draftJournals = journalEntries.filter((j) => !j.isPosted);
    if (draftJournals.length > 0) {
      items.push({
        id: "draft-je",
        title: `${draftJournals.length} Draft Journals`,
        description: "Unposted double-entry vouchers",
        link: "/finance/journal-entries",
        actionText: "Post Entries",
        icon: <FileClockIcon size={16} className="text-blue-500 flex-shrink-0" />,
        badge: "Draft",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      });
    }

    const expensesList = expensesData?.expenses || [];
    const pendingExpenses = expensesList.filter((e) => e.status === "DRAFT");
    if (pendingExpenses.length > 0) {
      items.push({
        id: "exp-approval",
        title: `${pendingExpenses.length} Purchase Expenses`,
        description: "Draft status awaiting approval",
        link: "/finance/expenses",
        actionText: "Review Expenses",
        icon: <FileCheckIcon size={16} className="text-purple-500 flex-shrink-0" />,
        badge: "Draft",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      });
    }

    return items.slice(0, 4);
  }, [arMetrics, apMetrics, journalEntries, expensesData]);

  const plChartData = [
    {
      label: "Revenue",
      value: revenue,
      color: "#10b981",
    },
    {
      label: "Operating Costs",
      value: expenses,
      color: "#f43f5e",
    },
    {
      label: "Net Profit",
      value: netIncome,
      color: netIncome >= 0 ? "#0284c7" : "#ea580c",
    },
  ];

  const cashFlowChartData = [
    {
      label: "Cash Inflow",
      value: Math.abs(cashFlowMetrics.moneyIn),
      color: "#10b981",
    },
    {
      label: "Cash Outflow",
      value: Math.abs(cashFlowMetrics.moneyOut),
      color: "#f43f5e",
    },
    {
      label: "Net Cash Flow",
      value: cashFlowMetrics.netCashFlow,
      color: cashFlowMetrics.netCashFlow >= 0 ? "#0284c7" : "#ea580c",
    },
  ];

  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((j) => {
      if (!j.entryDate) return false;
      const d = new Date(j.entryDate);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [journalEntries, dateRange]);

  const recentEntries = (filteredJournalEntries.length > 0 ? filteredJournalEntries : journalEntries).slice(0, 6);

  return (
    <div className="space-y-6 max-w-full">
      {/* Executive Command Ribbon */}
      <div className="relative rounded-2xl border border-white/15 bg-gradient-to-br from-[#274052] via-[#1c3242] to-[#12222d] p-5 md:p-6 text-white shadow-[0_12px_36px_rgba(15,23,42,0.22)]">
        {/* Subtle Ambient Brand Geometric Watermark (Clipped to boundary without clipping child dropdowns) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute right-[-40px] top-[-30px] w-[280px] opacity-10">
            <svg
              aria-hidden="true"
              viewBox="0 0 240 240"
              className="h-full w-full"
            >
              <path
                d="M14 180V60L125 10l108 50v120M52 150V70L164 20v100"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Left Title & Telemetry */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Ledger &bull; Real-time Accounting
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300/80 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                <SparklesIcon size={12} className="text-amber-400" />
                UAE FTA Tax Compliant
              </span>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Finance &amp; Operations Dashboard
              </h1>
              <p className="text-xs text-slate-300/85 font-normal mt-0.5">
                Real-time financial performance, cash flow liquidity, and operational metrics.
              </p>
            </div>

            {/* Quick Live Snapshot Telemetry Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-xs">
                <LandmarkIcon size={13} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-medium">Treasury:</span>
                <span className="font-mono font-bold text-white tracking-tight">
                  {formatCompact(treasuryMetrics.totalLiquid)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-xs">
                <TrendingUpIcon size={13} className="text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-medium">Net Margin:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {marginPct.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-xs">
                <ShieldCheckIcon
                  size={13}
                  className={isBalanced ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"}
                />
                <span className="text-slate-400 font-medium">Audit Status:</span>
                <span
                  className={`font-semibold ${
                    isBalanced ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {isBalanced ? "Balanced" : "Review"}
                </span>
              </div>

              {period === "CUSTOM" && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/35 px-3 py-1.5 text-xs text-emerald-200 backdrop-blur-md shadow-xs">
                  <CalendarIcon size={13} className="text-emerald-300 shrink-0" />
                  <span className="text-slate-300 font-medium">Range:</span>
                  <span className="font-mono font-bold text-white">
                    {dateRange.periodLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Filter Tabs with Popover for Custom */}
          <div className="relative z-30" ref={popoverRef}>
            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/15 backdrop-blur-md shadow-inner">
              {(
                [
                  { key: "THIS_MONTH", label: "Month" },
                  { key: "THIS_QUARTER", label: "Quarter" },
                  { key: "THIS_YEAR", label: "Year" },
                ] as const
              ).map(({ key, label }) => {
                const active = period === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPeriod(key);
                      setIsCustomOpen(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-white text-slate-900 shadow-sm scale-[1.02]"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}

              {/* Custom Date Range Popover Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (period !== "CUSTOM") {
                    setPeriod("CUSTOM");
                  }
                  setIsCustomOpen((prev) => !prev);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  period === "CUSTOM"
                    ? "bg-white text-slate-900 shadow-sm scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>Custom</span>
                <ChevronDownIcon
                  size={13}
                  className={`transition-transform duration-200 ${isCustomOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Premium Custom Date Range Popover */}
            {isCustomOpen && (
              <div
                className="absolute right-0 top-full mt-3 w-[22rem] rounded-2xl overflow-hidden border border-white/12 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  background: "linear-gradient(180deg, #2c455a 0%, #233a4d 45%, #1d3345 100%)",
                  boxShadow: "4px 0 28px rgba(38,59,77,0.35), 0 32px 64px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10" style={{ background: "linear-gradient(135deg, #3f5d72 0%, #2c4a5c 100%)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
                      <CalendarIcon size={13} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white tracking-wide uppercase">Custom Range</p>
                      <p className="text-[9px] text-white/50 font-medium">Pick start &amp; end dates</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomOpen(false)}
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <XIcon size={12} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-4 py-3.5 space-y-4">

                  {/* Quick Presets */}
                  <div className="space-y-2">
                    <p className="text-[9.5px] font-bold uppercase tracking-widest text-white/40">Quick Presets</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "Today", start: 0, end: 0 },
                        { label: "Yesterday", start: 1, end: 1 },
                        { label: "2 Days Ago", start: 2, end: 2 },
                        { label: "Last 7 Days", start: 6, end: 0 },
                        { label: "Last 30 Days", start: 29, end: 0 },
                        { label: "This Month", start: new Date().getDate() - 1, end: 0 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPreset(preset.start, preset.end)}
                          className="px-1.5 py-2 rounded-xl bg-white/8 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-[10.5px] font-semibold text-white/60 hover:text-emerald-300 transition-all text-center cursor-pointer active:scale-95 leading-tight"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Or pick dates</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  {/* Date Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-white/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        From
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            setPeriod("CUSTOM");
                          }}
                          className="w-full pl-3 pr-2 py-2.5 rounded-xl bg-white/8 border border-white/12 hover:border-emerald-400/40 focus:border-emerald-400/60 text-white text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400/40 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-white/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                        To
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            setPeriod("CUSTOM");
                          }}
                          className="w-full pl-3 pr-2 py-2.5 rounded-xl bg-white/8 border border-white/12 hover:border-blue-400/40 focus:border-blue-400/60 text-white text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Range Preview */}
                  <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10.5px] font-mono">
                      <span className="font-bold text-emerald-400">{customStartDate}</span>
                      <div className="flex items-center gap-1 text-slate-600">
                        <div className="w-4 h-px bg-slate-600" />
                        <ArrowRightIcon size={10} />
                      </div>
                      <span className="font-bold text-blue-400">{customEndDate}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 pt-0" style={{ background: "rgba(29,51,69,0.5)" }}>
                  <button
                    type="button"
                    onClick={() => setIsCustomOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckIcon size={13} />
                    Apply Date Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Cards Per Row (8 Stat Cards Total) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash & Bank (Inflows & Liquidity) */}
        <StatCard
          id="stat-cash-bank"
          title="Cash Inflows"
          value={formatCurrency(cashFlowMetrics.moneyIn)}
          subtitle={`Total Liquid: ${formatCompact(treasuryMetrics.totalLiquid)}`}
          accentColor="emerald"
          loading={accLoading}
          icon={<LandmarkIcon size={18} strokeWidth={2.2} />}
          trend={{
            label: `${cashFlowMetrics.netCashFlow >= 0 ? "+" : ""}${formatCompact(cashFlowMetrics.netCashFlow)} Net Flow`,
            up: cashFlowMetrics.netCashFlow >= 0,
          }}
        />

        {/* 2. Accounts Receivable */}
        <StatCard
          id="stat-receivables"
          title="Receivables"
          value={formatCurrency(arMetrics.displayAmount)}
          subtitle={`${formatCompact(arMetrics.totalCollected)} collected • ${arMetrics.count} inv`}
          accentColor="blue"
          loading={invLoading}
          icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
          trend={{
            label:
              arMetrics.totalOutstanding === 0
                ? arMetrics.count > 0
                  ? "100% Settled"
                  : "Settled"
                : `${formatCompact(arMetrics.totalOutstanding)} Due`,
            up: arMetrics.totalOutstanding === 0,
          }}
        />

        {/* 3. Accounts Payable */}
        <StatCard
          id="stat-payables"
          title="Payables"
          value={formatCurrency(apMetrics.displayAmount)}
          subtitle={`${formatCompact(apMetrics.totalPaid)} settled • ${apMetrics.count} bills`}
          accentColor="amber"
          loading={billsLoading}
          icon={<ReceiptIcon size={18} strokeWidth={2.2} />}
          trend={{
            label:
              apMetrics.totalOutstanding === 0
                ? "Settled"
                : `${formatCompact(apMetrics.totalOutstanding)} Due`,
            up: apMetrics.totalOutstanding === 0,
          }}
        />

        {/* 4. Net Working Capital */}
        <StatCard
          id="stat-working-capital"
          title="Working Capital"
          value={formatCurrency(totalAssets - totalLiabilities)}
          subtitle={`${totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : "1.00"}x Current Ratio`}
          accentColor="slate"
          loading={bsLoading}
          icon={<ScaleIcon size={18} strokeWidth={2.2} />}
          trend={{
            label: isBalanced ? "Balanced" : "Audit Review",
            up: isBalanced,
          }}
        />

        {/* 5. Total Revenue */}
        <StatCard
          id="stat-revenue"
          title="Total Revenue"
          value={formatCurrency(revenue)}
          subtitle="Recognized Operating Income"
          accentColor="emerald"
          loading={plLoading}
          icon={<ReportsIcon size={18} strokeWidth={2.2} />}
          trend={{
            label: `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct.toFixed(1)}% vs prev`,
            up: revenueChangePct >= 0,
          }}
        />

        {/* 6. Total Operating Costs */}
        <StatCard
          id="stat-expenses"
          title="Total Costs"
          value={formatCurrency(expenses)}
          subtitle={`${revenue > 0 ? ((expenses / revenue) * 100).toFixed(1) : "0.0"}% of Revenue`}
          accentColor="rose"
          loading={plLoading}
          icon={<CreditCardIcon size={18} strokeWidth={2.2} />}
          trend={{
            label: "COGS & OPEX",
            up: false,
            neutral: true,
          }}
        />

        {/* 7. Net Profit */}
        <StatCard
          id="stat-net-income"
          title="Net Profit"
          value={formatCurrency(netIncome)}
          subtitle={`${marginPct.toFixed(1)}% Operating Margin`}
          accentColor="indigo"
          loading={plLoading}
          icon={<JournalEntriesIcon size={18} strokeWidth={2.2} />}
          trend={{
            label: `${netIncomeChangePct >= 0 ? "+" : ""}${netIncomeChangePct.toFixed(1)}% vs prev`,
            up: netIncome >= 0,
          }}
        />

        {/* 8. VAT Liability (5% UAE FTA) */}
        <StatCard
          id="stat-vat"
          title="VAT Liability (5%)"
          value={formatCurrency(vatMetrics.netVatPayable)}
          subtitle={`Out ${formatCompact(vatMetrics.outputVat)} • In ${formatCompact(vatMetrics.inputVat)}`}
          accentColor="blue"
          loading={invLoading || billsLoading}
          icon={<PercentIcon size={18} strokeWidth={2.2} />}
          trend={{
            label:
              vatMetrics.netVatPayable >= 0 ? "Payable to FTA" : "Tax Refund",
            up: vatMetrics.netVatPayable <= 0,
          }}
        />
      </div>

      {/* Main Charts & Balance Sheet Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Performance Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUpIcon size={16} className="text-emerald-700" />
                {chartView === "P_AND_L"
                  ? "Income Statement & Margins"
                  : "Cash Inflows vs. Outflows"}
              </h3>
              <p className="text-xs text-slate-500">
                {chartView === "P_AND_L"
                  ? `Operating revenue vs total costs and net profit margin`
                  : "Cash movements across customer receipts, bills & expenses"}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartView("P_AND_L")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  chartView === "P_AND_L"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                P&amp;L Performance
              </button>
              <button
                type="button"
                onClick={() => setChartView("CASH_FLOW")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  chartView === "CASH_FLOW"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cash Flow
              </button>
            </div>
          </div>

          <BarChart
            data={chartView === "P_AND_L" ? plChartData : cashFlowChartData}
            formatValue={(v) => `AED ${Number(v).toLocaleString()}`}
            height={165}
          />
        </div>

        {/* Right: Balance Sheet Position & Working Capital */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <ScaleIcon size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Balance Sheet Position
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Assets = Liabilities + Equity
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1 border ${
                  isBalanced
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <ShieldCheckIcon size={12} />
                {isBalanced ? "Balanced" : "Audit Review"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 items-center">
              <div className="sm:col-span-6">
                <DoughnutChart
                  data={[
                    { label: "Assets", value: totalAssets, color: "#0284c7" },
                    {
                      label: "Liabilities",
                      value: totalLiabilities,
                      color: "#ea580c",
                    },
                    { label: "Equity", value: totalEquity, color: "#16a34a" },
                  ]}
                  height={125}
                  formatValue={(v) => `AED ${Number(v).toLocaleString()}`}
                />
              </div>

              <div className="sm:col-span-6 space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10.5px] text-slate-500 font-medium">
                    Total Assets
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(totalAssets)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10.5px] text-slate-500 font-medium">
                    Total Liabilities
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(totalLiabilities)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="text-[10.5px] text-emerald-800 font-medium">
                    Owner Equity
                  </div>
                  <div className="font-mono font-bold text-emerald-900 text-xs">
                    {formatCurrency(totalEquity)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span className="font-semibold">Working Capital Ratio:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {totalLiabilities > 0
                ? `${(totalAssets / totalLiabilities).toFixed(2)}x`
                : "1.00x"}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Action Required & Aging Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Tasks & Actions */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangleIcon size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Action Required
                </h3>
                <p className="text-xs text-slate-400">
                  Pending receivables, due supplier bills, and draft transactions
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {actionItems.length} Pending
            </span>
          </div>

          {actionItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All financial items and reconciliation tasks are up to date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {item.icon}
                        {item.title}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <Link
                    href={item.link}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-between pt-2 border-t border-slate-200/60 transition group"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRightIcon
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Receivables & Payables Aging Visualizer */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ActivityIcon size={16} className="text-emerald-700" />
                Receivables &amp; Payables Aging
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Live Liquidity
              </span>
            </div>

            <div className="space-y-4 pt-3 text-xs">
              {/* A/R Customer Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    A/R Customer Inflows:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(arMetrics.totalOutstanding)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${arMetrics.totalOutstanding > 0 ? (arMetrics.dueSoon / arMetrics.totalOutstanding) * 100 : 100}%`,
                    }}
                    title={`Current: ${formatCurrency(arMetrics.dueSoon)}`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{
                      width: `${arMetrics.totalOutstanding > 0 ? (arMetrics.overdue / arMetrics.totalOutstanding) * 100 : 0}%`,
                    }}
                    title={`Overdue: ${formatCurrency(arMetrics.overdue)}`}
                  />
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-slate-500 font-medium">
                    Current: {formatCompact(arMetrics.dueSoon)}
                  </span>
                  <span className="text-rose-600 font-bold">
                    Overdue: {formatCompact(arMetrics.overdue)}
                  </span>
                </div>
              </div>

              {/* A/P Supplier Progress */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    A/P Supplier Commitments:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(apMetrics.totalOutstanding)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${apMetrics.totalOutstanding > 0 ? (apMetrics.dueSoon / apMetrics.totalOutstanding) * 100 : 100}%`,
                    }}
                    title={`Current: ${formatCurrency(apMetrics.dueSoon)}`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${apMetrics.totalOutstanding > 0 ? (apMetrics.overdue / apMetrics.totalOutstanding) * 100 : 0}%`,
                    }}
                    title={`Due: ${formatCurrency(apMetrics.overdue)}`}
                  />
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-slate-500 font-medium">
                    Current: {formatCompact(apMetrics.dueSoon)}
                  </span>
                  <span className="text-amber-700 font-bold">
                    Due/Overdue: {formatCompact(apMetrics.overdue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 text-xs border-t border-slate-100 font-bold">
            <Link
              href="/finance/reports?tab=receivables"
              className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
            >
              Customer Aging Report &rarr;
            </Link>
            <Link
              href="/finance/reports?tab=payables"
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
            >
              Supplier Schedule &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Journal Entries & Transactions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Recent Journal Entries
            </h3>
            <p className="text-xs text-slate-500">
              Latest double-entry transactions and posting audit records
            </p>
          </div>
          <Link
            href="/finance/journal-entries"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>View All Entries</span>
            <ArrowUpRightIcon size={14} />
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
          <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[650px]">
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
                      onClick={() =>
                        (window.location.href = "/finance/journal-entries")
                      }
                    >
                      <td className="py-3 font-bold text-slate-800">
                        {je.entryNumber}
                      </td>
                      <td className="py-3 text-slate-600">
                        {new Date(je.entryDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {je.reference || "—"}
                      </td>
                      <td
                        className="py-3 text-slate-600 max-w-[220px] truncate font-medium"
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
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
