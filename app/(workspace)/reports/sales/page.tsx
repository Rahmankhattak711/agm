"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useSalesInvoices,
  useCustomers,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import { SearchIcon, PrintIcon, EyeIcon } from "@/components/icons";
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
import { ReportDateFilter } from "@/components/reports/ReportDateFilter";
import {
  ReportSummaryChart,
  ChartBarItem,
} from "@/components/reports/ReportSummaryChart";
import { Percent, TrendingUp, DollarSign } from "lucide-react";

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
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const { data: invoices = [], isLoading, error } = useSalesInvoices();
  const { data: customers = [] } = useCustomers();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
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

      // Status
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      // Customer
      if (
        customerFilter &&
        inv.customerId !== customerFilter &&
        inv.customerName !== customerFilter
      ) {
        return false;
      }

      // Date Period
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

  // KPI Calculations
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

  // Chart Data: Top 5 Clients by Invoiced Sales
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
        color: "#1e293b",
        secondaryColor: "#059669",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [nonCancelledInvoices]);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "POSTED":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "PARTIALLY_PAID":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<SalesInvoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice No",
        cell: ({ row }) => (
          <div>
            <span
              onClick={() => setSelectedInvoice(row.original)}
              className="font-mono font-bold text-blue-950 hover:underline cursor-pointer"
            >
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
            <span className="font-mono text-slate-700 block">
              {row.original.invoiceDate
                ? new Date(row.original.invoiceDate).toISOString().slice(0, 10)
                : "—"}
            </span>
            {row.original.dueDate && (
              <span className="text-[10px] text-slate-400 block mt-0.5">
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
            {formatCurrency(row.original.subtotal)}
          </span>
        ),
      },
      {
        accessorKey: "vatAmount",
        header: () => <div className="text-right">Output VAT (5%)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-blue-700 block text-right">
            {formatCurrency(row.original.vatAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Invoiced</div>,
        cell: ({ row }) => (
          <span className="font-mono font-black text-emerald-800 block text-right">
            {formatCurrency(row.original.totalAmount)}
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
              {formatCurrency(balance)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(
              row.original.status,
            )}`}
          >
            {row.original.status.replace("_", " ")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedInvoice(row.original)}
              className="p-1.5 text-slate-400 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              title="View Invoice Audit"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sales &amp; Revenue Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Commercial Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Track commercial invoicing
            performance, client receivables,
            <br /> VAT collection, and revenue realization.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsPrintSummaryOpen(true)}
          icon={<PrintIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Total Invoiced Sales
          </p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalInvoicedSales)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {nonCancelledInvoices.length} billing vouchers
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Settled Receipts
          </p>
          <p className="text-xl font-black text-emerald-800 mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Realized bank &amp; cash
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Outstanding Due
          </p>
          <p className="text-xl font-black text-rose-700 mt-1">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Open customer balance
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            UAE 5% Output VAT
          </p>
          <p className="text-xl font-black text-blue-700 mt-1">
            {formatCurrency(totalOutputVat)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            FTA Form 201 Box 1a
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <TrendingUp size={13} /> Collection Rate
          </p>
          <p className="text-xl font-black text-white mt-1">
            {collectionEfficiency.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Realization efficiency
          </p>
        </div>
      </div>

      {topClientsChartData.length > 0 && (
        <ReportSummaryChart
          title="Revenue & Collection Breakdown by Top Clients"
          subtitle="Comparison of total amount billed versus payments collected per client account"
          data={topClientsChartData}
          primaryLegend="Total Invoiced"
          secondaryLegend="Collected Receipts"
        />
      )}

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <ReportDateFilter
            periodFilter={periodFilter}
            onPeriodChange={setPeriodFilter}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1">
            <div className="w-full lg:w-80">
              <Input
                placeholder="Search invoice number, client, TRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <SearchIcon
                    className="w-4 h-4 text-slate-400"
                    strokeWidth={2}
                  />
                }
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
          <div className="py-8 text-center text-xs text-red-500">
            Error loading sales invoices: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredInvoices}
            isLoading={isLoading}
            emptyTitle="No sales invoices found"
            emptyMessage="No sales transactions match your search or filter criteria."
          />
        )}
      </div>

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
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${getStatusBadge(
                    selectedInvoice.status,
                  )}`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {selectedInvoice.projectScope && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-800 block mb-0.5">
                  Project Scope &amp; Billing Milestone
                </span>
                <p className="text-slate-700 text-xs">
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
                          <TableCell className="py-2 px-3 font-medium text-slate-800">
                            {it.description ||
                              it.product?.name ||
                              `Item #${idx + 1}`}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-center font-mono">
                            {it.quantity} {it.unit || "Unit"}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-mono">
                            {Number(it.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-mono font-bold text-slate-900">
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
              >
                Close Audit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isPrintSummaryOpen && (
        <Modal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          title="Print Sales & Revenue Summary Report"
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs print:p-0">
            <div
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 print:border-none print:shadow-none print:p-0"
              id="sales-print-area"
            >
              <table className="print-page-table w-full border-collapse">
                <thead className="print-page-header-group">
                  <tr>
                    <th className="p-0 font-normal text-left border-none">
                      <div className="mb-4">
                        <QuotationHeader className="-mx-6 -mt-6 mb-4 print:m-0" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tfoot className="print-page-footer-group">
                  <tr>
                    <td className="p-0 border-none">
                      <div className="h-[80px] w-full hidden print:block" />
                    </td>
                  </tr>
                </tfoot>

                <tbody className="print-page-body-group">
                  <tr>
                    <td className="p-0 border-none align-top">
                      <div className="space-y-6">
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

                        <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                            Invoices Breakdown ({filteredInvoices.length}{" "}
                            records)
                          </h4>
                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Inv No
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Customer
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Date
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    Net (AED)
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    VAT (AED)
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    Total (AED)
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    Due (AED)
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-center">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {filteredInvoices.map((inv) => (
                                  <tr key={inv.id}>
                                    <td className="py-1.5 px-3 font-bold text-slate-900">
                                      {inv.invoiceNumber}
                                    </td>
                                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                                      {inv.customerName}
                                    </td>
                                    <td className="py-1.5 px-3 text-slate-600">
                                      {inv.invoiceDate
                                        ? new Date(inv.invoiceDate)
                                            .toISOString()
                                            .slice(0, 10)
                                        : "—"}
                                    </td>
                                    <td className="py-1.5 px-3 text-right">
                                      {Number(inv.subtotal).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right text-blue-700">
                                      {Number(inv.vatAmount).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                                      {Number(inv.totalAmount).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-bold text-rose-700">
                                      {Number(inv.remainingBalance).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-center font-sans text-[10px]">
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
              <div className="w-full">
                <QuotationFooter />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsPrintSummaryOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.print()}
                icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              >
                Print Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
