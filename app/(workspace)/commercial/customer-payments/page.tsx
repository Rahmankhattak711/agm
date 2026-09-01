"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Plus, Printer, Receipt, Search } from "lucide-react";
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
} from "@/components/ui";
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
  const { data: payments = [], isLoading } = useCustomerPayments();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const createPayment = useCreateCustomerPayment();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<CustomerPayment | null>(null);
  const [form, setForm] = useState<PaymentFormState>(EMPTY_FORM);

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

  const setField = useCallback(
    <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleOpenCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setIsCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleCustomerChange = useCallback(
    (id: string) => {
      setField("customerId", id);
      const c = customers.find((c) => c.id === id);
      if (c) setField("customerName", c.name);
    },
    [customers, setField],
  );

  const handleInvoiceChange = useCallback(
    (id: string) => {
      setField("salesInvoiceId", id);
      const inv = invoices.find((i) => i.id === id);
      if (inv) {
        setField("amount", String(inv.remainingBalance));
        setField("customerName", inv.customerName);
        if (inv.customerId) setField("customerId", inv.customerId);
      }
    },
    [invoices, setField],
  );

  const handleCreatePayment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createPayment.mutateAsync({
          customerId: form.customerId || undefined,
          customerName: form.customerName || "Customer",
          salesInvoiceId: form.salesInvoiceId || undefined,
          paymentDate: form.paymentDate,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber,
          notes: form.notes,
        });
        handleCloseCreate();
      } catch (err: any) {
        alert(`Error recording customer payment: ${err.message}`);
      }
    },
    [createPayment, form, handleCloseCreate],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase">
              Customer Payment Receipt Voucher
            </h1>
            <p className="text-xs text-slate-500">
              AGM FITOUT TECHNICAL SERVICES LLC — Accounts Receivable Settlement
              &amp; Bank Collection
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Printed: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer Payments &amp; Receipts
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Double-Entry Synced
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Record customer receipts, update
            Accounts Receivable (1200), and post to General Ledger.
          </p>
        </div>

        <Button
          variant="dark"
          size="sm"
          onClick={handleOpenCreate}
          icon={<Plus size={14} />}
          className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
        >
          Record Customer Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <KpiCard
          label="Total Collections"
          value={formatAed(totalCollected)}
          colorClass="bg-amber-50/60 border-amber-100"
          valueClass="text-amber-950"
        />
        <KpiCard
          label="Payment Receipts Issued"
          value={`${payments.length} Receipts`}
          colorClass="bg-emerald-50/60 border-emerald-100"
          valueClass="text-emerald-950"
        />
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 opacity-70">
            Impacted GL Accounts
          </p>
          <p className="text-xs font-bold text-blue-900 font-mono">
            Dr. 1020 Bank / Cr. 1200 AR
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <Input
          leftIcon={<Search size={15} />}
          placeholder="Search receipt number, customer name, or transaction reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none bg-slate-50 focus:bg-white"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Receipt No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer &amp; Applied Invoice
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              GL Impact (Debit / Credit)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Processed By
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date &amp; Method
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Amount Paid
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px] print:hidden">
              Audit View
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading
                colSpan={7}
                message="Loading customer payments..."
              />
            ) : filteredPayments.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No customer payment records found"
                message="Try adjusting your search or record a new customer receipt."
              />
            ) : (
              filteredPayments.map((pmt) => (
                <TableRow
                  key={pmt.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-amber-950">
                    <div className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-amber-600 shrink-0" />
                      <span>{pmt.receiptNumber}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Ref: {pmt.referenceNumber || "—"}
                    </p>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <p className="font-bold text-slate-900">
                      {pmt.customerName}
                    </p>
                    <p className="text-[10px] text-blue-700 font-mono">
                      {pmt.salesInvoice?.invoiceNumber
                        ? `Invoice: ${pmt.salesInvoice.invoiceNumber}`
                        : "Direct Payment (On Account)"}
                    </p>
                  </TableCell>

                  <TableCell className="py-3 px-4 font-mono text-[10.5px]">
                    <div className="text-emerald-700 font-semibold">
                      Dr. {getDebitAccount(pmt.paymentMethod)}
                    </div>
                    <div className="text-slate-500">
                      Cr. 1200 - Accounts Receivable
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <UserCell
                      fullName={(pmt as any).createdBy?.fullName}
                      email={(pmt as any).createdBy?.email}
                    />
                  </TableCell>

                  <TableCell className="py-3 px-3">
                    <p className="font-mono text-slate-700">
                      {formatDate(pmt.paymentDate)}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600">
                      {pmt.paymentMethod.replace("_", " ")}
                    </span>
                  </TableCell>

                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm"
                  >
                    {formatAed(pmt.amount)}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-center print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayment(pmt)}
                      className="text-[11px] font-bold"
                    >
                      Audit View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Record Customer Payment Receipt"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Customer"
              value={form.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Balance: {formatAed(Number(c.currentBalance))})
                </option>
              ))}
            </Select>

            <Select
              label="Apply to Sales Invoice (Optional)"
              value={form.salesInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
            >
              <option value="">No Invoice (General Receipt)</option>
              {openInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (Due:{" "}
                  {formatAed(Number(inv.remainingBalance))})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Payment Amount (AED) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              required
            />

            <Select
              label="Payment Method"
              value={form.paymentMethod}
              onChange={(e) =>
                setField("paymentMethod", e.target.value as PaymentMethod)
              }
            >
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ),
              )}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Payment Date"
              type="date"
              value={form.paymentDate}
              onChange={(e) => setField("paymentDate", e.target.value)}
            />

            <Input
              label="Cheque / Transaction Ref #"
              placeholder="e.g. TXN-8932 or Cheque #49201"
              value={form.referenceNumber}
              onChange={(e) => setField("referenceNumber", e.target.value)}
            />
          </div>

          <Textarea
            label="Receipt Notes"
            rows={2}
            placeholder="Payment allocation details..."
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleCloseCreate}
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              size="sm"
              type="submit"
              loading={createPayment.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Record &amp; Post Receipt
            </Button>
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
