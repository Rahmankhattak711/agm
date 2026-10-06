"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Printer,
  Search,
  Undo2,
} from "lucide-react";
import {
  Button,
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
  Badge,
} from "@/components/ui";
import { useForm } from "@tanstack/react-form";
import {
  useDebitNotes,
  useCreateDebitNote,
  useSuppliers,
  useSupplierBills,
  DebitNote,
} from "@/lib/hooks/api-hooks";

export default function DebitNotesPage() {
  const { data: debitNotes = [], isLoading } = useDebitNotes();
  const { data: suppliers = [] } = useSuppliers();
  const { data: bills = [] } = useSupplierBills();

  const createDebitNoteMutation = useCreateDebitNote();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DebitNote | null>(null);
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      debitNoteNumber: "",
      supplierId: "",
      supplierName: "",
      supplierBillId: "",
      returnDate: new Date().toISOString().slice(0, 10),
      reason: "",
      amount: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      const netSub = parseFloat(value.amount) || 0;
      const netVat = netSub * 0.05;
      const netTot = netSub + netVat;

      try {
        await createDebitNoteMutation.mutateAsync({
          debitNoteNumber: value.debitNoteNumber.trim() || undefined,
          supplierId: value.supplierId || undefined,
          supplierName: value.supplierName || "Vendor",
          supplierBillId: value.supplierBillId || undefined,
          returnDate: value.returnDate,
          reason: value.reason.trim(),
          subtotal: netSub,
          vatAmount: netVat,
          totalAmount: netTot,
          items: [
            {
              description: value.reason.trim() || "Returned defective batch",
              quantity: 1,
              unitCost: netSub,
            },
          ],
          autoPost: true,
        });
        setIsCreateOpen(false);
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to create debit note");
      }
    },
  });

  const handleOpenCreate = () => {
    setFormError("");
    form.reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    form.reset();
  };

  const filteredNotes = debitNotes.filter((dn) => {
    const matchesSearch =
      dn.debitNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      dn.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (dn.reason && dn.reason.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  const totalDebitAmount = filteredNotes.reduce(
    (s, d) => s + Number(d.totalAmount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Debit Notes
            </h2>
            <Badge tone="amber" size="md">
              Procurement Cycle — Adjustments
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Issue supplier debit notes, record rejected materials, and reduce
            accounts payable liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Debit Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Total Debit Notes Issued
          </p>
          <p className="text-xl font-black text-amber-950 font-mono">
            AED{" "}
            {totalDebitAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Active Debit Vouchers
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {debitNotes.length} Vouchers
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            AP Deductions Synced
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            100% Synced
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <Search size={14} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search debit note number, supplier, reason..."
          className="w-full text-xs bg-transparent outline-none text-slate-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Debit Note No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Applied Bill
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Reason
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Debit Total (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              View
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={8} rows={5} />
            ) : filteredNotes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No debit notes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredNotes.map((dn) => (
                <TableRow
                  key={dn.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-amber-950">
                    {dn.debitNoteNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    {dn.supplierName}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-slate-700">
                    {dn.supplierBill?.billNumber || "Direct AP Adjustment"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {dn.returnDate
                      ? new Date(dn.returnDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {dn.reason}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-amber-950"
                  >
                    AED{" "}
                    {Number(dn.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {dn.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedNote(dn)}
                      className="p-1 text-slate-400 hover:text-amber-700 rounded-md hover:bg-amber-50"
                      title="View Debit Note"
                    >
                      <Eye size={13} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Issue Supplier Debit Note"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 text-xs"
          >
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <form.Field name="supplierId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Supplier / Vendor"
                    onChange={(e) => {
                      const sid = e.target.value;
                      field.handleChange(sid);
                      const s = suppliers.find((sup) => sup.id === sid);
                      if (s) form.setFieldValue("supplierName", s.name);
                    }}
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </form.Field>

              <form.Field name="supplierBillId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Linked Supplier Bill (Optional)"
                    onChange={(e) => {
                      const bid = e.target.value;
                      field.handleChange(bid);
                      const bill = bills.find((b) => b.id === bid);
                      if (bill) {
                        form.setFieldValue("supplierName", bill.supplierName);
                        if (bill.supplierId)
                          form.setFieldValue("supplierId", bill.supplierId);
                      }
                    }}
                  >
                    <option value="">Direct AP Deduction</option>
                    {bills.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.billNumber} - {b.supplierName}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </form.Field>
            </div>

            <form.Field
              name="reason"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Reason is required" : undefined,
              }}
            >
              {(field) => (
                <FormTextarea
                  field={field}
                  label="Reason for Return / Defect Description"
                  rows={2}
                  placeholder="Defective timber shipment returned, damaged granite slabs..."
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) =>
                  !value || parseFloat(value) <= 0
                    ? "Valid amount is required"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Debit Subtotal Amount (AED Excl. VAT)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="font-mono font-bold"
                  required
                />
              )}
            </form.Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseCreate}
              >
                Cancel
              </Button>
              <FormSubmit
                form={form}
                size="sm"
                className="bg-amber-700 text-white hover:bg-amber-800"
              >
                Post Debit Note &amp; Deduct AP
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={`Debit Note: ${selectedNote.debitNoteNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-amber-950">
                  {selectedNote.debitNoteNumber}
                </span>
                <span className="text-slate-500">
                  {selectedNote.returnDate
                    ? new Date(selectedNote.returnDate)
                        .toISOString()
                        .slice(0, 10)
                    : ""}
                </span>
              </div>
              <p className="font-bold text-slate-900">
                Supplier: {selectedNote.supplierName}
              </p>
              <p className="text-slate-600">Reason: {selectedNote.reason}</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center font-mono space-y-1">
              <p className="text-xs uppercase font-bold text-amber-800">
                Total Debit Amount (Incl. 5% VAT)
              </p>
              <p className="text-2xl font-black text-amber-950">
                AED{" "}
                {Number(selectedNote.totalAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNote(null)}
              >
                Close
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
                className="bg-slate-900 text-white"
              >
                Print Debit Note
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
