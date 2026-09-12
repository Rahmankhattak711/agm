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
} from "@/components/ui";
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

  const [debitNoteNumber, setDebitNoteNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierBillId, setSupplierBillId] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const handleCreateDebitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const netSub = parseFloat(amount) || 0;
    const netVat = netSub * 0.05;
    const netTot = netSub + netVat;

    try {
      await createDebitNoteMutation.mutateAsync({
        debitNoteNumber: debitNoteNumber || undefined,
        supplierId: supplierId || undefined,
        supplierName: supplierName || "Vendor",
        supplierBillId: supplierBillId || undefined,
        returnDate,
        reason,
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        items: [
          {
            description: reason || "Returned defective batch",
            quantity: 1,
            unitCost: netSub,
          },
        ],
        autoPost: true,
      });
      setIsCreateOpen(false);
      setAmount("");
      setReason("");
    } catch (err: any) {
      alert(`Error creating debit note: ${err.message}`);
    }
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
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Procurement Cycle — Adjustments
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Issue supplier debit notes, record rejected materials, and reduce accounts payable liabilities.
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
          onClose={() => setIsCreateOpen(false)}
          title="Issue Supplier Debit Note"
        >
          <form onSubmit={handleCreateDebitNote} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier / Vendor
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-amber-500 font-semibold"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const s = suppliers.find(
                      (sup) => sup.id === e.target.value,
                    );
                    if (s) setSupplierName(s.name);
                  }}
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Linked Supplier Bill (Optional)
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-amber-500 font-mono"
                  value={supplierBillId}
                  onChange={(e) => {
                    setSupplierBillId(e.target.value);
                    const bill = bills.find((b) => b.id === e.target.value);
                    if (bill) {
                      setSupplierName(bill.supplierName);
                      if (bill.supplierId) setSupplierId(bill.supplierId);
                    }
                  }}
                >
                  <option value="">Direct AP Deduction</option>
                  {bills.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} - {b.supplierName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reason for Return / Defect Description
              </label>
              <textarea
                rows={2}
                placeholder="Defective timber shipment returned, damaged granite slabs..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-amber-500"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Debit Subtotal Amount (AED Excl. VAT)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-amber-500 font-mono font-bold"
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
                className="bg-amber-700 text-white hover:bg-amber-800"
              >
                Post Debit Note & Deduct AP
              </Button>
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
