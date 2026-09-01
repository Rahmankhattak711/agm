"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CreditCard,
  Eye,
  FileCheck2,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Layers,
  ArrowUpRight,
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
  useSalesInvoices,
  useCreateSalesInvoice,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  useCustomers,
  useProducts,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";

export default function SalesInvoicesPage() {
  const { data: invoices = [], isLoading, error } = useSalesInvoices();
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

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerTrn, setCustomerTrn] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
      const matchesStatus =
        statusFilter === "ALL" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalBilled = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    [filteredInvoices],
  );
  const totalOutstanding = useMemo(
    () =>
      filteredInvoices.reduce((s, i) => s + Number(i.remainingBalance || 0), 0),
    [filteredInvoices],
  );
  const totalSettled = totalBilled - totalOutstanding;
  const totalVatOutput = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
    [filteredInvoices],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Commercial Sales Invoices &amp; Tax Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Issue tax-compliant sales
            invoices, calculate 5% Output VAT, <br /> update Accounts
            Receivable, and post transactions directly to General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<Printer size={14} />}
          >
            Print Register
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Create Sales Invoice
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Invoiced */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Invoiced (Incl. VAT)
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Gross sales billings
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {formatNumber(totalBilled)}
            </span>
          </div>
        </div>

        {/* 2. Outstanding Receivables */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Outstanding Accounts Receivable
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Open client balances
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-rose-500 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatNumber(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* 3. Settled Collections */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Settled Receipts
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Collected payments
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-emerald-600 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-emerald-800 font-mono">
              {formatNumber(totalSettled)}
            </span>
          </div>
        </div>

        {/* 4. Output VAT 5% */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Output VAT (5%)
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                Box 1
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              FTA Form 201 Tax Due
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-purple-600 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-purple-800 font-mono">
              {formatNumber(totalVatOutput)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Invoices" },
                { id: "POSTED", label: "Posted to GL" },
                { id: "PARTIALLY_PAID", label: "Partially Paid" },
                { id: "PAID", label: "Fully Paid" },
                { id: "DRAFT", label: "Drafts" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredInvoices.length} Invoices Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <div className="w-full sm:w-96 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, client, TRN, project..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading sales invoices: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Commercial Sales Invoices Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredInvoices.length} Invoices
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Invoice No
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Customer / Client
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Project Scope
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Date
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                >
                  Total (AED)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                >
                  Balance Due
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Status
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Actions
                </TableHeaderCell>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No sales invoices found. Click &quot;Create Sales
                      Invoice&quot; to issue a new commercial invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-slate-50/60 text-slate-700 transition"
                    >
                      <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Receipt
                            size={13}
                            className="text-teal-700 shrink-0"
                          />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-bold text-slate-900">
                        <div>{inv.customerName}</div>
                        {inv.customerTrn && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            TRN: {inv.customerTrn}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 max-w-xs truncate text-slate-700">
                        {inv.projectScope || "—"}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-slate-600 font-mono text-xs">
                        {inv.invoiceDate
                          ? new Date(inv.invoiceDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-3 text-right font-mono font-black text-slate-900"
                      >
                        {formatNumber(inv.totalAmount)}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          Incl. 5% VAT: {formatNumber(inv.vatAmount)}
                        </span>
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          Number(inv.remainingBalance) > 0
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatNumber(inv.remainingBalance)}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : inv.status === "POSTED"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : inv.status === "PARTIALLY_PAID"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {inv.status === "PAID"
                            ? "Paid"
                            : inv.status === "POSTED"
                              ? "Posted"
                              : inv.status === "PARTIALLY_PAID"
                                ? "Partial"
                                : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                            title="View / Print Tax Invoice"
                          >
                            <Eye size={13} />
                          </button>
                          {inv.status === "DRAFT" && (
                            <Button
                              variant="dark"
                              size="sm"
                              onClick={() => handlePostInvoice(inv.id)}
                              icon={<FileCheck2 size={12} />}
                              className="text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              Post to GL
                            </Button>
                          )}
                          {inv.status !== "DRAFT" && inv.status !== "PAID" && (
                            <Button
                              variant="dark"
                              size="sm"
                              onClick={() => {
                                setPaymentModalInv(inv);
                                setPaymentAmount(String(inv.remainingBalance));
                              }}
                              icon={<CreditCard size={12} />}
                              className="text-[10px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer"
                            >
                              Receive
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
        )}
      </div>

      {/* Modal for Creating Sales Invoice */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Commercial Sales Invoice"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Customer *
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold cursor-pointer shadow-2xs"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find(
                      (cust) => cust.id === e.target.value,
                    );
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
                  Customer / Entity Name (Override)
                </label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer TRN (UAE VAT)
                </label>
                <input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={customerTrn}
                  onChange={(e) => setCustomerTrn(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank (e.g. INV-1001)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
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
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Invoice Line Items
                </span>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Line
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Description..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
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
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
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
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold"
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
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
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
                <span className="text-emerald-900">
                  AED {formTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPost"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="autoPost"
                className="font-semibold text-slate-700 cursor-pointer"
              >
                Auto-post to General Ledger &amp; update Accounts Receivable
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Save &amp; Issue Sales Invoice
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Customer Payment Receipt Modal */}
      {paymentModalInv && (
        <Modal
          isOpen={!!paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          title={`Record Customer Payment: ${paymentModalInv.invoiceNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-950">
                Customer: {paymentModalInv.customerName}
              </p>
              <p className="text-slate-600">
                Total Invoice: AED{" "}
                {Number(paymentModalInv.totalAmount).toFixed(2)} | Outstanding:{" "}
                <strong className="text-rose-700">
                  AED {Number(paymentModalInv.remainingBalance).toFixed(2)}
                </strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Amount (AED) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold shadow-2xs"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Receipt Account / Method *
              </label>
              <select
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs cursor-pointer"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="BANK_TRANSFER">
                  Bank Transfer (RAK Bank A/C 1020)
                </option>
                <option value="CHEQUE">Corporate Cheque</option>
                <option value="CASH">
                  Petty Cash / Cash Receipt (A/C 1010)
                </option>
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
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setPaymentModalInv(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Post Payment to Ledger
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Tax Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Sales Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedInvoice.customerName}
                </p>
                <p className="text-slate-500 font-mono">
                  TRN: {selectedInvoice.customerTrn || "N/A"}
                </p>
                <p className="text-slate-700 mt-1">
                  Scope: {selectedInvoice.projectScope || "General Fitout"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-slate-500 font-mono">
                  Date:{" "}
                  {selectedInvoice.invoiceDate
                    ? new Date(selectedInvoice.invoiceDate).toLocaleDateString(
                        "en-GB",
                      )
                    : ""}
                </p>
                <p className="text-slate-500 font-mono">
                  Due:{" "}
                  {selectedInvoice.dueDate
                    ? new Date(selectedInvoice.dueDate).toLocaleDateString(
                        "en-GB",
                      )
                    : ""}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50 border-b border-slate-200">
                  <TableHeaderCell className="py-2 px-3 font-bold text-slate-600">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Rate (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Total (AED)
                  </TableHeaderCell>
                </TableHead>
                <TableBody className="divide-y divide-slate-100">
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
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono font-bold text-slate-900"
                      >
                        {Number(l.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono space-y-1 text-right">
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
                <span className="text-emerald-900">
                  AED {Number(selectedInvoice.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
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
