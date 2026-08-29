"use client";

import { EyeIcon, PrintIcon, SearchIcon } from "@/components/icons";
import { QuotationFooter, QuotationHeader } from "@/components/quotation";
import { ReportDateFilter } from "@/components/reports/ReportDateFilter";
import {
  ChartBarItem,
  ReportSummaryChart,
} from "@/components/reports/ReportSummaryChart";
import {
  Button,
  DataTable,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import {
  SupplierBill,
  useSupplierBills,
  useSuppliers,
} from "@/lib/hooks/api-hooks";
import { ColumnDef } from "@tanstack/react-table";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

export default function PurchaseReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const { data: bills = [], isLoading, error } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filter logic
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNumber = b.billNumber?.toLowerCase().includes(q);
        const matchesSupplier = b.supplierName?.toLowerCase().includes(q);
        const matchesTrn = b.supplierTrn?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesSupplier && !matchesTrn) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }

      // Supplier
      if (
        supplierFilter &&
        b.supplierId !== supplierFilter &&
        b.supplierName !== supplierFilter
      ) {
        return false;
      }

      // Date Period
      if (b.billDate) {
        const bDate = new Date(b.billDate);
        const now = new Date();

        if (periodFilter === "THIS_MONTH") {
          if (
            bDate.getMonth() !== now.getMonth() ||
            bDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "LAST_MONTH") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (
            bDate.getMonth() !== lastMonth.getMonth() ||
            bDate.getFullYear() !== lastMonth.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_QUARTER") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const bQuarter = Math.floor(bDate.getMonth() / 3);
          if (
            currentQuarter !== bQuarter ||
            bDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_YEAR") {
          if (bDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (periodFilter === "CUSTOM") {
          if (startDate && new Date(b.billDate) < new Date(startDate)) {
            return false;
          }
          if (
            endDate &&
            new Date(b.billDate) > new Date(endDate + "T23:59:59")
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    bills,
    search,
    statusFilter,
    supplierFilter,
    periodFilter,
    startDate,
    endDate,
  ]);

  // KPI Calculations
  const nonCancelledBills = useMemo(
    () => filteredBills.filter((b) => b.status !== "CANCELLED"),
    [filteredBills],
  );

  const totalProcurementSpend = useMemo(
    () =>
      nonCancelledBills.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0),
    [nonCancelledBills],
  );

  const totalDisbursed = useMemo(
    () =>
      nonCancelledBills.reduce((acc, b) => acc + Number(b.paidAmount || 0), 0),
    [nonCancelledBills],
  );

  const totalOutstandingAP = useMemo(
    () =>
      nonCancelledBills.reduce(
        (acc, b) => acc + Number(b.remainingBalance || 0),
        0,
      ),
    [nonCancelledBills],
  );

  const totalInputVat = useMemo(
    () =>
      nonCancelledBills.reduce((acc, b) => acc + Number(b.vatAmount || 0), 0),
    [nonCancelledBills],
  );

  const settlementRatio =
    totalProcurementSpend > 0
      ? (totalDisbursed / totalProcurementSpend) * 100
      : 0;

  // Chart Data: Top 5 Suppliers by Spend
  const topSuppliersChartData = useMemo<ChartBarItem[]>(() => {
    const supplierMap: Record<string, { billed: number; paid: number }> = {};
    nonCancelledBills.forEach((b) => {
      const name = b.supplierName || "General Vendor";
      if (!supplierMap[name]) {
        supplierMap[name] = { billed: 0, paid: 0 };
      }
      supplierMap[name].billed += Number(b.totalAmount || 0);
      supplierMap[name].paid += Number(b.paidAmount || 0);
    });

    return Object.entries(supplierMap)
      .map(([name, data]) => ({
        label: name.length > 16 ? name.slice(0, 14) + "…" : name,
        sublabel: name,
        value: data.billed,
        secondaryValue: data.paid,
        color: "#0f172a",
        secondaryColor: "#0284c7",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [nonCancelledBills]);

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
  const columns = useMemo<ColumnDef<SupplierBill>[]>(
    () => [
      {
        accessorKey: "billNumber",
        header: "Bill No",
        cell: ({ row }) => (
          <div>
            <span
              onClick={() => setSelectedBill(row.original)}
              className="font-mono font-bold text-cyan-950 hover:underline cursor-pointer"
            >
              {row.original.billNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "supplierName",
        header: "Supplier / Vendor",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {row.original.supplierName}
            </span>
            {row.original.supplierTrn && (
              <span className="font-mono text-[10px] text-slate-400 mt-0.5 inline-block">
                TRN: {row.original.supplierTrn}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "billDate",
        header: "Bill Date",
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-slate-700 block">
              {row.original.billDate
                ? new Date(row.original.billDate).toISOString().slice(0, 10)
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
        header: () => <div className="text-right">Net Purchases (AED)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-700 block text-right">
            {formatCurrency(row.original.subtotal)}
          </span>
        ),
      },
      {
        accessorKey: "vatAmount",
        header: () => <div className="text-right">Input VAT (5%)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-blue-700 block text-right">
            {formatCurrency(row.original.vatAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Billed</div>,
        cell: ({ row }) => (
          <span className="font-mono font-black text-slate-900 block text-right">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "remainingBalance",
        header: () => <div className="text-right">Payable Balance</div>,
        cell: ({ row }) => {
          const balance = Number(row.original.remainingBalance || 0);
          return (
            <span
              className={`font-mono font-black block text-right ${
                balance > 0 ? "text-amber-700" : "text-emerald-700"
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
              onClick={() => setSelectedBill(row.original)}
              className="p-1.5 text-slate-400 hover:text-cyan-700 rounded-lg hover:bg-cyan-50 transition-colors"
              title="View Bill Details"
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase &amp; Procurement Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Accounts Payable Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Supplier procurement orders,
            vendor bills, payment disbursements, and material expenditure.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Procurement Spend
          </p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalProcurementSpend)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {nonCancelledBills.length} supplier bills
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Settled Disbursals
          </p>
          <p className="text-xl font-black text-emerald-800 mt-1">
            {formatCurrency(totalDisbursed)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cleared payments</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Open Accounts Payable
          </p>
          <p className="text-xl font-black text-amber-700 mt-1">
            {formatCurrency(totalOutstandingAP)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pending liabilities
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            5% Input VAT (Recoverable)
          </p>
          <p className="text-xl font-black text-blue-700 mt-1">
            {formatCurrency(totalInputVat)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            FTA Form 201 Box 9
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950 text-white shadow-xs">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
            <TrendingUp size={13} /> Settlement Ratio
          </p>
          <p className="text-xl font-black text-white mt-1">
            {settlementRatio.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            AP clearing efficiency
          </p>
        </div>
      </div>

      {topSuppliersChartData.length > 0 && (
        <ReportSummaryChart
          title="Procurement & Disbursal Breakdown by Top Suppliers"
          subtitle="Comparison of total bills received versus settlements cleared per vendor account"
          data={topSuppliersChartData}
          primaryLegend="Total Billed"
          secondaryLegend="Disbursed Settlements"
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
                placeholder="Search bill number, vendor, TRN..."
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
                containerClassName="w-full lg:w-40"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="POSTED">Posted to GL</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>

              <Select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                containerClassName="w-full lg:w-52"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading supplier bills: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredBills}
            isLoading={isLoading}
            emptyTitle="No supplier bills found"
            emptyMessage="No procurement bills match your search or filter criteria."
          />
        )}
      </div>

      {selectedBill && (
        <Modal
          isOpen={Boolean(selectedBill)}
          onClose={() => setSelectedBill(null)}
          title={`Supplier Bill Audit: ${selectedBill.billNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Supplier / Vendor
                </span>
                <span className="font-bold text-slate-900 text-lg">
                  {selectedBill.supplierName}
                </span>
                {selectedBill.supplierTrn && (
                  <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                    TRN: {selectedBill.supplierTrn}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Bill Date
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedBill.billDate
                    ? new Date(selectedBill.billDate).toISOString().slice(0, 10)
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Payment Due Date
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedBill.dueDate
                    ? new Date(selectedBill.dueDate).toISOString().slice(0, 10)
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${getStatusBadge(
                    selectedBill.status,
                  )}`}
                >
                  {selectedBill.status}
                </span>
              </div>
            </div>

            {selectedBill.items && selectedBill.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Billed Products &amp; Materials
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHead className="bg-slate-50 border-b border-slate-200">
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Item Description
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-center">
                        Quantity
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Unit Cost (AED)
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Line Total (AED)
                      </TableHeaderCell>
                    </TableHead>
                    <TableBody className="divide-y divide-slate-100">
                      {selectedBill.items.map((it: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2 px-3 font-medium text-slate-800">
                            {it.description ||
                              it.product?.name ||
                              `Material Item #${idx + 1}`}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-center font-mono">
                            {it.quantity} {it.unit || "Unit"}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-mono">
                            {Number(it.unitCost).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {Number(
                              it.totalPrice || it.quantity * it.unitCost,
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
              <div className="w-full lg:w-72 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Net Materials Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(selectedBill.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Input VAT (5%):</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(selectedBill.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 text-lg font-black pt-1.5 border-t border-slate-200">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-slate-900">
                    {formatCurrency(selectedBill.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Paid / Disbursed:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(selectedBill.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-dashed border-slate-200">
                  <span>Payable Balance Due:</span>
                  <span className="font-mono font-black">
                    {formatCurrency(selectedBill.remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedBill(null)}
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
          title="Print Purchase & Procurement Summary Report"
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs print:p-0">
            <div
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 print:border-none print:shadow-none print:p-0"
              id="purchases-print-area"
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
                              Accounts Payable Report
                            </span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                              PROCUREMENT &amp; VENDOR BILLS
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-700 font-mono font-bold text-xs">
                              {filteredBills.length} Bills
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
                              Total Spend
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {formatCurrency(totalProcurementSpend)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Settled
                            </span>
                            <span className="font-mono font-black text-emerald-800">
                              {formatCurrency(totalDisbursed)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Outstanding A/P
                            </span>
                            <span className="font-mono font-black text-amber-700">
                              {formatCurrency(totalOutstandingAP)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Input VAT (5%)
                            </span>
                            <span className="font-mono font-black text-blue-700">
                              {formatCurrency(totalInputVat)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs">
                            Procurement Bills Breakdown ({filteredBills.length}{" "}
                            records)
                          </h4>
                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Bill No
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Supplier
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
                                    Balance Due
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-center">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {filteredBills.map((b) => (
                                  <tr key={b.id}>
                                    <td className="py-1.5 px-3 font-bold text-slate-900">
                                      {b.billNumber}
                                    </td>
                                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                                      {b.supplierName}
                                    </td>
                                    <td className="py-1.5 px-3 text-slate-600">
                                      {b.billDate
                                        ? new Date(b.billDate)
                                            .toISOString()
                                            .slice(0, 10)
                                        : "—"}
                                    </td>
                                    <td className="py-1.5 px-3 text-right">
                                      {Number(b.subtotal).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right text-blue-700">
                                      {Number(b.vatAmount).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                      {Number(b.totalAmount).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-bold text-amber-700">
                                      {Number(b.remainingBalance).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-center font-sans text-[10px]">
                                      {b.status}
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
              <div>
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
