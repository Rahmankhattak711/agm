"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Printer,
  RotateCcw,
  Search,
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
  PageHeader,
  FilterBar,
} from "@/components/ui";
import { useForm } from "@tanstack/react-form";
import {
  useCreditNotes,
  useCreateCreditNote,
  useCustomers,
  useSalesInvoices,
  CreditNote,
} from "@/lib/hooks/api-hooks";

export default function CreditNotesPage() {
  const { data: creditNotes = [], isLoading } = useCreditNotes();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();

  const createCreditNoteMutation = useCreateCreditNote();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      creditNoteNumber: "",
      customerId: "",
      customerName: "",
      salesInvoiceId: "",
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
        await createCreditNoteMutation.mutateAsync({
          creditNoteNumber: value.creditNoteNumber.trim() || undefined,
          customerId: value.customerId || undefined,
          customerName: value.customerName || "Customer",
          salesInvoiceId: value.salesInvoiceId || undefined,
          returnDate: value.returnDate,
          reason: value.reason.trim(),
          subtotal: netSub,
          vatAmount: netVat,
          totalAmount: netTot,
          items: [
            {
              description: value.reason.trim() || "Scope alteration / return",
              quantity: 1,
              unitPrice: netSub,
            },
          ],
          autoPost: true,
        });
        setIsCreateOpen(false);
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to create credit note");
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

  const filteredNotes = creditNotes.filter((cn) => {
    const matchesSearch =
      cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      cn.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (cn.reason && cn.reason.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  const totalCreditAmount = filteredNotes.reduce(
    (s, c) => s + Number(c.totalAmount),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        badge={
          <Badge tone="rose" size="md">
            Sales Cycle — Adjustments
          </Badge>
        }
        description="Issue customer credit notes, process sales returns, adjust accounts receivable, and update output VAT."
        actions={
          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Credit Note
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Total Credit Notes Issued
          </p>
          <p className="text-xl font-black text-rose-950 font-mono">
            AED{" "}
            {totalCreditAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Active Credit Vouchers
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {creditNotes.length} Vouchers
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            AR Reversals Posted
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            100% Synced
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search credit note number, client, reason..."
        totalCount={filteredNotes.length}
        countLabel="Credit Notes Listed"
      />

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Credit Note No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Applied Invoice
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
              Credit Total (AED)
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
                  No credit notes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredNotes.map((cn) => (
                <TableRow
                  key={cn.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-rose-950">
                    {cn.creditNoteNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    {cn.customerName}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-slate-700">
                    {cn.salesInvoice?.invoiceNumber || "Direct AR Adjustment"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {cn.returnDate
                      ? new Date(cn.returnDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {cn.reason}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-rose-950"
                  >
                    AED{" "}
                    {Number(cn.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {cn.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedNote(cn)}
                      className="p-1 text-slate-400 hover:text-rose-700 rounded-md hover:bg-rose-50"
                      title="View Credit Note"
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
          title="Issue Sales Credit Note"
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
              <form.Field name="customerId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Customer"
                    onChange={(e) => {
                      const cid = e.target.value;
                      field.handleChange(cid);
                      const c = customers.find((cust) => cust.id === cid);
                      if (c) form.setFieldValue("customerName", c.name);
                    }}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </form.Field>

              <form.Field name="salesInvoiceId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Linked Invoice (Optional)"
                    onChange={(e) => {
                      const iid = e.target.value;
                      field.handleChange(iid);
                      const inv = invoices.find((i) => i.id === iid);
                      if (inv) {
                        form.setFieldValue("customerName", inv.customerName);
                        if (inv.customerId)
                          form.setFieldValue("customerId", inv.customerId);
                      }
                    }}
                  >
                    <option value="">Direct Account Adjustment</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customerName}
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
                  label="Reason for Credit Note / Scope Reduction"
                  rows={2}
                  placeholder="Client cancelled specific scope item, dimension revision..."
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
                  label="Credit Subtotal Amount (AED Excl. VAT)"
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
                className="bg-rose-700 text-white hover:bg-rose-800"
              >
                Post Credit Note &amp; Reverse AR
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={`Credit Note: ${selectedNote.creditNoteNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-rose-950">
                  {selectedNote.creditNoteNumber}
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
                Customer: {selectedNote.customerName}
              </p>
              <p className="text-slate-600">Reason: {selectedNote.reason}</p>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-center font-mono space-y-1">
              <p className="text-xs uppercase font-bold text-rose-800">
                Total Credit Amount (Incl. 5% VAT)
              </p>
              <p className="text-2xl font-black text-rose-950">
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
                Print Credit Note
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
