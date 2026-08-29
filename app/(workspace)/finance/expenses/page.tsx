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
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import {
  Plus,
  Search,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Tag,
  Scale,
} from "lucide-react";

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

  const expenses = data?.expenses || [];
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

    // Set default expense and bank accounts if available
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

  // Filtered totals
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Direct Operating Expenses & Claims
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record company overheads, utilities, government fees, and
            operational claims with automated General Ledger posting.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
          className="bg-[#28633a] hover:bg-[#1f4d2d] text-white font-bold"
        >
          Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </p>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <Receipt size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(summary.totalAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.count} recorded claims & vouchers
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              This Month
            </p>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {formatCurrency(thisMonthExpenses)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Current calendar month spend
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              VAT Recoverable (5%)
            </p>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-800">
              <Scale size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-900 mt-1">
            {formatCurrency(summary.totalTax)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Input tax claimable on FTA return
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payment Methods
            </p>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
              <CreditCard size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-1">
            Bank &amp; Card
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto GL ledger reconciliation
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expense #, payee, description..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <select
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="ALL">All Payment Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <select
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="APPROVED">Approved</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/80 border-b border-slate-200">
            <TableHeaderCell className="py-3.5 px-4 font-bold text-slate-600">
              Expense No
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-4 font-bold text-slate-600">
              Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-4 font-bold text-slate-600">
              Category &amp; Payee
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-4 font-bold text-slate-600">
              Description &amp; Ref
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-4 font-bold text-slate-600">
              Payment Method
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3.5 px-4 text-right font-bold text-slate-600"
            >
              Total (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-3 font-bold text-slate-600">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3.5 px-3 text-center font-bold text-slate-600">
              Actions
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={8} rows={5} />
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-slate-400 italic"
                >
                  No operating expenses found. Click &quot;Record Expense&quot;
                  above to create your first claim.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow
                  key={exp.id}
                  className="hover:bg-slate-50/60 transition"
                >
                  <TableCell className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                    {exp.expenseNumber}
                  </TableCell>

                  <TableCell className="py-3.5 px-4 text-slate-600">
                    {new Date(exp.expenseDate).toLocaleDateString("en-GB")}
                  </TableCell>

                  <TableCell className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {exp.category}
                    </span>
                    {exp.payee && (
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">
                        {exp.payee}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    <p className="truncate font-medium text-slate-800">
                      {exp.description || "—"}
                    </p>
                    {exp.reference && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Ref: {exp.reference}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                      <CreditCard size={12} className="text-slate-400" />
                      {exp.paymentMethod.replace("_", " ")}
                    </span>
                    {exp.paymentAccount && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {exp.paymentAccount.accountName}
                      </p>
                    )}
                  </TableCell>

                  <TableCell align="right" className="py-3.5 px-4 text-right">
                    <span className="font-mono font-black text-slate-900">
                      {formatCurrency(exp.totalAmount)}
                    </span>
                    {Number(exp.taxAmount) > 0 && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        (Incl. VAT {formatCurrency(exp.taxAmount)})
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        exp.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : exp.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {exp.status}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePrint(exp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="Print Expense Voucher"
                      >
                        <Printer size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id, exp.expenseNumber)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Direct Operating Expense"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
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
              <select
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
              </select>
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
              <select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formTaxRate}
                onChange={(e) => setFormTaxRate(e.target.value)}
              >
                <option value="5">5% Standard VAT</option>
                <option value="0">0% / Zero-rated</option>
                <option value="0">Exempt</option>
              </select>
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
              <select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value as any)}
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Company Credit Card</option>
                <option value="CASH">Cash on Hand</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paid From (Asset / Bank Account)
              </label>
              <select
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
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Account (Chart of Accounts)
            </label>
            <select
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
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Business Purpose
            </label>
            <textarea
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
              className="bg-[#28633a] hover:bg-[#1f4d2d] text-white font-bold"
            >
              {createMutation.isPending
                ? "Recording..."
                : "Record & Post Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Expense Voucher"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div
              id="printable-voucher"
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    AGM AL GHAIL MARINE
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

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">
                  Net Amount:
                </span>
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
                onClick={() => setIsPrintModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                icon={<Printer size={14} />}
                className="bg-[#28633a] hover:bg-[#1f4d2d] text-white"
              >
                Print Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
