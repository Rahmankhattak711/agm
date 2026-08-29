"use client";

import { useCallback, useMemo, useState } from "react";
import { CreditCard, Eye, FileCheck2, Plus, Printer, Receipt, Search, Trash2 } from "lucide-react";
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
  useSalesInvoices,
  useCreateSalesInvoice,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  useCustomers,
  useProducts,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";

export default function SalesInvoicesPage() {
  const { data: invoices = [], isLoading } = useSalesInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  const createInvoiceMutation = useCreateSalesInvoice();
  const postInvoiceMutation = usePostSalesInvoice();
  const paymentMutation = useCreateCustomerPayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null,
  );
  const [paymentModalInv, setPaymentModalInv] = useState<SalesInvoice | null>(
    null,
  );

  // Form State for new invoice
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerTrn, setCustomerTrn] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  );
  const [items, setItems] = useState([
    {
      productId: "",
      description: "Scope item / billing milestone",
      quantity: 1,
      unitPrice: 0,
      unit: "SQM",
    },
  ]);
  const [autoPost, setAutoPost] = useState(true);

  // Payment form state
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
        unitPrice: 0,
        unit: "SQM",
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
        (parseFloat(String(i.unitPrice)) || 0),
    0,
  );
  const formVat = formSubtotal * 0.05;
  const formTotal = formSubtotal + formVat;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoiceMutation.mutateAsync({
        invoiceNumber: invoiceNumber || undefined,
        customerId: customerId || undefined,
        customerName: customerName || "Valued Customer",
        customerTrn: customerTrn || undefined,
        projectScope,
        invoiceDate,
        dueDate,
        items,
        autoPost,
      });
      setIsCreateOpen(false);
      setCustomerName("");
      setCustomerId("");
      setCustomerTrn("");
      setProjectScope("");
      setItems([
        {
          productId: "",
          description: "Scope item / billing milestone",
          quantity: 1,
          unitPrice: 0,
          unit: "SQM",
        },
      ]);
    } catch (err: any) {
      alert(`Error creating invoice: ${err.message}`);
    }
  };

  const handlePostInvoice = async (id: string) => {
    try {
      await postInvoiceMutation.mutateAsync(id);
      alert("Sales invoice posted to General Ledger successfully!");
    } catch (err: any) {
      alert(`Error posting invoice: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInv) return;

    try {
      await paymentMutation.mutateAsync({
        salesInvoiceId: paymentModalInv.id,
        customerId: paymentModalInv.customerId,
        customerName: paymentModalInv.customerName,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        referenceNumber: paymentRef,
      });
      setPaymentModalInv(null);
      setPaymentAmount("");
      setPaymentRef("");
      alert("Payment recorded and posted to General Ledger!");
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerTrn && inv.customerTrn.toLowerCase().includes(q)) ||
        (inv.projectScope && inv.projectScope.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalBilled = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    [filteredInvoices],
  );
  const totalOutstanding = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.remainingBalance || 0), 0),
    [filteredInvoices],
  );
  const totalVatOutput = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
    [filteredInvoices],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Commercial Sales Invoices & Tax Billing
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Sales Cycle — Step 3
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Issue tax-compliant sales invoices, calculate 5% Output VAT, <br /> update Accounts Receivable, and post transactions directly to General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
          >
            Create Sales Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Total Invoiced (Incl. VAT)
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            AED {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Outstanding Accounts Receivable
          </p>
          <p className="text-xl font-black text-rose-950 font-mono">
            AED {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Output VAT (5%)
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            AED {totalVatOutput.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            placeholder="Search invoice number, client, TRN, project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
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
              Invoice No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Project Scope
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date
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
              Balance (AED)
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
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No sales invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-blue-950">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    <div>{inv.customerName}</div>
                    {inv.customerTrn && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        TRN: {inv.customerTrn}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs truncate text-slate-700">
                    {inv.projectScope || "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-3 text-right font-mono font-black text-slate-900"
                  >
                    AED {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      Number(inv.remainingBalance) > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    AED {Number(inv.remainingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : inv.status === "POSTED"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "PARTIALLY_PAID"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-50"
                        title="View / Print Invoice"
                      >
                        <Eye size={13} />
                      </button>
                      {inv.status === "DRAFT" && (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => handlePostInvoice(inv.id)}
                          icon={<FileCheck2 size={12} />}
                        >
                          Post to GL
                        </Button>
                      )}
                      {inv.status !== "DRAFT" && inv.status !== "PAID" && (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => {
                            setPaymentModalInv(inv);
                            setPaymentAmount(String(inv.remainingBalance));
                          }}
                          icon={<CreditCard size={12} />}
                        >
                          Pay
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

      {/* Create Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Commercial Sales Invoice"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Customer
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) {
                      setCustomerName(c.name);
                      setCustomerTrn(c.trn || "");
                    }
                  }}
                >
                  <option value="">Select registered customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer / Entity Name
                </label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer TRN
                </label>
                <input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono"
                  value={customerTrn}
                  onChange={(e) => setCustomerTrn(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Project Scope / Milestones
              </label>
              <input
                type="text"
                placeholder="e.g. Commercial Fitout - Phase 1 Completion"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Invoice Items</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
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
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
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
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono"
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
                        placeholder="Unit Price"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono font-bold"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", e.target.value)
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
                <span>5% Output VAT:</span>
                <span>AED {formVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Invoice Due:</span>
                <span className="text-blue-800">AED {formTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPost"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="autoPost" className="font-semibold text-slate-700">
                Auto-post to General Ledger & update Accounts Receivable
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
                Save & Issue Sales Invoice
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paymentModalInv && (
        <Modal
          isOpen={!!paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          title={`Record Customer Payment: ${paymentModalInv.invoiceNumber}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
              <p className="font-bold text-blue-950">
                Customer: {paymentModalInv.customerName}
              </p>
              <p className="text-slate-600">
                Total Invoice: AED {Number(paymentModalInv.totalAmount).toFixed(2)} | Outstanding: AED {Number(paymentModalInv.remainingBalance).toFixed(2)}
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono font-bold"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="BANK_TRANSFER">Bank Transfer (RAK Bank)</option>
                <option value="CHEQUE">Corporate Cheque</option>
                <option value="CASH">Petty Cash / Cash Receipt</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reference / Cheque Number
              </label>
              <input
                type="text"
                placeholder="e.g. TR-9283749 or CHQ-00128"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={() => setPaymentModalInv(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
              >
                Post Payment to Ledger
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Detail & Print Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Sales Invoice: ${selectedInvoice.invoiceNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedInvoice.customerName}
                </p>
                <p className="text-slate-500">
                  TRN: {selectedInvoice.customerTrn || "N/A"}
                </p>
                <p className="text-slate-700 mt-1">
                  Scope: {selectedInvoice.projectScope || "General Fitout"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-blue-900">
                  {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-slate-500">
                  Date: {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toISOString().slice(0, 10) : ""}
                </p>
                <p className="text-slate-500">
                  Due: {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toISOString().slice(0, 10) : ""}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">Description</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Qty</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Rate</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Total</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items?.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="py-2 px-3 font-medium">
                        {l.description}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {l.quantity}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {Number(l.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono font-bold">
                        {Number(l.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (AED):</span>
                <span>{Number(selectedInvoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% Output VAT (AED):</span>
                <span>{Number(selectedInvoice.vatAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Amount:</span>
                <span className="text-blue-800">
                  AED {Number(selectedInvoice.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
              >
                Print Tax Invoice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
