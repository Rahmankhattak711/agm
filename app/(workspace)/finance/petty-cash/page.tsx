"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import {
  useCreatePettyCash,
  useDeletePettyCash,
  usePettyCash,
  useUpdatePettyCash,
  PettyCashTransaction,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  DataTable,
  FormInput,
  FormSubmit,
  Input,
  Modal,
} from "@/components/ui";

export default function PettyCashPage() {
  const { data: transactions = [], isLoading, error } = usePettyCash();
  const createPettyCashMutation = useCreatePettyCash();
  const updatePettyCashMutation = useUpdatePettyCash();
  const deletePettyCashMutation = useDeletePettyCash();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PettyCashTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const totalTopUps = useMemo(
    () =>
      (transactions || [])
        .filter((t) => t.transactionType === "TOP_UP")
        .reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  );

  const totalDisbursements = useMemo(
    () =>
      (transactions || [])
        .filter((t) => t.transactionType === "DISBURSEMENT")
        .reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  );

  const pendingCount = useMemo(
    () => (transactions || []).filter((t) => !t.isApproved).length,
    [transactions]
  );

  const approvedCount = useMemo(
    () => (transactions || []).filter((t) => t.isApproved).length,
    [transactions]
  );

  const netBalance = totalTopUps - totalDisbursements;

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.voucherNumber.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterType === "ALL") return true;
      if (filterType === "DISBURSEMENT") return tx.transactionType === "DISBURSEMENT";
      if (filterType === "TOP_UP") return tx.transactionType === "TOP_UP";
      if (filterType === "PENDING") return !tx.isApproved;
      if (filterType === "APPROVED") return tx.isApproved;
      return true;
    });
  }, [transactions, search, filterType]);

  const handleToggleApproval = async (voucher: PettyCashTransaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const nextStatus = !voucher.isApproved;
      await updatePettyCashMutation.mutateAsync({
        id: voucher.id,
        isApproved: nextStatus,
      });
      showNotification(
        nextStatus
          ? `Voucher ${voucher.voucherNumber} marked as Approved!`
          : `Voucher ${voucher.voucherNumber} set to Pending.`
      );
      if (selectedVoucher?.id === voucher.id) {
        setSelectedVoucher((prev) => (prev ? { ...prev, isApproved: nextStatus } : null));
      }
    } catch (err: any) {
      alert("Error updating approval status: " + (err.message || "Unknown error"));
    }
  };

  const handleDelete = async (voucher: PettyCashTransaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete Voucher ${voucher.voucherNumber}?`)) {
      return;
    }
    try {
      await deletePettyCashMutation.mutateAsync(voucher.id);
      showNotification(`Voucher ${voucher.voucherNumber} deleted successfully.`);
      if (selectedVoucher?.id === voucher.id) {
        setIsDetailsOpen(false);
      }
    } catch (err: any) {
      alert("Error deleting voucher: " + (err.message || "Unknown error"));
    }
  };

  const handleOpenDetails = (voucher: PettyCashTransaction) => {
    setSelectedVoucher(voucher);
    setIsDetailsOpen(true);
  };

  const form = useForm({
    defaultValues: {
      voucherNumber: `PCV-${Date.now().toString().slice(-5)}`,
      transactionDate: new Date().toISOString().split("T")[0],
      category: "Operational Expense",
      categoryType: "OPERATIONAL_EXPENSE" as "OPERATIONAL_EXPENSE" | "LOCAL_GOVERNMENT" | "BANK_CHARGE",
      amount: "",
      transactionType: "DISBURSEMENT" as "DISBURSEMENT" | "TOP_UP",
      notes: "",
      receiptImageUrl: "",
      isApproved: false,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createPettyCashMutation.mutateAsync({
          voucherNumber: value.voucherNumber.trim(),
          transactionDate: value.transactionDate,
          category: value.category.trim(),
          categoryType: value.categoryType,
          amount: Number(value.amount),
          transactionType: value.transactionType,
          notes: value.notes.trim() || undefined,
          receiptImageUrl: value.receiptImageUrl.trim() || undefined,
          isApproved: value.isApproved,
        });
        setIsModalOpen(false);
        showNotification(`Voucher ${value.voucherNumber.trim()} created successfully!`);
      } catch (err: any) {
        setFormError(err.message || "Failed to record petty cash voucher");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      voucherNumber: `PCV-${Date.now().toString().slice(-5)}`,
      transactionDate: new Date().toISOString().split("T")[0],
      category: "Operational Expense",
      categoryType: "OPERATIONAL_EXPENSE",
      amount: "",
      transactionType: "DISBURSEMENT",
      notes: "",
      receiptImageUrl: "",
      isApproved: false,
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<PettyCashTransaction>[]>(
    () => [
      {
        accessorKey: "voucherNumber",
        header: "Voucher #",
        cell: ({ row }) => (
          <button
            onClick={() => handleOpenDetails(row.original)}
            className="font-mono font-bold text-slate-900 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 transition-colors px-2 py-0.5 rounded text-xs text-left"
            title="Click to view details"
          >
            {row.original.voucherNumber}
          </button>
        ),
      },
      {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs">
            {new Date(row.original.transactionDate).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category / Description",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs">
              {row.original.category}
            </span>
            {row.original.notes && (
              <span className="text-[11px] text-slate-400 truncate max-w-xs">
                {row.original.notes}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isTopUp
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isTopUp ? "Top-Up" : "Disbursement"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount (AED)",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <span
              className={`font-mono font-bold text-xs ${
                isTopUp ? "text-blue-700" : "text-slate-900"
              }`}
            >
              {isTopUp ? "+" : "-"} {formatCurrency(row.original.amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "isApproved",
        header: "Status & Approval",
        cell: ({ row }) => {
          const isAppr = row.original.isApproved;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                  isAppr
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isAppr ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-600" /> Approved
                  </>
                ) : (
                  <>
                    <Clock size={12} className="text-amber-600" /> Pending
                  </>
                )}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => handleToggleApproval(row.original, e)}
                className={`text-[10px] px-1.5 py-0.5 h-6 rounded ${
                  isAppr
                    ? "text-slate-400 hover:text-amber-700"
                    : "text-emerald-700 font-bold hover:bg-emerald-50"
                }`}
                title={isAppr ? "Revert to Pending" : "Approve this Voucher"}
              >
                {isAppr ? "Revoke" : "Approve"}
              </Button>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDetails(row.original)}
              className="p-1 text-slate-500 hover:text-slate-900 h-7 w-7"
              title="View Details"
              icon={<Eye size={14} />}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(row.original, e)}
              className="p-1 text-slate-400 hover:text-red-600 h-7 w-7"
              title="Delete Voucher"
              icon={<Trash2 size={14} />}
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Petty Cash Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track daily disbursements, operational cash expenses, voucher approvals, and float replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-1">
              <CheckCircle2 size={14} /> {actionSuccessMsg}
            </span>
          )}

          <Button
            variant="primary"
            onClick={handleOpenModal}
            icon={<Plus size={15} />}
          >
            Add Voucher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available Float Balance
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Net in-hand float</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Disbursements
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalDisbursements)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total cash paid out</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Top-Ups
          </p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {formatCurrency(totalTopUps)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Replenishments credited</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Approval Queue
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-700">{approvedCount} Approved</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Voucher compliance</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search voucher #, category, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: "ALL", label: "All" },
              { id: "DISBURSEMENT", label: "Disbursements" },
              { id: "TOP_UP", label: "Top-Ups" },
              { id: "PENDING", label: `Pending (${pendingCount})` },
              { id: "APPROVED", label: `Approved (${approvedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterType === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading petty cash records: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTransactions}
            isLoading={isLoading}
            emptyTitle="No petty cash vouchers found"
            emptyMessage="Click 'Add Voucher' to record cash expenses or float top-ups."
          />
        )}
      </div>

      {/* Record Petty Cash Voucher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Petty Cash Voucher"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="voucherNumber"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Voucher number is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Voucher Number *"
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="transactionDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Date is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="date"
                  label="Date *"
                  required
                />
              )}
            </form.Field>
          </div>

          <form.Field name="transactionType">
            {(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => field.handleChange("DISBURSEMENT")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      field.state.value === "DISBURSEMENT"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Disbursement (Paid Out)
                  </button>
                  <button
                    type="button"
                    onClick={() => field.handleChange("TOP_UP")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      field.state.value === "TOP_UP"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Top-Up (Replenishment)
                  </button>
                </div>
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field
              name="category"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Category is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Category / Expense *"
                  placeholder="e.g. Office Supplies, Fuel, Refreshment"
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) <= 0
                    ? "Please enter a valid positive amount"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="number"
                  step="0.01"
                  label="Amount (AED) *"
                  placeholder="0.00"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="categoryType">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accounting Classification
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-600"
                  >
                    <option value="OPERATIONAL_EXPENSE">Operational Expense</option>
                    <option value="LOCAL_GOVERNMENT">Local Government / Municipal</option>
                    <option value="BANK_CHARGE">Bank / Courier Charge</option>
                  </select>
                </div>
              )}
            </form.Field>

            <form.Field name="receiptImageUrl">
              {(field) => (
                <FormInput
                  field={field}
                  label="Receipt URL / Attachment Link"
                  placeholder="https://... or receipt reference"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Particulars (Optional)
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Add specific details, vendor name, or recipient name..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="isApproved">
            {(field) => (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  Pre-Approve this Voucher upon creation
                </span>
              </label>
            )}
          </form.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              variant="primary"
              loading={createPettyCashMutation.isPending}
            >
              Save Voucher
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* Voucher Details & Approval Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Voucher Details - ${selectedVoucher?.voucherNumber || ""}`}
        maxWidth="md"
      >
        {selectedVoucher && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">
                    VOUCHER NUMBER
                  </span>
                  <p className="font-mono text-base font-black text-slate-900">
                    {selectedVoucher.voucherNumber}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedVoucher.isApproved
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedVoucher.isApproved ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-600" /> Approved
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-amber-600" /> Pending Approval
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-medium">Transaction Date:</span>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedVoucher.transactionDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Transaction Type:</span>
                  <p className="font-bold text-slate-800">
                    {selectedVoucher.transactionType === "TOP_UP" ? "Top-Up (Float Credit)" : "Disbursement (Expense)"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Category:</span>
                  <p className="font-bold text-slate-800">{selectedVoucher.category}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <p className="font-bold font-mono text-slate-900 text-sm">
                    {formatCurrency(selectedVoucher.amount)}
                  </p>
                </div>
              </div>

              {selectedVoucher.notes && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-medium">Notes:</span>
                  <p className="text-slate-700 mt-0.5">{selectedVoucher.notes}</p>
                </div>
              )}

              {selectedVoucher.receiptImageUrl && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-medium">Receipt / Attachment:</span>
                  <div className="mt-1">
                    <a
                      href={selectedVoucher.receiptImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                    >
                      <ExternalLink size={12} /> View Attachment Link
                    </a>
                  </div>
                </div>
              )}

              {selectedVoucher.approver && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-medium">Approved By:</span>
                  <p className="text-slate-800 font-bold">{selectedVoucher.approver.fullName} ({selectedVoucher.approver.email})</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedVoucher)}
                icon={<Trash2 size={14} />}
              >
                Delete Voucher
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={selectedVoucher.isApproved ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => handleToggleApproval(selectedVoucher)}
                  icon={selectedVoucher.isApproved ? <RotateCcw size={14} /> : <ShieldCheck size={14} />}
                >
                  {selectedVoucher.isApproved ? "Mark as Pending" : "Approve Voucher"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
