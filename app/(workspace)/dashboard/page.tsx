"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  DashboardHeader,
  type PeriodOption,
  DashboardHeroMetrics,
  DashboardSecondaryMetrics,
  DashboardIncomeChart,
  DashboardBalanceSheetDonut,
  DashboardActionRequired,
  DashboardRecentJournalsTable,
  type RecentJournalItem,
} from "./components";
import {
  useBalanceSheet,
  useJournalEntries,
  useProfitLoss,
  useSalesInvoices,
  useSalesOrders,
  useSupplierBills,
  usePurchaseRequests,
} from "@/lib/hooks/api-hooks";

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodOption>("THIS_MONTH");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setLastUpdatedTime(
      now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    );
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === "THIS_MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === "THIS_QUARTER") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return {
      startStr: formatYMD(start),
      endStr: formatYMD(end),
    };
  }, [period]);

  const { data: profitLoss } = useProfitLoss({
    period: "custom",
    startDate: dateRange.startStr,
    endDate: dateRange.endStr,
    compare: true,
  });
  const { data: balanceSheet } = useBalanceSheet({
    endDate: dateRange.endStr,
  });
  const { data: journalEntries = [] } = useJournalEntries();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: salesOrders = [] } = useSalesOrders();
  const { data: bills = [] } = useSupplierBills();
  const { data: purchaseRequests = [] } = usePurchaseRequests();

  const salesOrderMetrics = useMemo(() => {
    const activeOrders = salesOrders.filter((so) => so.status !== "CANCELLED");
    const total = activeOrders.reduce(
      (sum, so) => sum + Number(so.totalAmount || 0),
      0,
    );
    return {
      total,
      count: activeOrders.length,
    };
  }, [salesOrders]);

  const overdueMetrics = useMemo(() => {
    const now = new Date();
    const overdueInvoices = invoices.filter((i) => {
      if (i.status === "CANCELLED" || i.status === "PAID") return false;
      const remaining = Number(
        i.remainingBalance ??
          Number(i.totalAmount || 0) - Number(i.paidAmount || 0),
      );
      if (remaining <= 0) return false;
      if (!i.dueDate && !i.invoiceDate) return false;
      const due = new Date(i.dueDate || i.invoiceDate);
      return due.getTime() < now.getTime();
    });

    const totalOverdue = overdueInvoices.reduce((sum, i) => {
      const remaining = Number(
        i.remainingBalance ??
          Number(i.totalAmount || 0) - Number(i.paidAmount || 0),
      );
      return sum + remaining;
    }, 0);

    return {
      amount: totalOverdue,
      count: overdueInvoices.length,
    };
  }, [invoices]);

  const revenue = Math.max(
    0,
    typeof profitLoss?.revenue === "number"
      ? profitLoss.revenue
      : Number(profitLoss?.totalIncome || 0),
  );

  const operatingSpend = Math.abs(
    typeof profitLoss?.expenses === "number"
      ? profitLoss.expenses
      : Number(profitLoss?.totalExpenses || 0),
  );

  const netIncome =
    typeof profitLoss?.netIncome === "number"
      ? profitLoss.netIncome
      : revenue - operatingSpend;

  const netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0.0;

  const totalReceivables = useMemo(() => {
    return invoices
      .filter((i) => i.status !== "CANCELLED" && i.status !== "PAID")
      .reduce((sum, i) => {
        const remaining = Number(
          i.remainingBalance ??
            Number(i.totalAmount || 0) - Number(i.paidAmount || 0),
        );
        return sum + Math.max(0, remaining);
      }, 0);
  }, [invoices]);

  const totalPayables = useMemo(() => {
    return bills
      .filter((b) => b.status !== "CANCELLED" && b.status !== "PAID")
      .reduce((sum, b) => {
        const remaining = Number(
          b.remainingBalance ??
            Number(b.totalAmount || 0) - Number(b.paidAmount || 0),
        );
        return sum + Math.max(0, remaining);
      }, 0);
  }, [bills]);

  const totalAssets = Number(
    balanceSheet?.totalAssets ?? balanceSheet?.assets ?? 0,
  );
  const totalLiabilities = Number(
    balanceSheet?.totalLiabilities ?? balanceSheet?.liabilities ?? 0,
  );
  const totalEquity = Number(
    balanceSheet?.totalEquity ?? balanceSheet?.equityAmount ?? 0,
  );
  const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0.0;

  const monthlyChartData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const last6Months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      last6Months.push({
        key: `${y}-${String(m + 1).padStart(2, "0")}`,
        label: monthNames[m],
      });
    }

    const revenueMap = new Map<string, number>();
    const costMap = new Map<string, number>();

    last6Months.forEach((m) => {
      revenueMap.set(m.key, 0);
      costMap.set(m.key, 0);
    });

    journalEntries.forEach((je) => {
      if (!je.entryDate) return;
      const d = new Date(je.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!revenueMap.has(key)) return;

      (je.lines || []).forEach((line) => {
        const type = line.account?.type;
        if (type === "REVENUE") {
          const rev = Number(line.credit || 0) - Number(line.debit || 0);
          revenueMap.set(key, (revenueMap.get(key) || 0) + rev);
        } else if (type === "EXPENSE") {
          const cost = Number(line.debit || 0) - Number(line.credit || 0);
          costMap.set(key, (costMap.get(key) || 0) + cost);
        }
      });
    });

    if (Array.from(revenueMap.values()).every((v) => v === 0)) {
      invoices.forEach((inv) => {
        if (inv.status === "CANCELLED" || !inv.invoiceDate) return;
        const d = new Date(inv.invoiceDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (revenueMap.has(key)) {
          revenueMap.set(
            key,
            (revenueMap.get(key) || 0) + Number(inv.totalAmount || 0),
          );
        }
      });
    }

    if (Array.from(costMap.values()).every((v) => v === 0)) {
      bills.forEach((bill) => {
        if (bill.status === "CANCELLED" || !bill.billDate) return;
        const d = new Date(bill.billDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (costMap.has(key)) {
          costMap.set(
            key,
            (costMap.get(key) || 0) + Number(bill.totalAmount || 0),
          );
        }
      });
    }

    const labels = last6Months.map((m) => m.label);
    const revenueData = last6Months.map((m) =>
      Math.max(0, revenueMap.get(m.key) || 0),
    );
    const costData = last6Months.map((m) =>
      Math.max(0, costMap.get(m.key) || 0),
    );

    return { labels, revenueData, costData };
  }, [journalEntries, invoices, bills]);

  const actionItems = useMemo(() => {
    const items: {
      id: string;
      description: string;
      status: string;
      statusType: "danger" | "warning";
      href: string;
    }[] = [];

    if (overdueMetrics.count > 0) {
      items.push({
        id: "overdue-invoices",
        description: `${overdueMetrics.count} invoice${overdueMetrics.count > 1 ? "s" : ""} overdue (AED ${overdueMetrics.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
        status: "Overdue",
        statusType: "danger",
        href: "/commercial/sales-invoices",
      });
    }

    const pendingPrs = purchaseRequests.filter(
      (pr) => pr.status === "PENDING_APPROVAL" || pr.status === "DRAFT",
    );
    if (pendingPrs.length > 0) {
      items.push({
        id: "pending-prs",
        description: `${pendingPrs.length} purchase request${pendingPrs.length > 1 ? "s" : ""} pending approval`,
        status: "Pending",
        statusType: "warning",
        href: "/commercial/purchase-requests",
      });
    }

    const draftJes = journalEntries.filter((je) => !je.isPosted);
    if (draftJes.length > 0) {
      items.push({
        id: "draft-jes",
        description: `${draftJes.length} draft journal entr${draftJes.length > 1 ? "ies" : "y"} awaiting posting`,
        status: "Pending",
        statusType: "warning",
        href: "/finance/journal-entries",
      });
    }

    const draftInvoices = invoices.filter((i) => i.status === "DRAFT");
    if (draftInvoices.length > 0) {
      items.push({
        id: "draft-invoices",
        description: `${draftInvoices.length} sales invoice${draftInvoices.length > 1 ? "s" : ""} in draft`,
        status: "Pending",
        statusType: "warning",
        href: "/commercial/sales-invoices",
      });
    }

    const draftBills = bills.filter((b) => b.status === "DRAFT");
    if (draftBills.length > 0) {
      items.push({
        id: "draft-bills",
        description: `${draftBills.length} supplier bill${draftBills.length > 1 ? "s" : ""} in draft`,
        status: "Pending",
        statusType: "warning",
        href: "/commercial/supplier-bills",
      });
    }

    return items;
  }, [overdueMetrics, purchaseRequests, journalEntries, invoices, bills]);

  const recentJournalData = useMemo<RecentJournalItem[]>(() => {
    return journalEntries.slice(0, 5).map((je) => {
      const total = (je.lines || []).reduce(
        (s, l) => s + Number(l.debit || 0),
        0,
      );
      return {
        id: je.id,
        journalId: je.entryNumber,
        date: new Date(je.entryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        amount: total,
        status: je.isPosted ? "Posted" : "Draft",
      };
    });
  }, [journalEntries]);

  return (
    <div className="space-y-5 text-agm-text">
      <DashboardHeader
        period={period}
        onPeriodChange={setPeriod}
        lastUpdatedTime={lastUpdatedTime}
      />

      <DashboardHeroMetrics
        salesOrderValue={salesOrderMetrics.total}
        salesOrderCount={salesOrderMetrics.count}
        overdueAmount={overdueMetrics.amount}
        overdueCount={overdueMetrics.count}
        netProfitMargin={netProfitMargin}
        netIncome={netIncome}
        revenue={revenue}
      />

      <DashboardSecondaryMetrics
        totalReceivables={totalReceivables}
        totalPayables={totalPayables}
        operatingSpend={operatingSpend}
        debtToEquity={debtToEquity}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DashboardIncomeChart
            labels={monthlyChartData.labels}
            revenueData={monthlyChartData.revenueData}
            costData={monthlyChartData.costData}
          />
        </div>

        <div className="lg:col-span-5">
          <DashboardBalanceSheetDonut
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            totalEquity={totalEquity}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <DashboardActionRequired items={actionItems} />
        </div>

        <div className="lg:col-span-7">
          <DashboardRecentJournalsTable data={recentJournalData} />
        </div>
      </div>
    </div>
  );
}
