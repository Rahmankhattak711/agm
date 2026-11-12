"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer, Receipt, Search, ArrowLeft, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  TableLoading,
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
  useCustomerPayments,
  useCreateCustomerPayment,
  useCustomers,
  useSalesInvoices,
  CustomerPayment,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

type PaymentMethod = CustomerPayment["paymentMethod"];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bank Transfer (RAK Bank)",
  CHEQUE: "Corporate Cheque",
  CASH: "Petty Cash / Cash",
  CARD: "Credit / Debit Card",
};

function getDebitAccount(method: PaymentMethod): string {
  return method === "BANK_TRANSFER" || method === "CHEQUE"
    ? "1020 - RAK Bank"
    : "1010 - Petty Cash";
}

function formatAed(amount: number | string): string {
  return `AED ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toISOString().slice(0, 10);
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  colorClass?: string;
  valueClass?: string;
}

function KpiCard({
  label,
  value,
  colorClass = "bg-white border-slate-200/80",
  valueClass = "text-slate-900",
}: KpiCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${colorClass}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className={`text-xl font-black font-mono ${valueClass}`}>{value}</p>
    </div>
  );
}

function UserCell({ fullName, email }: { fullName?: string; email?: string }) {
  const name = fullName || "Admin";
  const mail = email || "admin@agm.ae";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">
        {name[0]}
      </div>
      <div>
        <p className="font-medium text-slate-700 text-[11px] leading-tight">
          {name}
        </p>
        <p className="text-[9.5px] text-slate-400 leading-tight">{mail}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{children}</span>
    </div>
  );
}

interface PaymentFormState {
  customerId: string;
  customerName: string;
  salesInvoiceId: string;
  paymentDate: string;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
}

const EMPTY_FORM: PaymentFormState = {
  customerId: "",
  customerName: "",
  salesInvoiceId: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: "",
  paymentMethod: "BANK_TRANSFER",
  referenceNumber: "",
  notes: "",
};

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const { data: payments = [], isLoading } = useCustomerPayments();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const createPayment = useCreateCustomerPayment();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<CustomerPayment | null>(null);
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: { ...EMPTY_FORM },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createPayment.mutateAsync({
          customerId: value.customerId || undefined,
          customerName: value.customerName || "Customer",
          salesInvoiceId: value.salesInvoiceId || undefined,
          paymentDate: value.paymentDate,
          amount: parseFloat(value.amount),
          paymentMethod: value.paymentMethod,
          referenceNumber: value.referenceNumber,
          notes: value.notes,
        });
        setIsCreateOpen(false);
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to record customer payment");
      }
    },
  });

  const handleOpenCreate = useCallback(() => {
    setFormError("");
    form.reset();
    setIsCreateOpen(true);
  }, [form]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    form.reset();
  }, [form]);

  const handleCustomerChange = useCallback(
    (id: string) => {
      form.setFieldValue("customerId", id);
      const c = customers.find((cust) => cust.id === id);
      if (c) form.setFieldValue("customerName", c.name);
    },
    [customers, form],
  );

  const handleInvoiceChange = useCallback(
    (id: string) => {
      form.setFieldValue("salesInvoiceId", id);
      const inv = invoices.find((i) => i.id === id);
      if (inv) {
        form.setFieldValue("amount", String(inv.remainingBalance));
        form.setFieldValue("customerName", inv.customerName);
        if (inv.customerId) form.setFieldValue("customerId", inv.customerId);
      }
    },
    [invoices, form],
  );

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.receiptNumber?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.referenceNumber?.toLowerCase().includes(q),
    );
  }, [payments, search]);

  const totalCollected = useMemo(
    () => filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
    [filteredPayments],
  );

  const openInvoices = useMemo(
    () => invoices.filter((i) => Number(i.remainingBalance) > 0),
    [invoices],
  );

  // Pagination logic
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const startIndex = filteredPayments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length);

  return (
    <div className="space-y-4 max-w-7xl mx-auto print:p-0 print:m-0">
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase">
              Customer Payment Receipt Voucher
            </h1>
            <p className="text-xs text-slate-500">
              Customer Accounts Receivable Settlement &amp; Bank Collection
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Printed: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {/* ══════════ 1. EXECUTIVE COMPACT HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/commercial/customers");
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Receipt className="w-4 h-4" style={{ color: "#1d4ed8" }} />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Customer Payments (Receipts)
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
              }}
            >
              {payments.length} records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1e40af")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Customer Receipt</span>
          </button>
        </div>
      </div>

      {/* ══════════ 2. COMPACT PASTEL KPIS ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 print:hidden">
        {/* Card 1: Total Collections - Pastel Blue */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TOTAL COLLECTIONS
          </p>
          <p className="text-lg sm:text-xl font-black" style={{ color: "#1d4ed8" }}>
            {formatAed(totalCollected)}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Cumulative customer receipts
          </p>
        </div>

        {/* Card 2: Receipts Issued - Pastel Slate */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            RECEIPTS ISSUED
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900">
            {payments.length} Receipts
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Completed payment schedule
          </p>
        </div>

        {/* Card 3: Impacted GL Accounts - Pastel Green */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            IMPACTED GL ACCOUNTS
          </p>
          <p className="text-base sm:text-lg font-black font-mono" style={{ color: "#15803d" }}>
            Dr 1020 / Cr 1200
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Bank Debit / AR Credit
          </p>
        </div>

        {/* Card 4: Settlement Accounts - Pastel Rose */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            SETTLEMENT ACCOUNTS
          </p>
          <p className="text-base sm:text-lg font-black" style={{ color: "#e11d48" }}>
            RAK Bank / Cash
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Corporate banking facility
          </p>
        </div>
      </div>

      {/* ══════════ 3. SLEEK UNIFIED FILTER BAR ══════════ */}
      <div
        className="p-2 sm:p-2.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="relative flex-1 md:w-96">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search receipt number, customer name, reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            style={{ borderColor: "#cbd5e1" }}
          />
        </div>

        <span
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border shrink-0 shadow-2xs self-end md:self-auto"
          style={{ borderColor: "#cbd5e1" }}
        >
          Total: {filteredPayments.length} receipts
        </span>
      </div>

      {/* ══════════ 4. CLEAN TABLE (NO DARK BANNER) ══════════ */}
      <div
        className="bg-white rounded-xl overflow-hidden shadow-2xs print:hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[10.5px] font-bold text-slate-600 uppercase tracking-wider"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderColor: "#cbd5e1",
                }}
              >
                <th className="py-3 px-3.5 whitespace-nowrap">RECEIPT NO</th>
                <th className="py-3 px-3.5">CUSTOMER &amp; APPLIED INVOICE</th>
                <th className="py-3 px-3.5 whitespace-nowrap">GL IMPACT (DEBIT / CREDIT)</th>
                <th className="py-3 px-3.5 whitespace-nowrap">PROCESSED BY</th>
                <th className="py-3 px-3.5 whitespace-nowrap">DATE &amp; METHOD</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">AMOUNT PAID</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap pr-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customer payments...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No customer payment records found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((pmt) => (
                  <tr
                    key={pmt.id}
                    className="hover:bg-[#f8fafc] text-slate-700 transition-colors"
                  >
                    {/* Receipt No */}
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold inline-block"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {pmt.receiptNumber}
                      </span>
                      {pmt.referenceNumber && (
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Ref: {pmt.referenceNumber}
                        </p>
                      )}
                    </td>

                    {/* Customer & Invoice */}
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">
                        {pmt.customerName}
                      </p>
                      <p className="text-[10px] text-[#1d4ed8] font-mono">
                        {pmt.salesInvoice?.invoiceNumber
                          ? `Invoice: ${pmt.salesInvoice.invoiceNumber}`
                          : "Direct Payment (On Account)"}
                      </p>
                    </td>

                    {/* GL Impact */}
                    <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                      <div className="text-emerald-700 font-semibold">
                        Dr. {getDebitAccount(pmt.paymentMethod)}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Cr. 1200 - Accounts Receivable
                      </div>
                    </td>

                    {/* Processed By */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <UserCell
                        fullName={(pmt as any).createdBy?.fullName}
                        email={(pmt as any).createdBy?.email}
                      />
                    </td>

                    {/* Date & Method */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <p className="font-mono text-slate-700 font-medium">
                        {formatDate(pmt.paymentDate)}
                      </p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600">
                        {pmt.paymentMethod.replace("_", " ")}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                      {formatAed(pmt.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center pr-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(pmt)}
                        className="px-2.5 py-1 rounded-lg border text-slate-600 hover:text-slate-900 hover:bg-[#f8fafc] text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                        style={{ borderColor: "#cbd5e1" }}
                      >
                        Audit View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ══════════ RESPONSIVE PAGINATION FOOTER ══════════ */}
        <div
          className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-white"
          style={{ borderColor: "#cbd5e1" }}
        >
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{startIndex}</span> to{" "}
            <span className="font-semibold text-slate-800">{endIndex}</span> of{" "}
            <span className="font-semibold text-slate-800">{filteredPayments.length}</span> receipts
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;
                const isActive = currentPage === page;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-[#f8fafc] border"
                      }`}
                      style={{
                        backgroundColor: isActive ? "#1d4ed8" : undefined,
                        borderColor: isActive ? "#1d4ed8" : "#cbd5e1",
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Record Customer Payment Receipt"
        maxWidth="lg"
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
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Balance: {formatAed(Number(c.currentBalance))})
                    </option>
                  ))}
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="salesInvoiceId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Apply to Sales Invoice (Optional)"
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                >
                  <option value="">No Invoice (General Receipt)</option>
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} (Due:{" "}
                      {formatAed(Number(inv.remainingBalance))})
                    </option>
                  ))}
                </FormSelect>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) =>
                  !value || parseFloat(value) <= 0
                    ? "Valid payment amount is required"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Payment Amount (AED) *"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              )}
            </form.Field>

            <form.Field name="paymentMethod">
              {(field) => (
                <FormSelect field={field} label="Payment Method">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                    (m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ),
                  )}
                </FormSelect>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="paymentDate">
              {(field) => (
                <FormInput field={field} label="Payment Date" type="date" />
              )}
            </form.Field>

            <form.Field name="referenceNumber">
              {(field) => (
                <FormInput
                  field={field}
                  label="Cheque / Transaction Ref #"
                  placeholder="e.g. TXN-8932 or Cheque #49201"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Receipt Notes"
                rows={2}
                placeholder="Payment allocation details..."
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
              className="text-white font-semibold text-xs shadow-2xs"
              style={{ backgroundColor: "#1d4ed8" }}
            >
              Record &amp; Post Receipt
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={
          selectedPayment
            ? `Payment Receipt — ${selectedPayment.receiptNumber}`
            : ""
        }
        maxWidth="md"
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Received From (Customer)
              </p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {selectedPayment.customerName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Applied Invoice:{" "}
                {selectedPayment.salesInvoice?.invoiceNumber ||
                  "General Account Credit"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <p className="text-[10px] font-bold uppercase text-amber-800">
                  Debit (Received Into)
                </p>
                <p className="font-mono font-bold text-amber-950 mt-0.5">
                  {getDebitAccount(selectedPayment.paymentMethod)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <p className="text-[10px] font-bold uppercase text-emerald-800">
                  Credit (Cleared)
                </p>
                <p className="font-mono font-bold text-emerald-950 mt-0.5">
                  1200 - Accounts Receivable
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <DetailRow label="Processed By:">
                {(selectedPayment as any).createdBy?.fullName ||
                  "Administrator"}{" "}
                ({(selectedPayment as any).createdBy?.email || "admin@agm.ae"})
              </DetailRow>
              <DetailRow label="Payment Date:">
                <span className="font-mono">
                  {formatDate(selectedPayment.paymentDate)}
                </span>
              </DetailRow>
              <DetailRow label="Payment Method:">
                <span className="font-bold">
                  {PAYMENT_METHOD_LABELS[selectedPayment.paymentMethod] ??
                    selectedPayment.paymentMethod}
                </span>
              </DetailRow>
              <DetailRow label="Transaction / Cheque Ref:">
                <span className="font-mono">
                  {selectedPayment.referenceNumber || "—"}
                </span>
              </DetailRow>

              <div className="h-px bg-slate-200 my-1" />

              <div className="flex justify-between text-sm font-bold bg-amber-100/60 p-2 rounded-xl text-amber-950">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-amber-900">
                  {formatAed(selectedPayment.amount)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
              >
                Print Official Receipt
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedPayment(null)}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close View
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
}
