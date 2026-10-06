"use client";

import {
  ChevronLeftIcon,
  EyeIcon,
  PrintIcon,
  SearchIcon,
} from "@/components/icons";
import { QuotationFooter, QuotationHeader } from "@/components/quotation";
import { useRouter } from "next/navigation";
import {
  ReportDateFilter,
  ChartBarItem,
  ReportSummaryChart,
} from "../components";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import {
  Button,
  DataTable,
  DateRangePicker,
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
import { Expense, useAccounts, useExpenses } from "@/lib/hooks/api-hooks";
import { ColumnDef } from "@tanstack/react-table";
import { CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

export default function ExpenseReportsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data, isLoading, error } = useExpenses({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    paymentMethod:
      paymentMethodFilter !== "ALL" ? paymentMethodFilter : undefined,
    search: search || undefined,
  });

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const { data: accounts = [] } = useAccounts();

  const periodTabs = [
    { key: "ALL", label: "All Time" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "LAST_MONTH", label: "Last Month" },
    { key: "THIS_QUARTER", label: "This Quarter" },
    { key: "THIS_YEAR", label: "This Year" },
    { key: "CUSTOM", label: "Custom Date" },
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.expenseDate) {
        const expDate = new Date(e.expenseDate);
        const now = new Date();

        if (periodFilter === "THIS_MONTH") {
          if (
            expDate.getMonth() !== now.getMonth() ||
            expDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "LAST_MONTH") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (
            expDate.getMonth() !== lastMonth.getMonth() ||
            expDate.getFullYear() !== lastMonth.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_QUARTER") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const expQuarter = Math.floor(expDate.getMonth() / 3);
          if (
            currentQuarter !== expQuarter ||
            expDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === "THIS_YEAR") {
          if (expDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (periodFilter === "CUSTOM") {
          if (startDate && new Date(e.expenseDate) < new Date(startDate)) {
            return false;
          }
          if (
            endDate &&
            new Date(e.expenseDate) > new Date(endDate + "T23:59:59")
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [expenses, periodFilter, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) => sum + Number(e.totalAmount || 0),
      0,
    );
    const totalTax = filteredExpenses.reduce(
      (sum, e) => sum + Number(e.taxAmount || 0),
      0,
    );
    const netAmount = filteredExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0,
    );

    const bankTransferTotal = filteredExpenses
      .filter((e) => e.paymentMethod === "BANK_TRANSFER")
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const cardTotal = filteredExpenses
      .filter((e) => e.paymentMethod === "CREDIT_CARD")
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const cashTotal = filteredExpenses
      .filter((e) => e.paymentMethod === "CASH")
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    return {
      totalExpenses,
      totalTax,
      netAmount,
      bankTransferTotal,
      cardTotal,
      cashTotal,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  const categoryBreakdown = useMemo<ChartBarItem[]>(() => {
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(e.totalAmount || 0);
    });

    const colors = [
      "#28633a",
      "#0284c7",
      "#ea580c",
      "#9333ea",
      "#eab308",
      "#0d9488",
      "#64748b",
      "#dc2626",
    ];

    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }));
  }, [filteredExpenses]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: "expenseNumber",
        header: "Expense No",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-emerald-950">
            {row.original.expenseNumber}
          </span>
        ),
      },
      {
        accessorKey: "expenseDate",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.expenseDate).toLocaleDateString("en-GB"),
      },
      {
        accessorKey: "category",
        header: "Category & Payee",
        cell: ({ row }) => (
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
              {row.original.category}
            </span>
            {row.original.payee && (
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                {row.original.payee}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description / Ref",
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            <p className="truncate font-medium text-slate-800">
              {row.original.description || "—"}
            </p>
            {row.original.reference && (
              <p className="text-[10px] text-slate-400 font-mono">
                Ref: {row.original.reference}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
            <CreditCard size={12} className="text-slate-400" />
            {row.original.paymentMethod.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Net Amount",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-700">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "taxAmount",
        header: "VAT (5%)",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">
            {formatCurrency(row.original.taxAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-900">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={<EyeIcon className="w-3.5 h-3.5" />}
              onClick={() => setSelectedExpense(row.original)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const router = useRouter();

  return (
    <>
      <div className="space-y-6 print:hidden pb-8">
        <div className="space-y-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              type="button"
              onClick={() => router.push("/finance/reports")}
              className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ChevronLeftIcon size={12} />
              <span>Reports Hub</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Operating Expenses</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Operating Expenses
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Corporate expenditures, recoverable input VAT, and payments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
              >
                Print Statement
              </Button>
            </div>
          </div>
        </div>

        <ReportKpiGrid cols={4}>
          <ReportKpiCard
            title="Total Expenditure"
            subtitle={`${metrics.count} total expense items`}
            value={metrics.totalExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="sky"
          />

          <ReportKpiCard
            title="Net Operating Costs"
            subtitle="Excluding recoverable input VAT"
            value={metrics.netAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="emerald"
            valueColor="text-emerald-800"
          />

          <ReportKpiCard
            title="Recoverable VAT (5%)"
            subtitle="Claimable on VAT 201 return"
            value={metrics.totalTax.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="purple"
            valueColor="text-purple-800"
          />

          <ReportKpiCard
            title="Settlement Channels"
            subtitle={`Card: ${formatCurrency(metrics.cardTotal)} · Cash: ${formatCurrency(metrics.cashTotal)}`}
            value={metrics.bankTransferTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="indigo"
            badge={
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                Bank
              </span>
            }
          />
        </ReportKpiGrid>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {periodTabs.map((tab) => {
                  const isActive = periodFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setPeriodFilter(tab.key);
                        if (tab.key !== "CUSTOM") {
                          setStartDate("");
                          setEndDate("");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-emerald-950 shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

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
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-200/80">
              <div className="w-full lg:w-80">
                <Input
                  type="text"
                  placeholder="Search expense #, category, payee, ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<SearchIcon className="w-4 h-4 text-slate-400" />}
                  className="bg-white text-xs py-1.5"
                  containerClassName="w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  containerClassName="w-full sm:w-48"
                  className="bg-white text-xs py-1.5"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>

                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  containerClassName="w-full sm:w-48"
                  className="bg-white text-xs py-1.5"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={filteredExpenses}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title="Expense Voucher Details"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-mono font-bold text-emerald-950">
                  {selectedExpense.expenseNumber}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(selectedExpense.expenseDate).toLocaleDateString(
                    "en-GB",
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Payee
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedExpense.payee || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Category
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedExpense.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Payment Method
                  </span>
                  <span className="font-medium text-slate-700">
                    {selectedExpense.paymentMethod.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Reference
                  </span>
                  <span className="font-mono text-slate-700">
                    {selectedExpense.reference || "—"}
                  </span>
                </div>
              </div>

              {selectedExpense.description && (
                <div className="text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                    Memo / Scope
                  </span>
                  <p className="text-slate-800">
                    {selectedExpense.description}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-slate-900">
                  {formatCurrency(selectedExpense.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedExpense(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div
        id="printable-voucher"
        className="mx-auto bg-white max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible hidden print:block w-full text-agm-text"
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
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                    <span>Corporate Tax Registration No: 104094432200001</span>
                    <span>VAT Registration No:104094432200003</span>
                  </div>

                  <div
                    className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                    style={{
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    AGM FITOUT TECHNICAL SERVICES LLC - OPERATING EXPENSES
                    STATEMENT
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 bg-agm-box-bg rounded-xl border border-agm-box-border my-4 print-avoid-break">
                    <div>
                      <span className="text-agm-muted block text-[10px] uppercase font-bold">
                        Total Expenses
                      </span>
                      <span className="font-black text-agm-text font-mono">
                        {formatCurrency(metrics.totalExpenses)}
                      </span>
                    </div>
                    <div>
                      <span className="text-agm-muted block text-[10px] uppercase font-bold">
                        Net Costs
                      </span>
                      <span className="font-bold text-agm-text font-mono">
                        {formatCurrency(metrics.netAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-agm-muted block text-[10px] uppercase font-bold">
                        Input VAT
                      </span>
                      <span className="font-bold text-blue-700 font-mono">
                        {formatCurrency(metrics.totalTax)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-agm-text text-xs">
                      Expense Records ({filteredExpenses.length} entries)
                    </h4>
                    <div className="rounded-xl border border-agm-box-border overflow-hidden">
                      <table className="w-full text-left text-xs text-agm-text">
                        <thead className="bg-agm-box-bg border-b border-agm-box-border">
                          <tr>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-agm-text uppercase">
                              Voucher #
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-agm-text uppercase">
                              Date
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-agm-text uppercase">
                              Category &amp; Payee
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-agm-text uppercase">
                              Method
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-agm-text uppercase text-right">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-agm-box-border font-mono">
                          {filteredExpenses.map((e) => (
                            <tr key={e.id}>
                              <td className="py-2 px-3 font-bold text-agm-text">
                                {e.expenseNumber}
                              </td>
                              <td className="py-2 px-3 text-agm-muted">
                                {new Date(e.expenseDate).toLocaleDateString(
                                  "en-GB",
                                )}
                              </td>
                              <td className="py-2 px-3 font-sans">
                                <span className="font-bold text-agm-text">
                                  {e.category}
                                </span>
                                {e.payee ? ` - ${e.payee}` : ""}
                              </td>
                              <td className="py-2 px-3 font-sans text-agm-text">
                                {e.paymentMethod.replace("_", " ")}
                              </td>
                              <td
                                align="right"
                                className="py-2 px-3 font-mono font-bold text-agm-text"
                              >
                                {formatCurrency(e.totalAmount)}
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

        <div className="print-footer-bottom fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
