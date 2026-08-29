"use client";

import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
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
  useSupplierBills,
  useCreateSupplierBill,
  usePostSupplierBill,
  useCreateSupplierPayment,
  useSuppliers,
  useProducts,
  SupplierBill,
} from "@/lib/hooks/api-hooks";

export default function SupplierBillsPage() {
  const { data: bills = [], isLoading } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createBillMutation = useCreateSupplierBill();
  const postBillMutation = usePostSupplierBill();
  const paymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(
    null,
  );

  // Form State
  const [billNumber, setBillNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTrn, setSupplierTrn] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  );
  const [items, setItems] = useState([
    {
      productId: "",
      description: "Direct materials / site supply",
      quantity: 1,
      unitCost: 0,
      unit: "PCS",
    },
  ]);
  const [autoPost, setAutoPost] = useState(true);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitCost: 0,
        unit: "PCS",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const next = [...items];
    (next[idx] as any)[field] = value;
    setItems(next);
  };

  const formSubtotal = items.reduce(
    (s, i) =>
      s +
      (parseFloat(String(i.quantity)) || 0) *
        (parseFloat(String(i.unitCost)) || 0),
    0,
  );
  const formVat = formSubtotal * 0.05;
  const formTotal = formSubtotal + formVat;

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBillMutation.mutateAsync({
        billNumber: billNumber || undefined,
        supplierId: supplierId || undefined,
        supplierName: supplierName || "Vendor",
        supplierTrn: supplierTrn || undefined,
        billDate,
        dueDate,
        items,
        autoPost,
      });
      setIsCreateOpen(false);
      setSupplierName("");
      setSupplierId("");
      setSupplierTrn("");
      setItems([
        {
          productId: "",
          description: "Direct materials / site supply",
          quantity: 1,
          unitCost: 0,
          unit: "PCS",
        },
      ]);
    } catch (err: any) {
      alert(`Error creating supplier bill: ${err.message}`);
    }
  };

  const handlePostBill = async (id: string) => {
    try {
      await postBillMutation.mutateAsync(id);
      alert("Supplier bill posted to General Ledger!");
    } catch (err: any) {
      alert(`Error posting bill: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBill) return;

    try {
      await paymentMutation.mutateAsync({
        supplierBillId: paymentModalBill.id,
        supplierId: paymentModalBill.supplierId,
        supplierName: paymentModalBill.supplierName,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        referenceNumber: paymentRef,
      });
      setPaymentModalBill(null);
      setPaymentAmount("");
      setPaymentRef("");
      alert("Supplier payment disbursed and posted to General Ledger!");
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (b.supplierTrn &&
        b.supplierTrn.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPayables = filteredBills.reduce(
    (s, b) => s + Number(b.totalAmount),
    0,
  );
  const totalOutstanding = filteredBills.reduce(
    (s, b) => s + Number(b.remainingBalance),
    0,
  );
  const totalInputVat = filteredBills.reduce(
    (s, b) => s + Number(b.vatAmount),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Supplier Bills & Accounts Payable
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Procurement Cycle — Step 3
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Record vendor tax invoices, calculate 5% Input VAT, manage  <br />Accounts Payable liabilities, and post to General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
          >
            Enter Supplier Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">
            Total Billed by Suppliers
          </p>
          <p className="text-xl font-black text-cyan-950 font-mono">
            AED {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Outstanding Accounts Payable
          </p>
          <p className="text-xl font-black text-rose-950 font-mono">
            AED {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Recoverable Input VAT (5%)
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            AED {totalInputVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search bill number, vendor, TRN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {["ALL", "POSTED", "PARTIALLY_PAID", "PAID", "DRAFT"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Bill No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Bill Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Due Date
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Total (AED)
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Balance Due
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              Actions
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={8} rows={5} />
            ) : filteredBills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No supplier bills found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((b) => (
                <TableRow
                  key={b.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-cyan-950">
                    {b.billNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    <div>{b.supplierName}</div>
                    {b.supplierTrn && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        TRN: {b.supplierTrn}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {b.billDate ? new Date(b.billDate).toISOString().slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {b.dueDate ? new Date(b.dueDate).toISOString().slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-3 text-right font-mono font-black text-slate-900"
                  >
                    AED {Number(b.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      Number(b.remainingBalance) > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    AED {Number(b.remainingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "POSTED"
                          ? "bg-blue-100 text-blue-800"
                          : b.status === "PARTIALLY_PAID"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(b)}
                        className="p-1 text-slate-400 hover:text-cyan-700 rounded-md hover:bg-cyan-50"
                        title="View Bill"
                      >
                        <Eye size={13} />
                      </button>
                      {b.status === "DRAFT" && (
                        <Button
                          variant="dark"
                          size="sm"
                          onClick={() => handlePostBill(b.id)}
                          icon={<FileCheck2 size={12} />}
                          className="text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                          Post to GL
                        </Button>
                      )}
                      {b.status !== "DRAFT" && b.status !== "PAID" && (
                        <Button
                          variant="dark"
                          size="sm"
                          onClick={() => {
                            setPaymentModalBill(b);
                            setPaymentAmount(String(b.remainingBalance));
                          }}
                          icon={<Banknote size={12} />}
                          className="text-[10px] font-bold bg-cyan-700 text-white hover:bg-cyan-800"
                        >
                          Disburse
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Bill Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Supplier Bill (Accounts Payable)"
        >
          <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-semibold"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const s = suppliers.find((sup) => sup.id === e.target.value);
                    if (s) {
                      setSupplierName(s.name);
                      setSupplierTrn(s.trn || "");
                    }
                  }}
                >
                  <option value="">Select registered supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier Name (Manual)
                </label>
                <input
                  type="text"
                  placeholder="Supplier Name"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-semibold"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier TRN
                </label>
                <input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-mono"
                  value={supplierTrn}
                  onChange={(e) => setSupplierTrn(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bill Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Bill Items</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                >
                  <Plus size={13} /> Add Line
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Description..."
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-mono"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-mono font-bold"
                        value={item.unitCost || ""}
                        onChange={(e) =>
                          updateItem(idx, "unitCost", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span>AED {formSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% Recoverable Input VAT:</span>
                <span>AED {formVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Bill Amount:</span>
                <span className="text-cyan-900">AED {formTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPostBill"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600"
              />
              <label htmlFor="autoPostBill" className="font-semibold text-slate-700">
                Auto-post to General Ledger & update Accounts Payable
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
              >
                Save Supplier Bill
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Disburse Payment Modal */}
      {paymentModalBill && (
        <Modal
          isOpen={!!paymentModalBill}
          onClose={() => setPaymentModalBill(null)}
          title={`Disburse Supplier Payment: ${paymentModalBill.billNumber}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-100 space-y-1">
              <p className="font-bold text-cyan-950">
                Vendor: {paymentModalBill.supplierName}
              </p>
              <p className="text-slate-600">
                Bill Total: AED {Number(paymentModalBill.totalAmount).toFixed(2)} | Outstanding: AED {Number(paymentModalBill.remainingBalance).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Amount (AED)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-mono font-bold"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Disbursement Account / Method
              </label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-semibold"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="BANK_TRANSFER">RAK Bank Transfer</option>
                <option value="CHEQUE">Corporate Cheque</option>
                <option value="CASH">Petty Cash</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cheque / Reference Number
              </label>
              <input
                type="text"
                placeholder="e.g. TR-28492 or CHQ-00481"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-cyan-500 font-mono"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={() => setPaymentModalBill(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
              >
                Disburse & Post to GL
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bill View Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Supplier Bill: ${selectedBill.billNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-cyan-950">{selectedBill.billNumber}</span>
                <span className="text-slate-500">
                  {selectedBill.billDate ? new Date(selectedBill.billDate).toISOString().slice(0, 10) : ""}
                </span>
              </div>
              <p className="font-bold text-slate-900">Supplier: {selectedBill.supplierName}</p>
              <p className="text-slate-500 font-mono">TRN: {selectedBill.supplierTrn || "N/A"}</p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">Description</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Qty</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Unit Cost</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Total</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedBill.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3">{item.description}</TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">{item.quantity}</TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">{Number(item.unitCost).toFixed(2)}</TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono font-bold">{Number(item.totalAmount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (AED):</span>
                <span>{Number(selectedBill.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% Input VAT (AED):</span>
                <span>{Number(selectedBill.vatAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Bill Amount:</span>
                <span className="text-cyan-900">AED {Number(selectedBill.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
              >
                Print Bill
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
