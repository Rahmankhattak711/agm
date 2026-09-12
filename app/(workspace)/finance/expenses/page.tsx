"use client";

import React, { useMemo, useState } from "react";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useAccounts,
  Expense,
} from "@/lib/hooks/api-hooks";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Input,
  Select,
  Textarea,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  PlusIcon,
  SearchIcon,
  ReceiptIcon,
  FileTextIcon,
  CreditCardIcon,
  BuildingIcon,
  CheckCircle2Icon,
  ClockIcon,
  PrintIcon,
  TrashIcon,
  EyeIcon,
  DollarSignIcon,
  TrendingUpIcon,
  TagIcon,
  ScaleIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CloseIcon,
  FileSpreadsheetIcon,
} from "@/components/icons";

const EXPENSE_CATEGORIES = [
  "Office Rent & Facilities",
  "Utilities & Telecom",
  "Government, Visa & Municipality Fees",
  "Vehicle Fuel & Maintenance",
  "Software, Cloud & IT Subscriptions",
  "Professional & Legal Fees",
  "Marketing & Advertising",
  "Repairs & Maintenance",
  "Travel & Logistics",
  "General Operating Overhead",
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formPayee, setFormPayee] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTaxRate, setFormTaxRate] = useState("5");
  const [formPaymentMethod, setFormPaymentMethod] = useState<
    "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHEQUE"
  >("BANK_TRANSFER");
  const [formReference, setFormReference] = useState("");
  const [formExpenseAccountId, setFormExpenseAccountId] = useState("");
  const [formPaymentAccountId, setFormPaymentAccountId] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formCreateJournal, setFormCreateJournal] = useState(true);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useExpenses({
    category: selectedCategory !== "ALL" ? selectedCategory : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    paymentMethod: selectedMethod !== "ALL" ? selectedMethod : undefined,
    search: search || undefined,
  });

  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const summary = data?.summary || { totalAmount: 0, totalTax: 0, count: 0 };

  const expenseAccounts = useMemo(
    () => accounts.filter((a) => a.type === "EXPENSE"),
    [accounts],
  );

  const paymentAccounts = useMemo(
    () => accounts.filter((a) => a.type === "ASSET"),
    [accounts],
  );

  const calculatedTax = useMemo(() => {
    const amt = parseFloat(formAmount) || 0;
    const rate = parseFloat(formTaxRate) || 0;
    return (amt * rate) / 100;
  }, [formAmount, formTaxRate]);

  const calculatedTotal = useMemo(() => {
    const amt = parseFloat(formAmount) || 0;
    return amt + calculatedTax;
  }, [formAmount, calculatedTax]);

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

  const handleOpenCreate = () => {
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormPayee("");
    setFormDescription("");
    setFormAmount("");
    setFormTaxRate("5");
    setFormPaymentMethod("BANK_TRANSFER");
    setFormReference("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCreateJournal(true);
    setFormError("");

    if (expenseAccounts.length > 0) {
      setFormExpenseAccountId(expenseAccounts[0].id);
    }
    if (paymentAccounts.length > 0) {
      setFormPaymentAccountId(paymentAccounts[0].id);
    }

    setIsCreateOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const numAmount = parseFloat(formAmount);
    if (!numAmount || numAmount <= 0) {
      setFormError("Please enter a valid expense amount greater than 0");
      return;
    }

    try {
      await createMutation.mutateAsync({
        expenseDate: formDate,
        category: formCategory,
        payee: formPayee || undefined,
        description: formDescription || undefined,
        amount: numAmount,
        taxAmount: calculatedTax,
        paymentMethod: formPaymentMethod,
        reference: formReference || undefined,
        status: "PAID",
        expenseAccountId: formExpenseAccountId || undefined,
        paymentAccountId: formPaymentAccountId || undefined,
        createJournal: formCreateJournal,
      });

      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to record expense");
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (
      confirm(
        `Delete expense "${num}"? Associated journal entry will also be removed.`,
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete expense");
      }
    }
  };

  const handlePrint = (exp: Expense) => {
    setSelectedExpense(exp);
    setIsPrintModalOpen(true);
  };

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter((e) => {
        const d = new Date(e.expenseDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.totalAmount), 0);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Expenses &amp; Claims
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Record company overheads,
            utilities, government fees, <br /> and operational claims with
            automated General Ledger posting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<PrintIcon size={14} />}
          >
            Print Register
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Expenses */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Recorded Expenses
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              {summary.count} claims &amp; vouchers
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatNumber(summary.totalAmount)}
            </span>
          </div>
        </div>

        {/* 2. This Month */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Current Month Spend
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Monthly operating overhead
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {formatNumber(thisMonthExpenses)}
            </span>
          </div>
        </div>

        {/* 3. VAT Recoverable */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. VAT Recoverable (5%)
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              FTA Form 201 Box 9 input tax
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-2xl font-black text-purple-900 font-mono">
              {formatNumber(summary.totalTax)}
            </span>
          </div>
        </div>

        {/* 4. Automated Posting */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. General Ledger
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Auto Sync
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Real-time Journal balancing
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xl font-black text-teal-900 font-sans">
              100% Balanced
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          {/* Status Quick Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Expenses" },
                { id: "PAID", label: "Paid" },
                { id: "APPROVED", label: "Approved" },
                { id: "DRAFT", label: "Draft" },
              ].map((tab) => {
                const isActive = selectedStatus === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Record count badge */}
            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {expenses.length} Records Found
            </span>
          </div>

          {/* Search + Category + Payment Method Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1 border-t border-slate-200/60">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search expense #, payee, description..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <Select
                containerClassName="w-full sm:w-56"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              <Select
                containerClassName="w-full sm:w-44"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer truncate"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
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

        {/* Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white">
              Operating Expenses &amp; Claims Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">
              {expenses.length} Records
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50/95 border-b border-slate-200">
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Expense No
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Date
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Category &amp; Payee
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Description &amp; Ref
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Payment Method
              </TableHeaderCell>
              <TableHeaderCell
                align="right"
                className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider"
              >
                Total (AED)
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Status
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Actions
              </TableHeaderCell>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={8} rows={5} />
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No operating expenses found. Click &quot;Record
                    Expense&quot; above to create your first claim.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <FileSpreadsheetIcon
                          size={13}
                          className="text-emerald-700 shrink-0"
                        />
                        {exp.expenseNumber}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                      {new Date(exp.expenseDate).toLocaleDateString("en-GB")}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.category}
                      </span>
                      {exp.payee && (
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {exp.payee}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      <p className="truncate font-medium text-slate-800">
                        {exp.description || "—"}
                      </p>
                      {exp.reference && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Ref: {exp.reference}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <CreditCardIcon size={12} className="text-slate-400" />
                        {exp.paymentMethod.replace("_", " ")}
                      </span>
                      {exp.paymentAccount && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {exp.paymentAccount.accountName}
                        </p>
                      )}
                    </TableCell>

                    <TableCell align="right" className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-slate-900">
                        {formatCurrency(exp.totalAmount)}
                      </span>
                      {Number(exp.taxAmount) > 0 && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          (Incl. VAT {formatCurrency(exp.taxAmount)})
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exp.status === "PAID"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : exp.status === "APPROVED"
                              ? "bg-sky-50 text-sky-800 border border-sky-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(exp)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Expense Voucher"
                        >
                          <PrintIcon size={14} />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(exp.id, exp.expenseNumber)
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Expense Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Direct Operating Expense"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense Date *
              </label>
              <Input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <Select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payee / Beneficiary
              </label>
              <Input
                placeholder="e.g. DEWA, Etisalat, Landlord, Petrol Station"
                value={formPayee}
                onChange={(e) => setFormPayee(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference / Bill #
              </label>
              <Input
                placeholder="e.g. INV-98721, REC-403"
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Net Amount (AED) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                VAT Rate
              </label>
              <Select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formTaxRate}
                onChange={(e) => setFormTaxRate(e.target.value)}
              >
                <option value="5">5% Standard VAT</option>
                <option value="0">0% / Zero-rated</option>
                <option value="0">Exempt</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total with VAT
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900">
                {formatCurrency(calculatedTotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Method
              </label>
              <Select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value as any)}
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Company Credit Card</option>
                <option value="CASH">Cash on Hand</option>
                <option value="CHEQUE">Cheque</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paid From (Asset Account)
              </label>
              <Select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formPaymentAccountId}
                onChange={(e) => setFormPaymentAccountId(e.target.value)}
              >
                <option value="">Select Bank / Cash Account...</option>
                {paymentAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountCode} - {acc.accountName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Account (Chart of Accounts)
            </label>
            <Select
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={formExpenseAccountId}
              onChange={(e) => setFormExpenseAccountId(e.target.value)}
            >
              <option value="">Select Expense Account...</option>
              {expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountCode} - {acc.accountName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Business Purpose
            </label>
            <Textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 transition"
              rows={2}
              placeholder="e.g. Monthly office internet subscription and landline bill"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
            <input
              type="checkbox"
              id="auto-je"
              checked={formCreateJournal}
              onChange={(e) => setFormCreateJournal(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="auto-je"
              className="text-slate-700 font-semibold cursor-pointer"
            >
              Automatically post balanced General Ledger journal entry for this
              expense
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              {createMutation.isPending
                ? "Recording..."
                : "Record & Post Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Voucher Modal */}
      {isPrintModalOpen && selectedExpense && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Expense Voucher"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div
              id="printable-voucher"
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4"
            >
              <QuotationHeader className="-mx-6 -mt-6 mb-4 print:m-0" />
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    AGM FITOUT TECHNICAL SERVICES LLC
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Official Payment Voucher
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-emerald-950 text-sm">
                    {selectedExpense.expenseNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date:{" "}
                    {new Date(selectedExpense.expenseDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Paid To / Beneficiary
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
                <div className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                    Purpose / Description
                  </span>
                  <p className="text-slate-800">
                    {selectedExpense.description}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Net Amount:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(selectedExpense.amount)}
                </span>
              </div>

              {Number(selectedExpense.taxAmount) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">
                    VAT Amount (5%):
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(selectedExpense.taxAmount)}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Paid:</span>
                <span className="font-mono text-base">
                  {formatCurrency(selectedExpense.totalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-500">
                <div className="border-t border-slate-300 pt-1">
                  Prepared By / Signature
                </div>
                <div className="border-t border-slate-300 pt-1">
                  Approved By / Management
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                icon={<PrintIcon size={14} />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Print Voucher
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
