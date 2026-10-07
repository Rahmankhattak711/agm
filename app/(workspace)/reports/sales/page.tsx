"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSalesInvoices,
  useCustomers,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DateRangePicker,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { formatNumber, formatCurrency } from "@/lib/utils/format";

function parseDescriptionPoints(desc: string): string[] {
  if (!desc) return [];
  const normalized = String(desc).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized
    .split(/(?:\n+|(?<=\S)\s+(?=\d+[\.\)]\s+)|(?<=\S)\s+(?=[•\-*]\s+))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [desc.trim()];
}

function renderDescriptionPoints(desc?: string, fallback = "—") {
  if (!desc) {
    return <span className="text-slate-800">{fallback}</span>;
  }
  const points = parseDescriptionPoints(desc);
  if (points.length <= 1) {
    return (
      <div className="leading-relaxed text-slate-800 whitespace-pre-line text-left">
        {points[0] || fallback}
      </div>
    );
  }
  return (
    <div className="space-y-1.5 text-left py-0.5">
      {points.map((pt, pIdx) => {
        const match = pt.match(/^(\d+[\.\)]|[•\-*])\s*(.*)$/);
        if (match) {
          const [, bullet, text] = match;
          return (
            <div key={pIdx} className="leading-relaxed flex items-start gap-2">
              <span className="font-semibold text-slate-900 shrink-0 select-none min-w-[1.25rem]">
                {bullet}
              </span>
              <span className="text-slate-800">{text}</span>
            </div>
          );
        }
        return (
          <div key={pIdx} className="leading-relaxed flex items-start gap-2">
            <span className="text-slate-400 shrink-0 select-none">•</span>
            <span className="text-slate-800">{pt}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SalesReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(
    new Set(),
  );

  const { data: invoices = [], isLoading, error } = useSalesInvoices();
  const { data: customers = [] } = useCustomers();

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNumber = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesCustomer = inv.customerName?.toLowerCase().includes(q);
        const matchesTrn = inv.customerTrn?.toLowerCase().includes(q);
        const matchesScope = inv.projectScope?.toLowerCase().includes(q);
        if (
          !matchesNumber &&
          !matchesCustomer &&
          !matchesTrn &&
          !matchesScope
        ) {
          return false;
        }
      }

      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      if (
        customerFilter &&
        inv.customerId !== customerFilter &&
        inv.customerName !== customerFilter
      ) {
        return false;
      }

      if (inv.invoiceDate) {
        const invDate = new Date(inv.invoiceDate);
        const now = new Date();

        if (periodFilter === "THIS_MONTH") {
          if (
            invDate.getMonth() !== now.getMonth() ||
            invDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "LAST_MONTH") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (
            invDate.getMonth() !== lastMonth.getMonth() ||
            invDate.getFullYear() !== lastMonth.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_QUARTER") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const invQuarter = Math.floor(invDate.getMonth() / 3);
          if (
            currentQuarter !== invQuarter ||
            invDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_YEAR") {
          if (invDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (periodFilter === "CUSTOM") {
          if (startDate && new Date(inv.invoiceDate) < new Date(startDate)) {
            return false;
          }
          if (
            endDate &&
            new Date(inv.invoiceDate) > new Date(endDate + "T23:59:59")
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    invoices,
    search,
    statusFilter,
    customerFilter,
    periodFilter,
    startDate,
    endDate,
  ]);

  const nonCancelledInvoices = useMemo(
    () => filteredInvoices.filter((inv) => inv.status !== "CANCELLED"),
    [filteredInvoices],
  );

  const totalInvoicedSales = useMemo(
    () =>
      nonCancelledInvoices.reduce(
        (acc, inv) => acc + Number(inv.totalAmount || 0),
        0,
      ),
    [nonCancelledInvoices],
  );

  const totalCollected = useMemo(
    () =>
      nonCancelledInvoices.reduce(
        (acc, inv) => acc + Number(inv.paidAmount || 0),
        0,
      ),
    [nonCancelledInvoices],
  );

  const totalOutstanding = useMemo(
    () =>
      nonCancelledInvoices.reduce(
        (acc, inv) => acc + Number(inv.remainingBalance || 0),
        0,
      ),
    [nonCancelledInvoices],
  );

  const totalOutputVat = useMemo(
    () =>
      nonCancelledInvoices.reduce(
        (acc, inv) => acc + Number(inv.vatAmount || 0),
        0,
      ),
    [nonCancelledInvoices],
  );

  const collectionEfficiency =
    totalInvoicedSales > 0 ? (totalCollected / totalInvoicedSales) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200/90";
      case "POSTED":
        return "bg-sky-50 text-sky-800 border border-sky-200/90";
      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-800 border border-amber-200/90";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border border-slate-200/90";
      case "CANCELLED":
        return "bg-rose-50 text-rose-800 border border-rose-200/90";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200/90";
    }
  };

  const periodTabs = [
    { key: "ALL", label: "All Time" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "LAST_MONTH", label: "Last Month" },
    { key: "THIS_QUARTER", label: "This Quarter" },
    { key: "THIS_YEAR", label: "This Year" },
    { key: "CUSTOM", label: "Custom Date" },
  ];

  const toggleRow = (id: string) => {
    setExpandedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (expandedInvoiceIds.size === filteredInvoices.length) {
      setExpandedInvoiceIds(new Set());
    } else {
      setExpandedInvoiceIds(new Set(filteredInvoices.map((inv) => inv.id)));
    }
  };

  return (
    <>
      <div className="space-y-6 print:hidden pb-8">
        <PageHeader
          backButton={{
            label: "Reports Hub",
            onClick: () => router.push("/finance/reports"),
          }}
          title="Sales & Revenue"
          description="Sales invoices, payment collections, and receivables."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
              icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Print Statement
            </Button>
          }
        />

        <ReportKpiGrid cols={4}>
          <ReportKpiCard
            title="Total Invoiced Sales"
            subtitle={`${nonCancelledInvoices.length} billing vouchers`}
            value={formatCurrency(totalInvoicedSales)}
            accentColor="sky"
          />

          <ReportKpiCard
            title="Realized Collections"
            subtitle={`${collectionEfficiency.toFixed(1)}% recovery yield`}
            value={formatCurrency(totalCollected)}
            accentColor="emerald"
            valueColor="text-emerald-800"
          />

          <ReportKpiCard
            title="Outstanding Receivables"
            subtitle="Open client balances"
            value={formatCurrency(totalOutstanding)}
            accentColor="rose"
            valueColor="text-rose-700"
          />

          <ReportKpiCard
            title="Output VAT (5%)"
            subtitle="FTA Tax Box 1 Standard"
            value={formatCurrency(totalOutputVat)}
            accentColor="amber"
            valueColor="text-amber-800"
          />
        </ReportKpiGrid>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <FilterBar
            tabs={periodTabs.map((t) => ({ id: t.key, label: t.label }))}
            activeTab={periodFilter}
            onTabChange={(k) => {
              setPeriodFilter(k);
              if (k !== "CUSTOM") {
                setStartDate("");
                setEndDate("");
              }
            }}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search invoice #, client, TRN, or project..."
            totalCount={filteredInvoices.length}
            countLabel="Invoices"
            rightAction={
              <div className="flex flex-wrap items-center gap-2">
                {periodFilter === "CUSTOM" && (
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    placeholder="Select Date Range"
                    align="right"
                    onChange={({ startDate: s, endDate: e }) => {
                      setStartDate(s);
                      setEndDate(e);
                    }}
                  />
                )}
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  containerClassName="w-36"
                  className="bg-white text-xs py-1.5"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="POSTED">Posted to GL</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>

                <Select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  containerClassName="w-48"
                  className="bg-white text-xs py-1.5"
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            }
          />

          {error ? (
            <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
              Error loading sales invoices: {(error as any).message}
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p>Loading Sales &amp; Invoices Register...</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptIcon size={14} className="text-slate-700" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Sales Invoices &amp; Realization Register
                  </h4>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                    {filteredInvoices.length} Invoices
                  </span>
                  {filteredInvoices.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllRows}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {expandedInvoiceIds.size === filteredInvoices.length
                        ? "Collapse All"
                        : "Expand All"}
                    </button>
                  )}
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No sales invoices match your filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3 w-10 text-center"></th>
                        <th className="py-3 px-3">Invoice No</th>
                        <th className="py-3 px-3">Client / Entity</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3 text-right">Net Sales</th>
                        <th className="py-3 px-3 text-right">VAT (5%)</th>
                        <th className="py-3 px-3 text-right">Total Invoiced</th>
                        <th className="py-3 px-3 text-right">Collected</th>
                        <th className="py-3 px-3 text-right">Balance Due</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white">
                      {filteredInvoices.map((inv) => {
                        const isExpanded = expandedInvoiceIds.has(inv.id);
                        const invDate = inv.invoiceDate
                          ? new Date(inv.invoiceDate).toISOString().slice(0, 10)
                          : "—";
                        const dueDate = inv.dueDate
                          ? new Date(inv.dueDate).toISOString().slice(0, 10)
                          : null;
                        const remaining = Number(
                          inv.remainingBalance ??
                            Number(inv.totalAmount || 0) -
                              Number(inv.paidAmount || 0),
                        );

                        return (
                          <React.Fragment key={inv.id}>
                            <tr
                              onClick={() => toggleRow(inv.id)}
                              className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                                isExpanded ? "bg-slate-50/60" : ""
                              }`}
                            >
                              <td className="py-3 px-3 text-center text-slate-400">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(inv.id);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                                  title={
                                    isExpanded ? "Collapse Row" : "Expand Row"
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronDownIcon size={14} />
                                  ) : (
                                    <ChevronRightIcon size={14} />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <ReceiptIcon
                                    size={13}
                                    className="text-emerald-700 shrink-0"
                                  />
                                  <span className="font-mono font-bold text-slate-900">
                                    {inv.invoiceNumber}
                                  </span>
                                </div>
                                {inv.projectScope && (
                                  <span className="block text-[10.5px] text-slate-400 max-w-[200px] truncate mt-0.5">
                                    {inv.projectScope}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {inv.customerName}
                                </span>
                                {inv.customerTrn && (
                                  <span className="font-mono text-[10px] text-slate-400 mt-0.5 inline-block">
                                    TRN: {inv.customerTrn}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                <div>{invDate}</div>
                                {dueDate && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Due: {dueDate}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                                {formatNumber(inv.subtotal)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-blue-700 font-medium">
                                {formatNumber(inv.vatAmount)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                {formatNumber(inv.totalAmount)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                                {formatNumber(inv.paidAmount)}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-mono font-black ${
                                  remaining > 0
                                    ? "text-rose-700"
                                    : "text-emerald-700"
                                }`}
                              >
                                {formatNumber(remaining)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(
                                    inv.status,
                                  )}`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/70 border-b border-slate-200">
                                <td colSpan={10} className="p-3 sm:p-5">
                                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 max-w-6xl mx-auto">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                                          <ReceiptIcon size={14} />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-sm">
                                              {inv.invoiceNumber}
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(
                                                inv.status,
                                              )}`}
                                            >
                                              {inv.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleRow(inv.id);
                                        }}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Close Details</span>
                                        <ChevronDownIcon
                                          size={13}
                                          className="rotate-180"
                                        />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                          Client Entity
                                        </span>
                                        <span className="font-bold text-slate-900 block truncate">
                                          {inv.customerName}
                                        </span>
                                        {inv.customerTrn ? (
                                          <span className="font-mono text-[10.5px] text-slate-500 block mt-0.5">
                                            TRN: {inv.customerTrn}
                                          </span>
                                        ) : (
                                          <span className="text-[10.5px] text-slate-400 block mt-0.5">
                                            No TRN Recorded
                                          </span>
                                        )}
                                      </div>

                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                          Invoice Date
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 text-xs">
                                          {invDate}
                                        </span>
                                      </div>

                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                          Payment Due Date
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 text-xs">
                                          {dueDate || "—"}
                                        </span>
                                      </div>

                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                          Collection Health
                                        </span>
                                        <span
                                          className={`font-bold text-xs ${
                                            remaining <= 0
                                              ? "text-emerald-700"
                                              : Number(inv.paidAmount || 0) > 0
                                                ? "text-amber-700"
                                                : "text-rose-700"
                                          }`}
                                        >
                                          {remaining <= 0
                                            ? "Fully Settled"
                                            : Number(inv.paidAmount || 0) > 0
                                              ? "Partially Recovered"
                                              : "Unpaid / Pending"}
                                        </span>
                                      </div>
                                    </div>

                                    {inv.projectScope && (
                                      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                                        <div>
                                          <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                                            Project Scope &amp; Billing
                                            Milestone
                                          </span>
                                          <p className="text-slate-800 leading-relaxed font-medium">
                                            {inv.projectScope}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {inv.items && inv.items.length > 0 ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            Scope Bill of Quantities (BOQ)
                                          </span>
                                          <span className="text-[11px] text-slate-500 font-medium">
                                            {inv.items.length} line item(s)
                                          </span>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                                          <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[10.5px]">
                                              <tr>
                                                <th className="py-2.5 px-3 w-10 text-center">
                                                  #
                                                </th>
                                                <th className="py-2.5 px-3">
                                                  Description / Line Item
                                                </th>
                                                <th className="py-2.5 px-3 text-center w-28">
                                                  Quantity
                                                </th>
                                                <th className="py-2.5 px-3 text-right w-32">
                                                  Rate (AED)
                                                </th>
                                                <th className="py-2.5 px-3 text-right w-36">
                                                  Line Total (AED)
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {inv.items.map(
                                                (it: any, idx: number) => (
                                                  <tr
                                                    key={idx}
                                                    className="hover:bg-slate-50/50"
                                                  >
                                                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                                                      {idx + 1}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                                                      {renderDescriptionPoints(
                                                        it.description,
                                                      )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                                                      {it.quantity}{" "}
                                                      {it.unit || ""}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                                      {formatNumber(
                                                        it.unitPrice,
                                                      )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                      {formatNumber(it.amount)}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ) : null}

                                    <div className="flex justify-end pt-2">
                                      <div className="w-full sm:w-88 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                          <span>Net Taxable Subtotal:</span>
                                          <span className="font-mono font-bold text-slate-800">
                                            {formatCurrency(inv.subtotal)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-blue-700">
                                          <span>UAE VAT (5%):</span>
                                          <span className="font-mono font-bold">
                                            {formatCurrency(inv.vatAmount)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200/80 pt-2 text-sm">
                                          <span>Total Invoiced:</span>
                                          <span className="font-mono text-slate-900">
                                            {formatCurrency(inv.totalAmount)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-emerald-700 font-semibold">
                                          <span>Settled / Paid:</span>
                                          <span className="font-mono font-bold">
                                            {formatCurrency(inv.paidAmount)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-rose-700 font-black border-t border-slate-200/80 pt-2 text-sm">
                                          <span>Outstanding Balance:</span>
                                          <span className="font-mono">
                                            {formatCurrency(remaining)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        id="printable-voucher"
        className="hidden print:block w-full text-slate-900 bg-white"
      >
        <table className="print-page-table w-full border-collapse">
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <QuotationHeader className="!px-0 !pt-0 !pb-4 !border-b-0" />
              </th>
            </tr>
          </thead>
          <tfoot className="print-page-footer-group">
            <tr>
              <td className="p-0 border-none align-bottom">
                <div
                  className="w-full opacity-0 pointer-events-none select-none"
                  style={{ minHeight: "175px" }}
                  aria-hidden="true"
                >
                  <QuotationFooter />
                  <div style={{ height: "45px", minHeight: "45px" }} />
                </div>
              </td>
            </tr>
          </tfoot>
          <tbody className="print-page-body-group">
            <tr>
              <td className="p-0 border-none align-top">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 text-[12px] font-bold text-slate-800 border-t border-slate-200">
                    <span>Corporate Tax Registration No: 104094432200001</span>
                    <span>VAT Registration No: 104094432200003</span>
                  </div>

                  <div className="w-full text-center py-2 px-4 font-bold text-[13px] text-white tracking-wide uppercase bg-slate-800">
                    COMMERCIAL SALES INVOICES &amp; REALIZATION REGISTER
                  </div>

                  <table className="w-full border-collapse text-[11px] text-slate-800">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="py-2 px-2 text-left">Invoice No</th>
                        <th className="py-2 px-2 text-left">Client Entity</th>
                        <th className="py-2 px-2 text-left">Date</th>
                        <th className="py-2 px-2 text-right">
                          Net Sales (AED)
                        </th>
                        <th className="py-2 px-2 text-right">VAT (AED)</th>
                        <th className="py-2 px-2 text-right">Total (AED)</th>
                        <th className="py-2 px-2 text-right">
                          Collected (AED)
                        </th>
                        <th className="py-2 px-2 text-right">
                          Balance Due (AED)
                        </th>
                        <th className="py-2 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-1.5 px-2 font-mono font-bold">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-1.5 px-2 font-medium">
                            {inv.customerName}
                          </td>
                          <td className="py-1.5 px-2 font-mono">
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {formatNumber(inv.subtotal)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {formatNumber(inv.vatAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            {formatNumber(inv.totalAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {formatNumber(inv.paidAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            {formatNumber(
                              inv.remainingBalance ??
                                Number(inv.totalAmount || 0) -
                                  Number(inv.paidAmount || 0),
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold">
                            {inv.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="print-footer-bottom fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
