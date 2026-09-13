"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useSalesInvoices,
  useCustomers,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import {
  EyeIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportSummaryChart,
  ChartBarItem,
} from "@/components/reports/ReportSummaryChart";
import { ReportKpiCard, ReportKpiGrid } from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null,
  );

  const { data: invoices = [], isLoading, error } = useSalesInvoices();
  const { data: customers = [] } = useCustomers();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const topClientsChartData = useMemo<ChartBarItem[]>(() => {
    const clientMap: Record<string, { invoiced: number; collected: number }> =
      {};
    nonCancelledInvoices.forEach((inv) => {
      const name = inv.customerName || "General Client";
      if (!clientMap[name]) {
        clientMap[name] = { invoiced: 0, collected: 0 };
      }
      clientMap[name].invoiced += Number(inv.totalAmount || 0);
      clientMap[name].collected += Number(inv.paidAmount || 0);
    });

    return Object.entries(clientMap)
      .map(([name, data]) => ({
        label: name.length > 16 ? name.slice(0, 14) + "…" : name,
        sublabel: name,
        value: data.invoiced,
        secondaryValue: data.collected,
        color: "#233c4d",
        secondaryColor: "#059669",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [nonCancelledInvoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200/80";
      case "POSTED":
        return "bg-sky-50 text-sky-800 border border-sky-200/80";
      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-800 border border-amber-200/80";
      case "DRAFT":
        return "bg-slate-50 text-slate-700 border border-slate-200/80";
      case "CANCELLED":
        return "bg-rose-50 text-rose-800 border border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/80";
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

  const columns = useMemo<ColumnDef<SalesInvoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice No",
        cell: ({ row }) => (
          <div>
            <span
              onClick={() => setSelectedInvoice(row.original)}
              className="font-mono font-bold text-blue-950 hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <ReceiptIcon size={14} className="text-emerald-700 shrink-0" />
              {row.original.invoiceNumber}
            </span>
            {row.original.projectScope && (
              <span className="block text-[10.5px] text-slate-400 max-w-[180px] truncate mt-0.5">
                {row.original.projectScope}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Client / Entity",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {row.original.customerName}
            </span>
            {row.original.customerTrn && (
              <span className="font-mono text-[10px] text-slate-400 mt-0.5 inline-block">
                TRN: {row.original.customerTrn}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "invoiceDate",
        header: "Invoice Date",
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-slate-700 block text-[11px]">
              {row.original.invoiceDate
                ? new Date(row.original.invoiceDate).toISOString().slice(0, 10)
                : "—"}
            </span>
            {row.original.dueDate && (
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Due: {new Date(row.original.dueDate).toISOString().slice(0, 10)}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "subtotal",
        header: () => <div className="text-right">Net Sales (AED)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-700 block text-right">
            {formatNumber(row.original.subtotal)}
          </span>
        ),
      },
      {
        accessorKey: "vatAmount",
        header: () => <div className="text-right">Output VAT (5%)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-blue-700 block text-right">
            {formatNumber(row.original.vatAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Invoiced</div>,
        cell: ({ row }) => (
          <span className="font-mono font-black text-slate-900 block text-right">
            {formatNumber(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "remainingBalance",
        header: () => <div className="text-right">Balance Due</div>,
        cell: ({ row }) => {
          const balance = Number(row.original.remainingBalance || 0);
          return (
            <span
              className={`font-mono font-black block text-right ${
                balance > 0 ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {formatNumber(balance)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
              row.original.status,
            )}`}
          >
            {row.original.status.replace("_", " ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Action</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoice(row.original)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer h-auto"
              title="View Invoice Audit"
              icon={<EyeIcon className="w-4 h-4" />}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="space-y-6 print:hidden">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track revenue trends, customer invoicing, payments received, and outstanding receivables.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
          icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
        >
          Print Statement
        </Button>
      </div>

      {/* 5 Summary KPI Cards */}
      <ReportKpiGrid cols={3}>
        <ReportKpiCard
          title="1. Total Invoiced Sales"
          subtitle={`${nonCancelledInvoices.length} billing vouchers`}
          value={formatNumber(totalInvoicedSales)}
          accentColor="sky"
        />

        <ReportKpiCard
          title="2. Settled Receipts"
          subtitle="Realized bank & cash"
          value={formatNumber(totalCollected)}
          accentColor="emerald"
          valueColor="text-emerald-800"
        />

        <ReportKpiCard
          title="3. Outstanding Due"
          subtitle="Open customer balance"
          value={formatNumber(totalOutstanding)}
          accentColor="rose"
          valueColor="text-rose-700"
        />

        <ReportKpiCard
          title="4. UAE 5% Output VAT"
          subtitle="FTA Form 201 Box 1"
          value={formatNumber(totalOutputVat)}
          accentColor="amber"
          valueColor="text-amber-800"
        />

        <ReportKpiCard
          title="5. Collection Rate"
          subtitle="Realization efficiency"
          value={`${collectionEfficiency.toFixed(1)}%`}
          currency={false}
          accentColor="indigo"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              Yield
            </span>
          }
        />
      </ReportKpiGrid>

      {/* Chart: Top Clients by Sales */}
      {topClientsChartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <ReportSummaryChart
            title="Revenue &amp; Collection Breakdown by Top Clients"
            subtitle="Comparison of total amount billed versus payments collected per client account"
            data={topClientsChartData}
            primaryLegend="Total Invoiced"
            secondaryLegend="Collected Receipts"
          />
        </div>
      )}

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Date Filter & Search Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {periodTabs.map((tab) => {
                const isActive = periodFilter === tab.key;
                return (
                  <Button
                    key={tab.key}
                    type="button"
                    size="sm"
                    variant={isActive ? "outline" : "ghost"}
                    onClick={() => setPeriodFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer h-auto ${
                      isActive
                        ? "!bg-white !text-emerald-900 shadow-xs border border-slate-200/90 hover:!bg-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {periodFilter === "CUSTOM" && (
              <div className="flex items-center gap-2 text-xs">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  containerClassName="w-36"
                />
                <span className="text-slate-400 font-bold">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  containerClassName="w-36"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="w-full lg:w-80">
              <Input
                type="text"
                placeholder="Search invoice #, client, TRN, or project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<SearchIcon className="w-4 h-4 text-slate-400" />}
                containerClassName="w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                containerClassName="w-full sm:w-40"
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
                containerClassName="w-full sm:w-52"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading sales invoices: {(error as any).message}
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <p>Calculating Sales &amp; Commercial Billing Schedules...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[#233c4d] bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] print:bg-none print:!bg-slate-100 print:border-b print:border-slate-300 text-white print:text-slate-900 p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white print:text-slate-900">
                Sales Invoices &amp; Billing Realization Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 print:text-emerald-800 font-bold">
                {filteredInvoices.length} Matching Records
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredInvoices}
              isLoading={false}
              emptyTitle="No sales invoices found"
              emptyMessage="No sales transactions match your search or filter criteria."
            />
          </div>
        )}
      </div>
    </div>

      {/* Invoice Detail Audit Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          title={`Sales Invoice Audit: ${selectedInvoice.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Client Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedInvoice.customerName}
                </span>
                {selectedInvoice.customerTrn && (
                  <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                    TRN: {selectedInvoice.customerTrn}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Invoice Date
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedInvoice.invoiceDate
                    ? new Date(selectedInvoice.invoiceDate)
                        .toISOString()
                        .slice(0, 10)
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Payment Due Date
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedInvoice.dueDate
                    ? new Date(selectedInvoice.dueDate)
                        .toISOString()
                        .slice(0, 10)
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Posting Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getStatusBadge(
                    selectedInvoice.status,
                  )}`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {selectedInvoice.projectScope && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800 block mb-0.5">
                  Project Scope &amp; Billing Milestone
                </span>
                <p className="text-slate-700 text-xs whitespace-pre-line leading-relaxed">
                  {selectedInvoice.projectScope}
                </p>
              </div>
            )}

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Scope Bill of Quantities (BOQ)
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHead className="bg-slate-50 border-b border-slate-200">
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Description / Line Item
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-center">
                        Quantity
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Rate (AED)
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Line Total (AED)
                      </TableHeaderCell>
                    </TableHead>
                    <TableBody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((it: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2.5 px-3 font-medium text-slate-800 align-top">
                            {renderDescriptionPoints(
                              it.description || it.product?.name,
                              `Item #${idx + 1}`,
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-center font-mono align-top">
                            {it.quantity} {it.unit || "Unit"}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono align-top">
                            {Number(it.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top">
                            {Number(
                              it.totalPrice || it.quantity * it.unitPrice,
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Net Taxable Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(selectedInvoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>UAE VAT (5%):</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(selectedInvoice.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 text-sm font-black pt-1.5 border-t border-slate-200">
                  <span>Total Invoiced:</span>
                  <span className="font-mono text-emerald-800">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Settled / Paid:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(selectedInvoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-dashed border-slate-200">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono font-black">
                    {formatCurrency(selectedInvoice.remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs cursor-pointer"
              >
                Close Audit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Direct A4 Printable Document with exact Quotation styling & margins */}
      <div
        id="sales-print-area"
        className="mx-auto bg-white max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible hidden print:block w-full"
      >
        <table className="print-page-table w-full border-collapse">
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <QuotationHeader />
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
                <div className="px-8 py-3 space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                        Commercial Statement
                      </span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        SALES &amp; REVENUE REPORT
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700 font-mono font-bold text-xs">
                        {filteredInvoices.length} Invoices
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

                  <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200 print-avoid-break">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total Billed
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        {formatCurrency(totalInvoicedSales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Collected
                      </span>
                      <span className="font-mono font-black text-emerald-800">
                        {formatCurrency(totalCollected)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Outstanding
                      </span>
                      <span className="font-mono font-black text-rose-700">
                        {formatCurrency(totalOutstanding)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Output VAT
                      </span>
                      <span className="font-mono font-black text-blue-700">
                        {formatCurrency(totalOutputVat)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Invoices Breakdown ({filteredInvoices.length} records)
                    </h4>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Inv No
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Customer
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Date
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Net (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              VAT (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Total (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Due (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {filteredInvoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800">
                                {inv.customerName}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {inv.invoiceDate
                                  ? new Date(inv.invoiceDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "—"}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {Number(inv.subtotal).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right text-blue-700">
                                {Number(inv.vatAmount).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-800">
                                {Number(inv.totalAmount).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-rose-700">
                                {Number(inv.remainingBalance).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center font-sans text-[10px]">
                                {inv.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
