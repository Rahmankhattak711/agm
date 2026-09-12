"use client";

import { useCallback, useMemo, useState, Fragment } from "react";
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
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import {
  ChevronDownIcon,
  CloseIcon,
  CreditCardIcon,
  FileCheck2Icon,
  FileTextIcon,
  PlusIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  useSalesInvoices,
  useCreateSalesInvoice,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  useCustomers,
  useProducts,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import {
  QuotationHeader,
  QuotationFooter,
  QuotationTerms,
  DEFAULT_TERMS_AND_CONDITIONS,
  QuotationPaymentTerms,
} from "@/components/quotation";

function parseDescriptionPoints(desc: string): string[] {
  if (!desc) return [];
  const normalized = String(desc).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized
    .split(/(?:\n+|(?<=\S)\s+(?=\d+[\.\)]\s+)|(?<=\S)\s+(?=[•\-*]\s+))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [desc];
}

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
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(
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
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
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
        notes: notes || undefined,
        terms: terms || undefined,
        autoPost,
      });
      setIsCreateOpen(false);
      setCustomerName("");
      setCustomerId("");
      setCustomerTrn("");
      setProjectScope("");
      setNotes("");
      setTerms("");
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

  const handlePrintTaxInvoice = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 50);
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
      {/* Dashboard View (Hidden when printing single selected invoice) */}
      <div className={`space-y-6 ${selectedInvoice ? "print:hidden" : ""}`}>
        {/* Simple Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commercial Sales Invoices &amp; Tax Billing
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              AGM FITOUT TECHNICAL SERVICES LLC — Issue tax-compliant sales
              invoices, calculate 5% Output VAT, <br className="hidden sm:inline" /> update Accounts
              Receivable, and post transactions directly to General Ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer flex-1 sm:flex-initial"
              icon={<PrintIcon size={14} />}
            >
              Print Register
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 print:p-0 print:border-none print:shadow-none min-w-0 max-w-full">
          {/* Search & Filter Strip */}
          <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Status Quick Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {[
                  { id: "ALL", label: "All Invoices" },
                  { id: "POSTED", label: "Posted to GL" },
                  { id: "PARTIALLY_PAID", label: "Partially Paid" },
                  { id: "PAID", label: "Fully Paid" },
                  { id: "DRAFT", label: "Drafts" },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">
                {filteredInvoices.length} Invoices Listed
              </span>
            </div>

            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <Input
                leftIcon={<SearchIcon size={14} className="text-slate-400" />}
                placeholder="Search invoice number, client, TRN, project..."
                containerClassName="w-full sm:w-80 md:w-96"
                className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
              Error loading sales invoices: {(error as any).message}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full">
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
                  <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
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
                    filteredInvoices.map((inv) => {
                      const isExpanded = expandedInvoiceId === inv.id;
                      return (
                        <Fragment key={inv.id}>
                          <TableRow
                            onClick={() =>
                              setExpandedInvoiceId(isExpanded ? null : inv.id)
                            }
                            className={`hover:bg-emerald-50/30 cursor-pointer transition-colors ${
                              isExpanded
                                ? "bg-emerald-50/40 font-semibold"
                                : "text-slate-700"
                            }`}
                          >
                            <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <ChevronDownIcon
                                  size={15}
                                  className={`shrink-0 transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-180 text-emerald-800"
                                      : "text-slate-400"
                                  }`}
                                />
                                <ReceiptIcon
                                  size={13}
                                  className="text-teal-700 shrink-0"
                                />
                                <span className="hover:text-emerald-800 transition-colors">
                                  {inv.invoiceNumber}
                                </span>
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
                            <TableCell className="py-3 px-3 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintTaxInvoice(inv);
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                                  title="Print Tax Invoice"
                                >
                                  <PrintIcon size={13} />
                                </Button>
                                {inv.status === "DRAFT" && (
                                  <Button
                                    variant="dark"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePostInvoice(inv.id);
                                    }}
                                    icon={<FileCheck2Icon size={12} />}
                                    className="text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                                  >
                                    Post to GL
                                  </Button>
                                )}
                                {inv.status !== "DRAFT" && inv.status !== "PAID" && (
                                  <Button
                                    variant="dark"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPaymentModalInv(inv);
                                      setPaymentAmount(
                                        String(inv.remainingBalance),
                                      );
                                    }}
                                    icon={<CreditCardIcon size={12} />}
                                    className="text-[10px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer"
                                  >
                                    Receive
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedInvoiceId(
                                      isExpanded ? null : inv.id,
                                    );
                                  }}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    isExpanded
                                      ? "text-emerald-800 bg-emerald-100"
                                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                  }`}
                                  title={
                                    isExpanded
                                      ? "Collapse Details"
                                      : "View Invoice Details"
                                  }
                                >
                                  <ChevronDownIcon
                                    size={14}
                                    className={`transition-transform duration-200 ${
                                      isExpanded
                                        ? "rotate-180 text-emerald-800"
                                        : ""
                                    }`}
                                  />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Accordion QA-Style Expandable Details */}
                          {isExpanded && (
                            <TableRow className="hover:bg-transparent bg-slate-50/70">
                              <TableCell
                                colSpan={8}
                                className="p-0 border-b-2 border-emerald-600/40"
                              >
                                <div className="px-5 py-4 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white to-slate-50/40 shadow-inner">
                                  {/* Detail Header Ribbon */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                    <div className="flex items-center gap-2.5">
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs shadow-2xs">
                                        {inv.invoiceNumber}
                                      </span>
                                      <span className="text-xs font-bold text-slate-800">
                                        {inv.customerName}
                                      </span>
                                      {inv.customerTrn && (
                                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                          TRN: {inv.customerTrn}
                                        </span>
                                      )}
                                      {inv.projectScope && (
                                        <span className="text-xs text-slate-600 hidden sm:inline">
                                          Project:{" "}
                                          <strong className="text-slate-800">
                                            {inv.projectScope}
                                          </strong>
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrintTaxInvoice(inv);
                                        }}
                                        icon={<PrintIcon size={13} />}
                                        className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                      >
                                        Print Full Tax Invoice
                                      </Button>
                                      {inv.status === "DRAFT" && (
                                        <Button
                                          variant="dark"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePostInvoice(inv.id);
                                          }}
                                          icon={<FileCheck2Icon size={12} />}
                                          className="text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer shadow-2xs"
                                        >
                                          Post to GL
                                        </Button>
                                      )}
                                      {inv.status !== "DRAFT" &&
                                        inv.status !== "PAID" && (
                                          <Button
                                            variant="dark"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPaymentModalInv(inv);
                                              setPaymentAmount(
                                                String(inv.remainingBalance),
                                              );
                                            }}
                                            icon={<CreditCardIcon size={12} />}
                                            className="text-xs font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer shadow-2xs"
                                          >
                                            Receive Payment
                                          </Button>
                                        )}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setExpandedInvoiceId(null)
                                        }
                                        className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                                        title="Close Details"
                                      >
                                        <CloseIcon size={15} />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Scope of Work Breakdown Table */}
                                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                    <div className="bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <FileTextIcon size={13} />
                                        <span>
                                          Description of Work / Services (Scope
                                          Breakdown)
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-normal opacity-90 font-mono">
                                        {inv.items?.length || 0} Scope Item(s)
                                      </span>
                                    </div>

                                    <table className="w-full text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                                          <th className="py-2 px-3 text-center w-12 border-r border-slate-200">
                                            S.No
                                          </th>
                                          <th className="py-2 px-3 text-left border-r border-slate-200">
                                            Description of Work / Services
                                          </th>
                                          <th className="py-2 px-3 text-center w-24 border-r border-slate-200">
                                            Qty / SQM
                                          </th>
                                          <th className="py-2 px-3 text-right w-32 border-r border-slate-200">
                                            Rate (AED)
                                          </th>
                                          <th className="py-2 px-3 text-right w-36">
                                            Total (AED)
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {inv.items && inv.items.length > 0 ? (
                                          inv.items.map(
                                            (item: any, idx: number) => {
                                              const points =
                                                parseDescriptionPoints(
                                                  item.description,
                                                );
                                              return (
                                                <tr
                                                  key={item.id || idx}
                                                  className="hover:bg-slate-50/50"
                                                >
                                                  <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200/80 align-top">
                                                    {idx + 1}
                                                  </td>
                                                  <td className="py-2.5 px-3 border-r border-slate-200/80 text-left align-top font-medium">
                                                    {points.length <= 1 ? (
                                                      <div className="leading-relaxed text-slate-800 whitespace-pre-line">
                                                        {item.description}
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-1.5 text-slate-800">
                                                        {points.map(
                                                          (pt, pIdx) => {
                                                            const match =
                                                              pt.match(
                                                                /^(\d+[\.\)]|[•\-*])\s*(.*)$/,
                                                              );
                                                            if (match) {
                                                              const [
                                                                ,
                                                                bullet,
                                                                text,
                                                              ] = match;
                                                              return (
                                                                <div
                                                                  key={pIdx}
                                                                  className="leading-relaxed flex items-start gap-1.5"
                                                                >
                                                                  <span className="font-bold text-slate-900 shrink-0 select-none">
                                                                    {bullet}
                                                                  </span>
                                                                  <span className="text-slate-800">
                                                                    {text}
                                                                  </span>
                                                                </div>
                                                              );
                                                            }
                                                            return (
                                                                <div
                                                                  key={pIdx}
                                                                  className="leading-relaxed"
                                                                >
                                                                  {pt}
                                                                </div>
                                                            );
                                                          },
                                                        )}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200/80 align-top">
                                                    {item.quantity}
                                                  </td>
                                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200/80 align-top">
                                                    {formatNumber(
                                                      item.unitPrice,
                                                    )}
                                                  </td>
                                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top">
                                                    {formatNumber(
                                                      item.totalAmount,
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            },
                                          )
                                        ) : (
                                          <tr>
                                            <td
                                              colSpan={5}
                                              className="py-6 text-center text-slate-400 italic"
                                            >
                                              No line items found for this
                                              invoice.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Financial & Audit Summary Footer */}
                                  <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
                                    <div className="text-xs text-slate-600 max-w-md space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500 font-semibold">
                                          Invoice Date:
                                        </span>
                                        <span className="font-medium text-slate-800">
                                          {inv.invoiceDate
                                            ? new Date(
                                                inv.invoiceDate,
                                              ).toLocaleDateString("en-GB")
                                            : "—"}
                                        </span>
                                        <span className="text-slate-300">
                                          |
                                        </span>
                                        <span className="text-slate-500 font-semibold">
                                          Due Date:
                                        </span>
                                        <span className="font-medium text-slate-800">
                                          {inv.dueDate
                                            ? new Date(
                                                inv.dueDate,
                                              ).toLocaleDateString("en-GB")
                                            : "—"}
                                        </span>
                                      </div>
                                      {inv.quotationRef && (
                                        <div>
                                          <span className="text-slate-500 font-semibold">
                                            Quotation Ref:
                                          </span>{" "}
                                          <span className="font-mono text-slate-800 font-bold">
                                            {inv.quotationRef}
                                          </span>
                                        </div>
                                      )}
                                      {inv.notes && (
                                        <div className="text-slate-700">
                                          <strong className="text-slate-800">
                                            Notes:
                                          </strong>{" "}
                                          {inv.notes}
                                        </div>
                                      )}
                                      {inv.terms && (
                                        <div className="text-slate-700">
                                          <strong className="text-slate-800">
                                            Terms:
                                          </strong>{" "}
                                          {inv.terms}
                                        </div>
                                      )}
                                    </div>

                                    <div className="w-72 bg-white rounded-xl border border-slate-200 p-3 space-y-1.5 font-mono text-xs shadow-2xs">
                                      <div className="flex justify-between text-slate-600">
                                        <span>Subtotal (Excl. VAT):</span>
                                        <span className="font-semibold">
                                          {formatNumber(inv.subtotal)} AED
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-slate-600">
                                        <span>5% UAE Output VAT:</span>
                                        <span className="font-semibold">
                                          {formatNumber(inv.vatAmount)} AED
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-slate-900 font-black border-t border-slate-100 pt-1 text-[13px]">
                                        <span>Total Due:</span>
                                        <span className="text-emerald-900">
                                          {formatNumber(inv.totalAmount)} AED
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-emerald-700 font-semibold">
                                        <span>Paid / Settled:</span>
                                        <span>
                                          {formatNumber(inv.paidAmount)} AED
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-rose-700 font-bold border-t border-slate-100 pt-1">
                                        <span>Balance Due:</span>
                                        <span>
                                          {formatNumber(inv.remainingBalance)}{" "}
                                          AED
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Fixed Print Footer for Statement Printing */}
        <div className="print-footer-bottom fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
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
                <Select
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold cursor-pointer shadow-2xs"
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
                </Select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer / Entity Name (Override)
                </label>
                <Input
                  type="text"
                  placeholder="Customer Name"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer TRN (UAE VAT)
                </label>
                <Input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={customerTrn}
                  onChange={(e) => setCustomerTrn(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Invoice Number (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Auto-generated if blank (e.g. INV-1001)"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Project Scope / Milestones
              </label>
              <Input
                type="text"
                placeholder="e.g. Commercial Fitout - Phase 1 Completion"
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Invoice Line Items
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  icon={<PlusIcon size={13} />}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Add Line
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                  >
                    <div className="col-span-6">
                      <Textarea
                        rows={2}
                        placeholder="Description / scope points (press Enter for new points)..."
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 resize-y min-h-[36px]"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <TrashIcon size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Terms &amp; Conditions (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Standard 20 AGM Fitout clauses apply if left blank, or enter custom terms..."
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs resize-none text-xs"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes &amp; Special Remarks (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Additional notes for the client..."
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs resize-none text-xs"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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
              <Input
                type="checkbox"
                id="autoPost"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                containerClassName="w-auto shrink-0"
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold shadow-2xs"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Receipt Account / Method *
              </label>
              <Select
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs cursor-pointer"
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
              </Select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reference / Cheque Number
              </label>
              <Input
                type="text"
                placeholder="e.g. TR-9283749 or CHQ-00128"
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
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

      {/* Official Tax Invoice Print Document (Hidden on screen, rendered directly in print) */}
      {selectedInvoice && (
        <div
          id="printable-voucher"
          className="hidden print:block mx-auto bg-white max-w-4xl overflow-visible"
        >
          <table className="print-page-table w-full border-collapse">
            <thead className="print-page-header-group">
              <tr>
                <th className="p-0 font-normal text-left border-none">
                  <QuotationHeader />
                </th>
              </tr>
            </thead>

            <tfoot className="print-page-footer-group">
              <tr>
                <td className="p-0 border-none align-bottom">
                  {/* Invisible spacer so body rows don't overlap the fixed bottom footer */}
                  <div className="w-full opacity-0 pointer-events-none" aria-hidden="true">
                    <QuotationFooter />
                  </div>
                </td>
              </tr>
            </tfoot>

            <tbody className="print-page-body-group">
              {/* 1. Title Bar */}
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="px-10 py-3.5 print:px-8 print:py-1 w-full border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-8">
                      <div>
                        <h1 className="text-2xl print:text-lg font-black text-slate-900 tracking-tight">
                          TAX INVOICE
                        </h1>
                        <p className="text-[11px] print:text-[9.5px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                          Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
                        </p>
                      </div>

                      <div className="w-[340px] space-y-1 text-[12px] print:text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold whitespace-nowrap">
                            Invoice No:
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {selectedInvoice.invoiceNumber}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold whitespace-nowrap">
                            Invoice Date:
                          </span>
                          <span className="font-bold text-slate-900">
                            {selectedInvoice.invoiceDate
                              ? new Date(
                                  selectedInvoice.invoiceDate,
                                ).toLocaleDateString("en-GB")
                              : "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold whitespace-nowrap">
                            Payment Due:
                          </span>
                          <span className="font-bold text-slate-900">
                            {selectedInvoice.dueDate
                              ? new Date(
                                  selectedInvoice.dueDate,
                                ).toLocaleDateString("en-GB")
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 2. Client & Project Details Cards */}
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="grid grid-cols-2 gap-4 print:gap-2 px-10 py-3.5 print:px-8 print:py-1 text-[12px] print:text-[9.5px] print-avoid-break">
                    {/* Left Card: Client / Bill To */}
                    <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl shadow-2xs">
                      <div className="font-bold mb-2 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                        CLIENT / BILL TO
                      </div>
                      <div className="space-y-1 print:space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Client Name:
                          </span>
                          <span className="font-bold text-slate-900">
                            {selectedInvoice.customerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Customer TRN:
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedInvoice.customerTrn || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Address:
                          </span>
                          <span className="text-slate-700">
                            Dubai, United Arab Emirates
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Card: Project / Site Details */}
                    <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl shadow-2xs">
                      <div className="font-bold mb-2 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                        PROJECT / SITE DETAILS
                      </div>
                      <div className="space-y-1 print:space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Project:
                          </span>
                          <span className="font-bold text-slate-900">
                            {selectedInvoice.projectScope || "Commercial Fitout Contract"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Location:
                          </span>
                          <span className="text-slate-700">
                            Dubai, United Arab Emirates
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                            Reference:
                          </span>
                          <span className="font-mono text-slate-800">
                            {selectedInvoice.quotationRef || selectedInvoice.invoiceNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 3. Items Table */}
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="px-10 mt-2 print:px-8 print:mt-1">
                    <table className="w-full text-[12px] print:text-[11px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs">
                      <thead>
                        <tr className="text-center text-white bg-agm-green print-avoid-break">
                          <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                            S.No
                          </th>
                          <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold border border-agm-box-border text-white text-left align-middle">
                            DESCRIPTION OF WORK / SERVICES
                          </th>
                          <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                            QTY / SQM
                          </th>
                          <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                            RATE (AED)
                          </th>
                          <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                            TOTAL (AED)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-agm-box-border">
                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((it: any, idx: number) => (
                            <tr
                              key={it.id || idx}
                              className="hover:bg-slate-50/50 bg-white print-avoid-break"
                            >
                              <td className="py-2.5 px-2 print:py-1 print:px-1 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 print:py-1.5 print:px-2 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                                {(() => {
                                  const points = parseDescriptionPoints(it.description);
                                  if (points.length <= 1) {
                                    return (
                                      <div className="leading-snug print:leading-snug text-slate-800 whitespace-pre-line text-left">
                                        {it.description}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="space-y-1.5 print:space-y-1 text-slate-800 text-left">
                                      {points.map((pt, pIdx) => {
                                        const match = pt.match(/^(\d+[\.\)]|[•\-*])\s*(.*)$/);
                                        if (match) {
                                          const [, bullet, text] = match;
                                          return (
                                            <div
                                              key={pIdx}
                                              className="leading-snug print:leading-snug flex items-start gap-1.5"
                                            >
                                              <span className="font-bold text-slate-900 shrink-0 select-none">
                                                {bullet}
                                              </span>
                                              <span className="text-slate-800">{text}</span>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div
                                            key={pIdx}
                                            className="leading-snug print:leading-snug"
                                          >
                                            {pt}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-2.5 px-2 print:py-1 print:px-1 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                                {it.quantity}
                              </td>
                              <td className="py-2.5 px-3 print:py-1 print:px-2 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                                {formatNumber(it.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 print:py-1 print:px-2 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                                {formatNumber(it.totalAmount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-white">
                            <td
                              colSpan={5}
                              className="py-6 text-center text-slate-400 italic border border-agm-box-border"
                            >
                              No item details found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>

              {/* 4. Totals & Banking Table */}
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="px-10 print:px-8">
                    <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-1.5 print-avoid-break">
                      {/* Left: Banking Details */}
                      <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl text-[11.5px] print:text-[9.5px] flex flex-col justify-center shadow-2xs">
                        <div className="font-bold mb-1.5 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                          BANKING INFORMATION
                        </div>
                        <div className="space-y-1 print:space-y-0.5 text-slate-700 font-medium">
                          <div>
                            Company:{" "}
                            <strong className="text-slate-900">
                              A G M FITOUT TECHNICAL SERVICES LLC
                            </strong>
                          </div>
                          <div>
                            Bank:{" "}
                            <strong className="text-slate-900">
                              The National Bank of Ras Al Khaimah (RAKBANK)
                            </strong>
                          </div>
                          <div>
                            Account (AED):{" "}
                            <strong className="text-slate-900 font-mono">
                              0423141113001
                            </strong>
                          </div>
                          <div>
                            IBAN (AED):{" "}
                            <strong className="text-slate-900 font-mono">
                              AE88 0400 0004 2314 1113 001
                            </strong>
                          </div>
                          <div>
                            SWIFT Code:{" "}
                            <strong className="text-slate-900 font-mono">
                              NBARAEAD
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Right: Subtotal, VAT, Gross & Balances */}
                      <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[10px]">
                        <div className="divide-y divide-slate-100 print:divide-slate-200">
                          <div className="flex items-center justify-between px-4 py-2.5 print:py-1 bg-slate-50/40">
                            <span className="font-semibold text-slate-600">
                              Subtotal (Excl. VAT)
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-[12.5px] print:text-[10.5px]">
                              AED {formatNumber(selectedInvoice.subtotal)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between px-4 py-2 print:py-1">
                            <span className="font-semibold text-slate-600">
                              Output VAT (5%)
                            </span>
                            <span className="font-mono font-semibold text-emerald-800">
                              AED {formatNumber(selectedInvoice.vatAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between px-4 py-2.5 print:py-1.5 bg-agm-green text-white">
                            <span className="font-black tracking-wide text-white text-[12px] print:text-[10.5px] uppercase">
                              TOTAL AMOUNT
                            </span>
                            <span className="font-mono font-black text-white text-[14px] print:text-[11.5px]">
                              AED {formatNumber(selectedInvoice.totalAmount)}
                            </span>
                          </div>

                          {Number(selectedInvoice.paidAmount || 0) > 0 && (
                            <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 text-slate-700 font-semibold">
                              <span>Paid / Settled</span>
                              <span className="font-mono text-emerald-700">
                                AED {formatNumber(selectedInvoice.paidAmount)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 text-slate-900 font-bold">
                            <span>Balance Due</span>
                            <span
                              className={`font-mono ${
                                Number(selectedInvoice.remainingBalance) > 0
                                  ? "text-rose-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              AED {formatNumber(selectedInvoice.remainingBalance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 5. Notes & Special Remarks (if available) */}
              {selectedInvoice.notes && (
                <tr>
                  <td className="p-0 border-none align-top">
                    <div className="px-10 mt-3.5 print:px-8 print:mt-1.5 print-avoid-break">
                      <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl text-[11.5px] print:text-[9.5px]">
                        <div className="font-bold mb-1 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                          NOTES &amp; SPECIAL REMARKS
                        </div>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedInvoice.notes}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* 6. Terms & Conditions */}
              <tr>
                <td className="p-0 border-none align-top">
                  {selectedInvoice.terms &&
                  selectedInvoice.terms.trim().length > 0 &&
                  !selectedInvoice.terms.includes("DEFAULT") ? (
                    <div className="px-10 mt-4 print:px-8 print:mt-2">
                      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-0 rounded-xl print:rounded-none print:border-none print:bg-transparent">
                        <div className="font-bold text-slate-900 uppercase text-[11.5px] print:text-[10px] tracking-wider text-agm-green mb-2 print:mb-1">
                          TERMS AND CONDITIONS
                        </div>
                        <div className="text-[11px] print:text-[9.5px] text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedInvoice.terms}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <QuotationTerms termsList={DEFAULT_TERMS_AND_CONDITIONS} />
                  )}
                </td>
              </tr>

              {/* 7. Payment Terms */}
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationPaymentTerms />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fixed Footer pinned to bottom on every page, including the last page */}
          <div className="print-footer-bottom fixed-print-footer hidden print:block">
            <QuotationFooter />
          </div>
        </div>
      )}
    </div>
  );
}
