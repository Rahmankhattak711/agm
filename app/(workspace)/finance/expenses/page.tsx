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
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
  DashboardCard,
  DashboardCardGrid,
  EmptyState,
  PageHeader,
  FilterBar,
  DatePicker,
  DateRangePicker,
} from "@/components/ui";
import {
  PlusIcon,
  ReceiptIcon,
  CreditCardIcon,
  TrashIcon,
  EditIcon,
  FileSpreadsheetIcon,
} from "@/components/icons";
import { formatNumber, formatCurrency } from "@/lib/utils/format";

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
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formPayee, setFormPayee] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTaxRate, setFormTaxRate] = useState("5");
  const [formPaymentMethod, setFormPaymentMethod] = useState<
    "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHEQUE"
  >("BANK_TRANSFER");
  const [formStatus, setFormStatus] = useState<
    "DRAFT" | "APPROVED" | "PAID" | "CANCELLED"
  >("PAID");
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
    startDate: selectedStartDate || undefined,
    endDate: selectedEndDate || undefined,
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

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormPayee("");
    setFormDescription("");
    setFormAmount("");
    setFormTaxRate("5");
    setFormPaymentMethod("BANK_TRANSFER");
    setFormStatus("PAID");
    setFormReference("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCreateJournal(true);
    setFormError("");

    if (expenseAccounts.length > 0) {
      setFormExpenseAccountId(expenseAccounts[0].id);
    } else {
      setFormExpenseAccountId("");
    }
    if (paymentAccounts.length > 0) {
      setFormPaymentAccountId(paymentAccounts[0].id);
    } else {
      setFormPaymentAccountId("");
    }

    setIsCreateOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormCategory(exp.category || EXPENSE_CATEGORIES[0]);
    setFormPayee(exp.payee || "");
    setFormDescription(exp.description || "");
    setFormAmount(String(exp.amount ?? ""));
    const amt = Number(exp.amount) || 0;
    const tax = Number(exp.taxAmount) || 0;
    if (amt > 0 && tax > 0) {
      const calculatedRate = Math.round((tax / amt) * 100);
      setFormTaxRate(calculatedRate === 5 ? "5" : "0");
    } else {
      setFormTaxRate("0");
    }
    setFormPaymentMethod(exp.paymentMethod || "BANK_TRANSFER");
    setFormStatus(exp.status || "PAID");
    setFormReference(exp.reference || "");
    const rawDate = exp.expenseDate
      ? typeof exp.expenseDate === "string"
        ? exp.expenseDate.slice(0, 10)
        : new Date(exp.expenseDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setFormDate(rawDate);
    setFormExpenseAccountId(exp.expenseAccountId || "");
    setFormPaymentAccountId(exp.paymentAccountId || "");
    setFormCreateJournal(false);
    setFormError("");
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingExpense(null);
    setFormError("");
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
      if (editingExpense) {
        await updateMutation.mutateAsync({
          id: editingExpense.id,
          expenseDate: formDate,
          category: formCategory,
          payee: formPayee || undefined,
          description: formDescription || undefined,
          amount: numAmount,
          taxAmount: calculatedTax,
          paymentMethod: formPaymentMethod,
          status: formStatus,
          reference: formReference || undefined,
          expenseAccountId: formExpenseAccountId || undefined,
          paymentAccountId: formPaymentAccountId || undefined,
        });
        toast.success("Expense updated successfully!");
      } else {
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
        toast.success("Expense recorded successfully!");
      }

      setIsCreateOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      setFormError(
        err.message ||
          (editingExpense
            ? "Failed to update expense"
            : "Failed to record expense"),
      );
      toast.error(
        err.message ||
          (editingExpense
            ? "Failed to update expense"
            : "Failed to record expense"),
      );
    }
  };

  const handleDelete = async (id: string, num: string) => {
    const isConfirmed = await confirm({
      title: "Delete Expense",
      message: `Delete expense "${num}"? Associated journal entry will also be removed.`,
      variant: "danger",
      confirmText: "Delete",
    });
    if (isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success(`Expense "${num}" deleted successfully`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete expense");
      }
    }
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
      <PageHeader
        title="Purchase Expenses"
        description="Record and manage operational expenses, vendor bills, and company expenditure claims."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
          >
            Record Expense
          </Button>
        }
      />

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Total Recorded Expenses"
          value={`AED ${formatNumber(summary.totalAmount)}`}
          subtitle={`${summary.count} claims & vouchers`}
          variant="default"
        />
        <DashboardCard
          title="Current Month Spend"
          value={`AED ${formatNumber(thisMonthExpenses)}`}
          subtitle="Monthly operating overhead"
          variant="default"
        />
        <DashboardCard
          title="VAT Recoverable (5%)"
          value={`AED ${formatNumber(summary.totalTax)}`}
          subtitle="FTA Form 201 Box 9 input tax"
          variant="default"
        />
        <DashboardCard
          title="General Ledger"
          value="100% Balanced"
          subtitle="Real-time Journal balancing"
          badge={
            <Badge tone="teal" size="xs">
              Auto Sync
            </Badge>
          }
          variant="default"
        />
      </DashboardCardGrid>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Expenses" },
            { id: "PAID", label: "Paid" },
            { id: "APPROVED", label: "Approved" },
            { id: "DRAFT", label: "Draft" },
          ]}
          activeTab={selectedStatus}
          onTabChange={setSelectedStatus}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search expense #, payee, description..."
          totalCount={expenses.length}
          countLabel="Records Found"
          rightAction={
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <DateRangePicker
                startDate={selectedStartDate}
                endDate={selectedEndDate}
                placeholder="Filter Date"
                align="right"
                onChange={({ startDate, endDate }) => {
                  setSelectedStartDate(startDate);
                  setSelectedEndDate(endDate);
                }}
              />

              <Select
                containerClassName="w-full sm:w-48"
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
                containerClassName="w-full sm:w-40"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
              </Select>
            </div>
          }
        />

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          <Table>
            <TableHead className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHeaderCell className="min-w-[150px]">
                  Expense No
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[100px]">
                  Date
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[180px]">
                  Category & Payee
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[180px]">
                  Description & Ref
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[160px]">
                  Payment Method
                </TableHeaderCell>
                <TableHeaderCell align="right" className="min-w-[130px]">
                  Total (AED)
                </TableHeaderCell>
                <TableHeaderCell align="center" className="min-w-[90px]">
                  Status
                </TableHeaderCell>
                <TableHeaderCell align="right" className="min-w-[80px]">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={8} rows={5} />
              ) : expenses.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="p-0 border-0">
                    <EmptyState
                      icon={
                        <ReceiptIcon size={20} className="text-slate-400" />
                      }
                      title="No expenses found"
                      description={
                        search.trim() !== "" ||
                        selectedCategory !== "ALL" ||
                        selectedStatus !== "ALL" ||
                        selectedMethod !== "ALL" ||
                        selectedStartDate !== "" ||
                        selectedEndDate !== ""
                          ? "No expenses matched your search criteria."
                          : "No expenses in database. Click 'Record Expense' to create one."
                      }
                      actionLabel={
                        search.trim() !== "" ||
                        selectedCategory !== "ALL" ||
                        selectedStatus !== "ALL" ||
                        selectedMethod !== "ALL" ||
                        selectedStartDate !== "" ||
                        selectedEndDate !== ""
                          ? "Reset Filters"
                          : "Record Expense"
                      }
                      onAction={
                        search.trim() !== "" ||
                        selectedCategory !== "ALL" ||
                        selectedStatus !== "ALL" ||
                        selectedMethod !== "ALL" ||
                        selectedStartDate !== "" ||
                        selectedEndDate !== ""
                          ? () => {
                              setSearch("");
                              setSelectedCategory("ALL");
                              setSelectedStatus("ALL");
                              setSelectedMethod("ALL");
                              setSelectedStartDate("");
                              setSelectedEndDate("");
                            }
                          : handleOpenCreate
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                          <FileSpreadsheetIcon size={13} />
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
                          {exp.expenseNumber}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600 font-mono text-xs whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString("en-GB")}
                    </TableCell>

                    <TableCell className="min-w-[180px]">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70 whitespace-nowrap">
                        {exp.category}
                      </span>
                      {exp.payee && (
                        <p className="text-xs font-semibold text-slate-800 mt-1 truncate max-w-[200px]">
                          {exp.payee}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="min-w-[180px] max-w-xs">
                      <p
                        className="truncate text-xs font-medium text-slate-700"
                        title={exp.description || undefined}
                      >
                        {exp.description || "—"}
                      </p>
                      {exp.reference && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {exp.reference}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <CreditCardIcon
                          size={13}
                          className="text-slate-400 shrink-0"
                        />
                        <span>{exp.paymentMethod.replace(/_/g, " ")}</span>
                      </div>
                      {exp.paymentAccount && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {exp.paymentAccount.accountName}
                        </p>
                      )}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="text-right whitespace-nowrap"
                    >
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(exp.totalAmount)}
                      </div>
                      {Number(exp.taxAmount) > 0 && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          (Incl. VAT {formatCurrency(exp.taxAmount)})
                        </p>
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      className="text-center whitespace-nowrap"
                    >
                      <Badge
                        tone={
                          exp.status === "PAID"
                            ? "emerald"
                            : exp.status === "APPROVED"
                              ? "sky"
                              : "slate"
                        }
                        uppercase
                      >
                        {exp.status}
                      </Badge>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="text-right whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-agm-green hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <EditIcon size={14} />
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

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseModal}
        title={
          editingExpense
            ? `Edit Expense (${editingExpense.expenseNumber})`
            : "Record Direct Operating Expense"
        }
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              label="Expense Date"
              required
              format="iso"
              value={formDate}
              onChange={setFormDate}
            />

            <Select
              label="Category *"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payee / Beneficiary"
              placeholder="e.g. DEWA, Etisalat, Landlord, Petrol Station"
              value={formPayee}
              onChange={(e) => setFormPayee(e.target.value)}
            />

            <Input
              label="Reference / Bill #"
              placeholder="e.g. INV-98721, REC-403"
              value={formReference}
              onChange={(e) => setFormReference(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Net Amount (AED) *"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />

            <Select
              label="VAT Rate"
              value={formTaxRate}
              onChange={(e) => setFormTaxRate(e.target.value)}
            >
              <option value="5">5% Standard VAT</option>
              <option value="0">0% / Zero-rated</option>
              <option value="0">Exempt</option>
            </Select>

            <div>
              <label className="block text-xs font-bold text-agm-text mb-1">
                Total with VAT
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-agm-box-border text-xs font-mono font-bold text-slate-900">
                {formatCurrency(calculatedTotal)}
              </div>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${
              editingExpense ? "sm:grid-cols-3" : "sm:grid-cols-2"
            } gap-4`}
          >
            <Select
              label="Payment Method"
              value={formPaymentMethod}
              onChange={(e) => setFormPaymentMethod(e.target.value as any)}
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Company Credit Card</option>
              <option value="CASH">Cash on Hand</option>
              <option value="CHEQUE">Cheque</option>
            </Select>

            <Select
              label="Paid From (Asset Account)"
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

            {editingExpense && (
              <Select
                label="Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
              >
                <option value="PAID">Paid</option>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            )}
          </div>

          <Select
            label="Expense Account (Chart of Accounts)"
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

          <Textarea
            label="Description / Business Purpose"
            rows={2}
            placeholder="e.g. Monthly office internet subscription and landline bill"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          {!editingExpense && (
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
                Automatically post balanced General Ledger journal entry for
                this expense
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={
                editingExpense
                  ? updateMutation.isPending
                  : createMutation.isPending
              }
            >
              {editingExpense ? "Update Expense" : "Record & Post Expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
