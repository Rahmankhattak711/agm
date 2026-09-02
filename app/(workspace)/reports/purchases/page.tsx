"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  SupplierBill,
  useSupplierBills,
  useSuppliers,
} from "@/lib/hooks/api-hooks";
import { EyeIcon, PrintIcon, SearchIcon } from "@/components/icons";
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
import { QuotationFooter, QuotationHeader } from "@/components/quotation";
import {
  ChartBarItem,
  ReportSummaryChart,
} from "@/components/reports/ReportSummaryChart";
import {
  Percent,
  TrendingUp,
  DollarSign,
  Receipt,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Sparkles,
  ShieldCheck,
  X,
  FileSpreadsheet,
} from "lucide-react";

export default function PurchaseReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);

  const { data: bills = [], isLoading, error } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();

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

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNumber = b.billNumber?.toLowerCase().includes(q);
        const matchesSupplier = b.supplierName?.toLowerCase().includes(q);
        const matchesTrn = b.supplierTrn?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesSupplier && !matchesTrn) {
          return false;
        }
      }

      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }

      if (
        supplierFilter &&
        b.supplierId !== supplierFilter &&
        b.supplierName !== supplierFilter
      ) {
        return false;
      }

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
        color: "#233c4d",
        secondaryColor: "#0284c7",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [nonCancelledBills]);

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

  const columns = useMemo<ColumnDef<SupplierBill>[]>(
    () => [
      {
        accessorKey: "billNumber",
        header: "Bill No",
        cell: ({ row }) => (
          <div>
            <span
              onClick={() => setSelectedBill(row.original)}
              className="font-mono font-bold text-blue-950 hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet size={13} className="text-teal-700 shrink-0" />
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
            <span className="font-mono text-slate-700 block text-[11px]">
              {row.original.billDate
                ? new Date(row.original.billDate).toISOString().slice(0, 10)
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
        header: () => <div className="text-right">Net Purchases (AED)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-700 block text-right">
            {formatNumber(row.original.subtotal)}
          </span>
        ),
      },
      {
        accessorKey: "vatAmount",
        header: () => <div className="text-right">Input VAT (5%)</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-blue-700 block text-right">
            {formatNumber(row.original.vatAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Billed</div>,
        cell: ({ row }) => (
          <span className="font-mono font-black text-slate-900 block text-right">
            {formatNumber(row.original.totalAmount)}
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
            <button
              type="button"
              onClick={() => setSelectedBill(row.original)}
              className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
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
    <>
      <div className="space-y-6 print:hidden">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase &amp; Procurement Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Supplier procurement orders,
            vendor bills, payment disbursements, and material expenditure.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 print:grid-cols-5">
        {/* 1. Procurement Spend */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Procurement Spend
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              {nonCancelledBills.length} supplier bills
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {formatNumber(totalProcurementSpend)}
            </span>
          </div>
        </div>

        {/* 2. Settled Disbursals */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Settled Disbursals
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Cleared payments
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-emerald-800 font-mono">
              {formatNumber(totalDisbursed)}
            </span>
          </div>
        </div>

        {/* 3. Open Accounts Payable */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Open Accounts Payable
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Pending liabilities
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-amber-700 font-mono">
              {formatNumber(totalOutstandingAP)}
            </span>
          </div>
        </div>

        {/* 4. 5% Input VAT */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-blue-500" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
              4. 5% Input VAT (Recoverable)
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              FTA Form 201 Box 9
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-blue-700 font-mono">
              {formatNumber(totalInputVat)}
            </span>
          </div>
        </div>

        {/* 5. Settlement Ratio */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                5. Settlement Ratio
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                Disbursed
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              AP clearing efficiency
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xl font-black text-slate-900 font-mono">
              {settlementRatio.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart: Top Suppliers by Spend */}
      {topSuppliersChartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <ReportSummaryChart
            title="Procurement &amp; Disbursal Breakdown by Top Suppliers"
            subtitle="Comparison of total bills received versus settlements cleared per vendor account"
            data={topSuppliersChartData}
            primaryLegend="Total Billed"
            secondaryLegend="Disbursed Settlements"
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
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPeriodFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-teal-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {periodFilter === "CUSTOM" && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-teal-500 shadow-2xs"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="w-full lg:w-80">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search bill number, vendor, TRN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>
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
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                containerClassName="w-full sm:w-52"
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
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading supplier bills: {(error as any).message}
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
            <p>Calculating Procurement &amp; Vendor Bill Schedules...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Supplier Procurement Bills &amp; Liabilities Register
              </h4>
              <span className="text-[11px] font-mono text-teal-300 font-bold">
                {filteredBills.length} Matching Records
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredBills}
              isLoading={false}
              emptyTitle="No supplier bills found"
              emptyMessage="No procurement bills match your search or filter criteria."
            />
          </div>
        )}
      </div>
    </div>

      {/* Bill Detail Audit Modal */}
      {selectedBill && (
        <Modal
          isOpen={Boolean(selectedBill)}
          onClose={() => setSelectedBill(null)}
          title={`Supplier Bill Audit: ${selectedBill.billNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Supplier / Vendor
                </span>
                <span className="font-bold text-slate-900 text-sm">
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
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getStatusBadge(
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
              <div className="w-full sm:w-72 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
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
                <div className="flex justify-between text-slate-900 text-sm font-black pt-1.5 border-t border-slate-200">
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
                size="sm"
                onClick={() => setSelectedBill(null)}
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
        id="purchases-print-area"
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
              <td className="p-0 border-none">
                <div className="h-[140px] w-full hidden print:block" />
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

                  <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200 print-avoid-break">
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
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Bill No
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Supplier
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
                              Balance Due
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {filteredBills.map((b) => (
                            <tr key={b.id}>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {b.billNumber}
                              </td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800">
                                {b.supplierName}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {b.billDate
                                  ? new Date(b.billDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "—"}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {Number(b.subtotal).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right text-blue-700">
                                {Number(b.vatAmount).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {Number(b.totalAmount).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700">
                                {Number(b.remainingBalance).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center font-sans text-[10px]">
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

        <div className="fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
