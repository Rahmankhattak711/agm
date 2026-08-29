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
} from "@/components/ui";
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

  // Form State
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salesInvoiceId, setSalesInvoiceId] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const netSub = parseFloat(amount) || 0;
    const netVat = netSub * 0.05;
    const netTot = netSub + netVat;

    try {
      await createCreditNoteMutation.mutateAsync({
        creditNoteNumber: creditNoteNumber || undefined,
        customerId: customerId || undefined,
        customerName: customerName || "Customer",
        salesInvoiceId: salesInvoiceId || undefined,
        returnDate,
        reason,
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        items: [
          {
            description: reason || "Scope alteration / return",
            quantity: 1,
            unitPrice: netSub,
          },
        ],
        autoPost: true,
      });
      setIsCreateOpen(false);
      setAmount("");
      setReason("");
    } catch (err: any) {
      alert(`Error creating credit note: ${err.message}`);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sales Returns & Credit Notes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
              Sales Cycle — Adjustments
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Issue client credit notes, record scope cancellations, reduce Accounts Receivable, and adjust Output VAT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Credit Note
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Total Credit Notes Issued
          </p>
          <p className="text-xl font-black text-rose-950 font-mono">
            AED {totalCreditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

      {/* Search */}
      <div className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <Search size={14} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search credit note number, client, reason..."
          className="w-full text-xs bg-transparent outline-none text-slate-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
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
                    {cn.returnDate ? new Date(cn.returnDate).toISOString().slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {cn.reason}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-rose-950"
                  >
                    AED {Number(cn.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

      {/* Create Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Issue Sales Credit Note"
        >
          <form onSubmit={handleCreateCreditNote} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-rose-500 font-semibold"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) setCustomerName(c.name);
                  }}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Linked Invoice (Optional)
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-rose-500 font-mono"
                  value={salesInvoiceId}
                  onChange={(e) => {
                    setSalesInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) {
                      setCustomerName(inv.customerName);
                      if (inv.customerId) setCustomerId(inv.customerId);
                    }
                  }}
                >
                  <option value="">Direct Account Adjustment</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reason for Credit Note / Scope Reduction
              </label>
              <textarea
                rows={2}
                placeholder="Client cancelled specific scope item, dimension revision..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-rose-500"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Credit Subtotal Amount (AED Excl. VAT)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-rose-500 font-mono font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                size="sm"
                type="submit"
                className="bg-rose-700 text-white hover:bg-rose-800"
              >
                Post Credit Note & Reverse AR
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Credit Note Detail Modal */}
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
                  {selectedNote.returnDate ? new Date(selectedNote.returnDate).toISOString().slice(0, 10) : ""}
                </span>
              </div>
              <p className="font-bold text-slate-900">
                Customer: {selectedNote.customerName}
              </p>
              <p className="text-slate-600">
                Reason: {selectedNote.reason}
              </p>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-center font-mono space-y-1">
              <p className="text-xs uppercase font-bold text-rose-800">
                Total Credit Amount (Incl. 5% VAT)
              </p>
              <p className="text-2xl font-black text-rose-950">
                AED {Number(selectedNote.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
