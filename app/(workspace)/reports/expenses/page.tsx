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

export default function ExpenseReportsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const { data, isLoading, error } = useExpenses({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    paymentMethod:
      paymentMethodFilter !== "ALL" ? paymentMethodFilter : undefined,
    search: search || undefined,
  });

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const { data: accounts = [] } = useAccounts();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filtered expenses by date
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Date filter
      if (startDate || endDate) {
        const d = new Date(e.expenseDate);
        if (startDate && d < new Date(startDate)) return false;
        if (endDate && d > new Date(endDate)) return false;
      }
      return true;
    });
  }, [expenses, startDate, endDate]);

  // Aggregate Metrics
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

  // Category Breakdown for Chart
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

  // Available unique categories
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Operating Expenses & Overhead Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit direct corporate expenditures, VAT recoverable, and
            departmental cost allocations.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setIsPrintSummaryOpen(true)}
          icon={<PrintIcon className="w-4 h-4" />}
          className="font-bold"
        >
          Print Report Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Expenditure
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(metrics.totalExpenses)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {metrics.count} total expense items
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Net Operating Costs
          </p>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(metrics.netAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Excluding recoverable input VAT
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recoverable VAT (5%)
          </p>
          <p className="text-2xl font-black text-purple-900 mt-1">
            {formatCurrency(metrics.totalTax)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Claimable on VAT 201 return
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Settlement Channels
          </p>
          <p className="text-sm font-bold text-slate-800 mt-1">
            Bank: {formatCurrency(metrics.bankTransferTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Card: {formatCurrency(metrics.cardTotal)} · Cash:{" "}
            {formatCurrency(metrics.cashTotal)}
          </p>
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <ReportSummaryChart
          title="Expense Distribution by Category"
          subtitle="Top operating expense categories across the selected audit period"
          data={categoryBreakdown}
          primaryLegend="Direct Spend"
        />
      )}

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <Input
              placeholder="Search expense #, category, payee, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <select
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="ALL">All Payment Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <ReportDateFilter
              periodFilter={periodFilter}
              startDate={startDate}
              endDate={endDate}
              onPeriodChange={setPeriodFilter}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
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

      <Modal
        isOpen={isPrintSummaryOpen}
        onClose={() => setIsPrintSummaryOpen(false)}
        title="Print Expense Statement"
      >
        <div className="space-y-4">
          <div
            id="print-expense-report"
            className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4"
          >
            <QuotationHeader />

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Total Expenses
                </span>
                <span className="font-black text-slate-900">
                  {formatCurrency(metrics.totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Net Costs
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(metrics.netAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Input VAT
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(metrics.totalTax)}
                </span>
              </div>
            </div>

            <Table className="w-full text-xs">
              <TableHead>
                <TableHeaderCell>Voucher #</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Category &amp; Payee</TableHeaderCell>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell align="right">Amount</TableHeaderCell>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono font-bold">
                      {e.expenseNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(e.expenseDate).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">{e.category}</span>
                      {e.payee ? ` - ${e.payee}` : ""}
                    </TableCell>
                    <TableCell>{e.paymentMethod.replace("_", " ")}</TableCell>
                    <TableCell align="right" className="font-mono font-bold">
                      {formatCurrency(e.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <QuotationFooter />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPrintSummaryOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => window.print()}
              icon={<PrintIcon className="w-4 h-4" />}
              className="bg-[#28633a] text-white"
            >
              Print Statement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
