"use client";

import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import { formatAed } from "@/lib/utils/format";
import {
  useAccounts,
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournalEntries,
  useUpdateJournalEntry,
} from "@/lib/hooks/api-hooks";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  EditIcon,
  JournalEntriesIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";

interface JournalLineFormItem {
  accountId: string;
  debit: number;
  credit: number;
  vatType?: "INPUT" | "OUTPUT" | null;
  taxableAmount?: number;
  vatAmount?: number;
}

export default function JournalEntriesPage() {
  const { data: journalEntries, isLoading, error } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const { user, canModify } = useAuth();
  const createJournalEntryMutation = useCreateJournalEntry();
  const updateJournalEntryMutation = useUpdateJournalEntry();
  const deleteJournalEntryMutation = useDeleteJournalEntry();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "DRAFT">(
    "ALL",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const getVatAccount = (nature: "INPUT" | "OUTPUT") => {
    if (!accounts || accounts.length === 0) return "";
    if (nature === "INPUT") {
      const match = accounts.find(
        (a) =>
          a.accountCode === "2200" ||
          a.accountName.toLowerCase().includes("vat input") ||
          a.accountName.toLowerCase().includes("input tax"),
      );
      return match?.id || accounts[0]?.id || "";
    } else {
      const match = accounts.find(
        (a) =>
          a.accountCode === "2210" ||
          a.accountName.toLowerCase().includes("vat output") ||
          a.accountName.toLowerCase().includes("output tax"),
      );
      return match?.id || accounts[0]?.id || "";
    }
  };

  const form = useForm({
    defaultValues: {
      entryNumber: `JE-${Date.now().toString().slice(-6)}`,
      entryDate: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      isPosted: true,
      lines: [
        { accountId: "", debit: 0, credit: 0 },
        { accountId: "", debit: 0, credit: 0 },
      ] as JournalLineFormItem[],
    },
    onSubmit: async ({ value }) => {
      setFormError("");

      if (!value.entryNumber.trim() || !value.entryDate) {
        setFormError("Entry number and date are required.");
        return;
      }

      if (value.lines.some((l) => !l.accountId)) {
        setFormError("Please select an account for all lines.");
        return;
      }

      const payloadLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        vatType?: "INPUT" | "OUTPUT" | null;
        taxableAmount?: number;
        vatAmount?: number;
      }> = [];

      for (const l of value.lines) {
        const isDeb = Number(l.debit) > 0;
        const isCred = Number(l.credit) > 0;
        const baseAmt = isDeb ? Number(l.debit) : Number(l.credit);
        const hasVat = !!l.vatType && baseAmt > 0;
        const vatVal = hasVat ? Number((baseAmt * 0.05).toFixed(2)) : 0;

        payloadLines.push({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          vatType: l.vatType || null,
          taxableAmount: hasVat ? baseAmt : undefined,
          vatAmount: hasVat ? vatVal : undefined,
        });

        if (hasVat && vatVal > 0) {
          const vatType = l.vatType || (isDeb ? "INPUT" : "OUTPUT");
          const vatAccId = getVatAccount(vatType);
          const alreadyHasVat = value.lines.some(
            (other) =>
              other.accountId === vatAccId &&
              (isDeb
                ? Number(other.debit) === vatVal
                : Number(other.credit) === vatVal),
          );
          if (!alreadyHasVat && vatAccId) {
            payloadLines.push({
              accountId: vatAccId,
              debit: isDeb ? vatVal : 0,
              credit: isCred ? vatVal : 0,
              vatType,
              taxableAmount: baseAmt,
              vatAmount: vatVal,
            });
          }
        }
      }

      const totalDebit = payloadLines.reduce(
        (s, l) => s + (Number(l.debit) || 0),
        0,
      );
      const totalCredit = payloadLines.reduce(
        (s, l) => s + (Number(l.credit) || 0),
        0,
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        setFormError(
          `Journal entry is unbalanced. Total Debit (${formatAed(totalDebit)}) must equal Total Credit (${formatAed(totalCredit)}).`,
        );
        return;
      }

      if (totalDebit <= 0) {
        setFormError("Total amount must be greater than zero.");
        return;
      }

      try {
        if (editingId) {
          await updateJournalEntryMutation.mutateAsync({
            id: editingId,
            entryNumber: value.entryNumber,
            entryDate: value.entryDate,
            description: value.description,
            reference: value.reference,
            isPosted: value.isPosted,
            lines: payloadLines,
          });
        } else {
          await createJournalEntryMutation.mutateAsync({
            entryNumber: value.entryNumber,
            entryDate: value.entryDate,
            description: value.description,
            reference: value.reference,
            isPosted: value.isPosted,
            createdBy: user?.id,
            lines: payloadLines,
          });
        }

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save journal entry");
      }
    },
  });

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return (journalEntries || []).filter((entry) => {
      const matchesSearch =
        entry.entryNumber.toLowerCase().includes(q) ||
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        (entry.reference && entry.reference.toLowerCase().includes(q));

      if (statusFilter === "POSTED") return matchesSearch && entry.isPosted;
      if (statusFilter === "DRAFT") return matchesSearch && !entry.isPosted;
      return matchesSearch;
    });
  }, [journalEntries, search, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError("");

    form.reset({
      entryNumber: `JE-${Date.now().toString().slice(-6)}`,
      entryDate: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      isPosted: true,
      lines: [
        { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
        { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(je.id);
    setFormError("");

    form.reset({
      entryNumber: je.entryNumber,
      entryDate: je.entryDate
        ? new Date(je.entryDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      description: je.description || "",
      reference: je.reference || "",
      isPosted: Boolean(je.isPosted),
      lines:
        je.lines && je.lines.length > 0
          ? je.lines.map((l: any) => ({
              accountId: l.accountId,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
              vatType: l.vatEntry?.vatType || l.vatType,
              taxableAmount: l.vatEntry?.taxableAmount || l.taxableAmount,
              vatAmount: l.vatEntry?.vatAmount || l.vatAmount,
            }))
          : [
              { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
              { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
            ],
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateJournalEntryMutation.mutateAsync({
        id: je.id,
        isPosted: !je.isPosted,
      });
    } catch (err: any) {
      alert(err.message || "Failed to update entry status");
    }
  };

  const handleDelete = async (
    id: string,
    entryNum: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete journal entry "${entryNum}"? This will reverse all associated line items.`,
      )
    ) {
      try {
        await deleteJournalEntryMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete journal entry");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            General Journal Entries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade double-entry bookkeeping vouchers and general ledger
            adjustments.
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          variant="primary"
          icon={<PlusIcon size={16} strokeWidth={2.2} />}
        >
          New Journal Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Entries
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {journalEntries?.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">All ledger vouchers</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Posted Entries
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {journalEntries?.filter((j) => j.isPosted).length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Active in general ledger
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Draft Entries
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {journalEntries?.filter((j) => !j.isPosted).length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending posting review
          </p>
        </div>
      </div>

      <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search entry #, reference, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<SearchIcon size={14} />}
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(["ALL", "POSTED", "DRAFT"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? "dark" : "outline"}
              onClick={() => setStatusFilter(st)}
            >
              {st === "ALL" ? "All" : st === "POSTED" ? "Posted" : "Drafts"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 animate-pulse">
            Loading journal transactions...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500 bg-white rounded-2xl border border-slate-200">
            Error loading entries: {(error as any).message}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <JournalEntriesIcon className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
            <p className="text-sm font-semibold text-slate-600">
              No journal entries found
            </p>
            <p className="text-xs">
              Click &quot;New Journal Entry&quot; to log your first transaction.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((je) => {
              const isExpanded = expandedId === je.id;
              const totalDebit =
                je.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) || 0;

              return (
                <div
                  key={je.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition hover:border-slate-300"
                >
                  <div
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : je.id)}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 !p-0 rounded-xl shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : je.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUpIcon size={16} />
                        ) : (
                          <ChevronDownIcon size={16} />
                        )}
                      </Button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {je.entryNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              je.isPosted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {je.isPosted ? "Posted" : "Draft"}
                          </span>
                          {je.reference && (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Ref: {je.reference}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>
                            Date:{" "}
                            <strong className="text-slate-700">
                              {new Date(je.entryDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </strong>
                          </span>
                          {je.description && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 truncate max-w-[280px]">
                                {je.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Amount
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatAed(totalDebit)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!canModify(je.createdBy, ["ACCOUNTANT"]) ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            View Only
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant={je.isPosted ? "secondary" : "primary"}
                              onClick={(e) => handleToggleStatus(je, e)}
                            >
                              {je.isPosted ? "Unpost" : "Post"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 !p-0 rounded-lg text-slate-400 hover:text-slate-700"
                              onClick={(e) => handleOpenEditModal(je, e)}
                              title="Edit"
                            >
                              <EditIcon size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 !p-0 rounded-lg text-slate-400 hover:text-red-600"
                              onClick={(e) =>
                                handleDelete(je.id, je.entryNumber, e)
                              }
                              title="Delete"
                            >
                              <TrashIcon size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-bold text-slate-700">
                          Line Items Breakdown
                        </span>
                        <span className="text-slate-500">
                          Created by:{" "}
                          <span className="font-semibold text-slate-700">
                            {je.user?.fullName || "System Admin"}
                          </span>
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                              <th className="py-2">Account Code & Name</th>
                              <th className="py-2">Type</th>
                              <th className="py-2 text-right">Debit</th>
                              <th className="py-2 text-right">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {je.lines?.map((line: any) => (
                              <tr key={line.id}>
                                <td className="py-2 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                                      {line.account?.accountCode}
                                    </span>
                                    <span>{line.account?.accountName}</span>
                                    {line.vatEntry && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        5% {line.vatEntry.vatType} VAT · Base:
                                        AED{" "}
                                        {Number(
                                          line.vatEntry.taxableAmount ||
                                            Number(
                                              line.vatEntry.vatAmount || 0,
                                            ) / 0.05,
                                        ).toFixed(2)}{" "}
                                        + VAT: AED{" "}
                                        {Number(
                                          line.vatEntry.vatAmount || 0,
                                        ).toFixed(2)}{" "}
                                        = Total: AED{" "}
                                        {(
                                          Number(
                                            line.vatEntry.taxableAmount ||
                                              Number(
                                                line.vatEntry.vatAmount || 0,
                                              ) / 0.05,
                                          ) +
                                          Number(line.vatEntry.vatAmount || 0)
                                        ).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 text-slate-500 text-[11px]">
                                  {line.account?.type}
                                </td>
                                <td className="py-2 text-right font-mono font-bold text-slate-800">
                                  {Number(line.debit) > 0
                                    ? formatAed(line.debit)
                                    : "—"}
                                </td>
                                <td className="py-2 text-right font-mono font-bold text-slate-800">
                                  {Number(line.credit) > 0
                                    ? formatAed(line.credit)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-slate-200 font-bold bg-white/60">
                              <td
                                colSpan={2}
                                className="py-2 text-right text-slate-600"
                              >
                                Balanced Totals:
                              </td>
                              <td className="py-2 text-right font-mono text-emerald-800">
                                {formatAed(totalDebit)}
                              </td>
                              <td className="py-2 text-right font-mono text-emerald-800">
                                {formatAed(totalDebit)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Journal Entry" : "Record Journal Entry"}
        maxWidth="2xl"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field
              name="entryNumber"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Entry number is required" : undefined,
              }}
            >
              {(field) => {
                const error =
                  field.state.meta.isTouched && field.state.meta.errors[0];
                return (
                  <Input
                    label="Entry Number *"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={error ? String(error) : undefined}
                    className="font-mono font-bold"
                  />
                );
              }}
            </form.Field>

            <form.Field
              name="entryDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Date is required" : undefined,
              }}
            >
              {(field) => (
                <Input
                  label="Date *"
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="isPosted">
              {(field) => (
                <Select
                  label="Status"
                  value={field.state.value ? "POSTED" : "DRAFT"}
                  onChange={(e) =>
                    field.handleChange(e.target.value === "POSTED")
                  }
                  options={[
                    { value: "POSTED", label: "Posted (General Ledger)" },
                    { value: "DRAFT", label: "Draft (Unposted)" },
                  ]}
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="description">
              {(field) => (
                <Input
                  label="Description / Memo"
                  placeholder="e.g. Office rent payment or Sales invoice #1024"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="reference">
              {(field) => (
                <Input
                  label="Reference"
                  placeholder="e.g. INV-2026-001"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="lines">
            {(linesField) => {
              const currentLines = linesField.state.value;

              const addLine = () => {
                linesField.handleChange([
                  ...currentLines,
                  { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
                ]);
              };

              const removeLine = (idx: number) => {
                if (currentLines.length <= 2) return;
                linesField.handleChange(
                  currentLines.filter((_, i) => i !== idx),
                );
              };

              const updateLineFields = (
                idx: number,
                updates: Partial<JournalLineFormItem>,
              ) => {
                const next = currentLines.map((l, i) =>
                  i === idx ? { ...l, ...updates } : l,
                );
                linesField.handleChange(next);
              };

              const totalDebits = currentLines.reduce((s, l) => {
                const isDeb = Number(l.debit) > 0;
                const vat =
                  l.vatType && isDeb
                    ? Number((Number(l.debit) * 0.05).toFixed(2))
                    : 0;
                return s + (Number(l.debit) || 0) + vat;
              }, 0);

              const totalCredits = currentLines.reduce((s, l) => {
                const isCred = Number(l.credit) > 0;
                const vat =
                  l.vatType && isCred
                    ? Number((Number(l.credit) * 0.05).toFixed(2))
                    : 0;
                return s + (Number(l.credit) || 0) + vat;
              }, 0);

              const isBalanced =
                Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

              return (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Transaction Lines
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={addLine}
                      icon={<PlusIcon size={13} strokeWidth={2.2} />}
                    >
                      Add Line
                    </Button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex-1">Account</span>
                    <span className="w-20 sm:w-24 text-right">Debit</span>
                    <span className="w-20 sm:w-24 text-right">Credit</span>
                    <span className="w-28 sm:w-32">VAT / Tax</span>
                    <span className="w-24 sm:w-28 text-right">Line Total</span>
                    <span className="w-7"></span>
                  </div>

                  <div className="space-y-2">
                    {currentLines.map((line, idx) => {
                      const isDeb = Number(line.debit) > 0;
                      const isCred = Number(line.credit) > 0;
                      const baseAmt = isDeb
                        ? Number(line.debit)
                        : Number(line.credit);
                      const vatAmt = line.vatType
                        ? Number((baseAmt * 0.05).toFixed(2))
                        : 0;
                      const totalWithVat = Number(
                        (baseAmt + vatAmt).toFixed(2),
                      );

                      const isLineVat =
                        line.vatType ||
                        accounts
                          ?.find((a) => a.id === line.accountId)
                          ?.accountName.toLowerCase()
                          .includes("vat");

                      return (
                        <div
                          key={idx}
                          className={`p-2 sm:p-2.5 rounded-xl border flex items-center gap-2 transition ${
                            isLineVat
                              ? "bg-emerald-50/50 border-emerald-300"
                              : "bg-slate-50/70 border-slate-200"
                          }`}
                        >
                          <div className="flex-1 min-w-[120px]">
                            <select
                              value={line.accountId}
                              onChange={(e) =>
                                updateLineFields(idx, {
                                  accountId: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium cursor-pointer truncate"
                            >
                              <option value="">Select Account...</option>
                              {accounts?.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.accountCode} - {acc.accountName} (
                                  {acc.type})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-20 sm:w-24">
                            <input
                              type="number"
                              step="any"
                              placeholder="Debit"
                              value={line.debit === 0 ? "" : line.debit}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === "" ? 0 : parseFloat(raw);
                                const debVal = isNaN(num) ? 0 : num;
                                const calculatedVat = line.vatType
                                  ? Number((debVal * 0.05).toFixed(2))
                                  : 0;
                                updateLineFields(idx, {
                                  debit: debVal,
                                  credit: debVal > 0 ? 0 : line.credit,
                                  taxableAmount: line.vatType ? debVal : 0,
                                  vatAmount: calculatedVat,
                                });
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>

                          <div className="w-20 sm:w-24">
                            <input
                              type="number"
                              step="any"
                              placeholder="Credit"
                              value={line.credit === 0 ? "" : line.credit}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === "" ? 0 : parseFloat(raw);
                                const credVal = isNaN(num) ? 0 : num;
                                const calculatedVat = line.vatType
                                  ? Number((credVal * 0.05).toFixed(2))
                                  : 0;
                                updateLineFields(idx, {
                                  credit: credVal,
                                  debit: credVal > 0 ? 0 : line.debit,
                                  taxableAmount: line.vatType ? credVal : 0,
                                  vatAmount: calculatedVat,
                                });
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>

                          <div className="w-28 sm:w-32">
                            <select
                              value={line.vatType ? "VAT_5" : ""}
                              onChange={(e) => {
                                const isVat = e.target.value === "VAT_5";
                                const currentBase = isDeb
                                  ? Number(line.debit)
                                  : Number(line.credit);
                                const calculatedVat = isVat
                                  ? Number((currentBase * 0.05).toFixed(2))
                                  : 0;
                                const resolvedType = isVat
                                  ? isDeb
                                    ? "INPUT"
                                    : "OUTPUT"
                                  : null;
                                updateLineFields(idx, {
                                  vatType: resolvedType,
                                  taxableAmount: isVat ? currentBase : 0,
                                  vatAmount: calculatedVat,
                                });
                              }}
                              className={`w-full px-2 py-1.5 text-[11px] rounded-lg border font-semibold focus:outline-none cursor-pointer transition ${
                                line.vatType
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              <option value="">Non-VAT (0%)</option>
                              <option value="VAT_5">VAT (5%)</option>
                            </select>
                          </div>

                          <div
                            className={`w-24 sm:w-28 px-2 py-1.5 text-xs rounded-lg border font-mono font-bold text-right truncate ${
                              line.vatType
                                ? "bg-emerald-100/70 border-emerald-300 text-emerald-950"
                                : "bg-slate-100 border-slate-200 text-slate-700"
                            }`}
                            title={`Base: ${baseAmt.toFixed(2)} | VAT: ${vatAmt.toFixed(2)} | Gross: ${totalWithVat.toFixed(2)}`}
                          >
                            {totalWithVat > 0
                              ? formatAed(totalWithVat)
                              : "AED 0.00"}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLine(idx)}
                            disabled={currentLines.length <= 2}
                            className="w-7 h-7 !p-0 text-slate-400 hover:text-red-600 disabled:opacity-30 flex-shrink-0"
                            title="Remove line"
                          >
                            <CloseIcon size={13} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${isBalanced ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      <span
                        className={
                          isBalanced ? "text-emerald-800" : "text-red-700"
                        }
                      >
                        {isBalanced
                          ? "Balanced"
                          : `Out of balance: ${(totalDebits - totalCredits).toFixed(2)} AED`}
                      </span>
                    </div>
                    <div className="flex gap-4 font-mono">
                      <span>Total Debits: {totalDebits.toFixed(2)}</span>
                      <span>Total Credits: {totalCredits.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          </form.Field>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={
                createJournalEntryMutation.isPending ||
                updateJournalEntryMutation.isPending
              }
            >
              {editingId ? "Update Entry" : "Post Entry"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
