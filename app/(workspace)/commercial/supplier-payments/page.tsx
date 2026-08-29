"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Banknote, Plus, Printer, Search } from "lucide-react";
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
  useSupplierPayments,
  useCreateSupplierPayment,
  useSuppliers,
  useSupplierBills,
  SupplierPayment,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

export default function SupplierPaymentsPage() {
  const { data: payments = [], isLoading } = useSupplierPayments();
  const { data: suppliers = [] } = useSuppliers();
  const { data: bills = [] } = useSupplierBills();

  const createPaymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<SupplierPayment | null>(null);

  type PaymentMethod = "BANK_TRANSFER" | "CHEQUE" | "CASH" | "CARD";
  interface FormState {
    supplierId: string;
    supplierName: string;
    supplierBillId: string;
    paymentDate: string;
    amount: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }
  const EMPTY_FORM: FormState = {
    supplierId: "",
    supplierName: "",
    supplierBillId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    referenceNumber: "",
    notes: "",
  };
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const setField = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) =>
      setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleCreatePayment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createPaymentMutation.mutateAsync({
          supplierId: form.supplierId || undefined,
          supplierName: form.supplierName || "Vendor",
          supplierBillId: form.supplierBillId || undefined,
          paymentDate: form.paymentDate,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber,
          notes: form.notes,
        });
        handleCloseCreate();
      } catch (err: any) {
        alert(`Error recording supplier payment: ${err.message}`);
      }
    },
    [createPaymentMutation, form, handleCloseCreate],
  );

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.paymentNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)),
    );
  }, [payments, search]);

  const totalDisbursed = useMemo(
    () => filteredPayments.reduce((s, p) => s + Number(p.amount), 0),
    [filteredPayments],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase">
              Supplier Payment Disbursal Voucher
            </h1>
            <p className="text-xs text-slate-500">
              AGM FITOUT TECHNICAL SERVICES LLC — Accounts Payable Settlement &
              Vendor Payment Schedule
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Supplier Payments & Disbursals
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Procurement Cycle — Step 4
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Disburse payments to suppliers,
            clear open Accounts Payable bills, and track bank reconciliations.
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
            Disburse Supplier Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Total Disbursed
          </p>
          <p className="text-xl font-black text-blue-300 font-mono">
            AED{" "}
            {totalDisbursed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Disbursals Issued
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {payments.length} Payments
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Impacted GL Accounts
          </p>
          <p className="text-xs font-bold text-blue-900 font-mono">
            Dr. 2000 AP / Cr. 1020 Bank
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <Input
          leftIcon={<Search size={15} />}
          placeholder="Search payment number, supplier name, reference number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none bg-slate-50 focus:bg-white"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Payment No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Supplier & Bill Ref
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              GL Impact (Debit / Credit)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date & Method
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
                colSpan={6}
                message="Loading supplier payment records..."
              />
            ) : filteredPayments.length === 0 ? (
              <TableEmpty
                colSpan={6}
                title="No supplier payments found"
                message="Try adjusting your search terms or disburse a new supplier payment."
              />
            ) : (
              filteredPayments.map((pmt) => {
                const isBank =
                  pmt.paymentMethod === "BANK_TRANSFER" ||
                  pmt.paymentMethod === "CHEQUE";
                const creditAccount = isBank
                  ? "1020 - RAK Bank"
                  : "1010 - Petty Cash";

                return (
                  <TableRow
                    key={pmt.id}
                    className="hover:bg-slate-50/60 text-slate-700 transition"
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Banknote
                          size={14}
                          className="text-blue-600 shrink-0"
                        />
                        <span>{pmt.paymentNumber}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Ref: {pmt.referenceNumber || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {pmt.supplierName}
                      </p>
                      <p className="text-[10px] text-blue-700 font-mono">
                        {pmt.supplierBill?.billNumber
                          ? `Bill: ${pmt.supplierBill.billNumber}`
                          : "Direct Disbursal (On Account)"}
                      </p>
                    </TableCell>

                    <TableCell className="py-3 px-4 font-mono text-[10.5px]">
                      <div className="text-blue-700 font-semibold">
                        Dr. 2000 - Accounts Payable
                      </div>
                      <div className="text-slate-500">Cr. {creditAccount}</div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <p className="font-mono text-slate-700">
                        {pmt.paymentDate
                          ? new Date(pmt.paymentDate).toISOString().slice(0, 10)
                          : "—"}
                      </p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600">
                        {pmt.paymentMethod?.replace("_", " ")}
                      </span>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="py-3 px-4 text-right font-mono font-black text-rose-800 text-sm"
                    >
                      AED{" "}
                      {Number(pmt.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(pmt)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="View Voucher"
                      >
                        Audit View
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Disburse Supplier Payment"
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Supplier / Vendor"
                value={form.supplierId}
                onChange={(e) => {
                  setField("supplierId", e.target.value);
                  const s = suppliers.find((sup) => sup.id === e.target.value);
                  if (s) setField("supplierName", s.name);
                }}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.trn ? `TRN: ${s.trn}` : "Vendor"})
                  </option>
                ))}
              </Select>

              <Select
                label="Apply to Supplier Bill (Optional)"
                value={form.supplierBillId}
                onChange={(e) => {
                  setField("supplierBillId", e.target.value);
                  const b = bills.find((bill) => bill.id === e.target.value);
                  if (b) {
                    setField("amount", String(b.remainingBalance));
                    setField("supplierName", b.supplierName);
                    if (b.supplierId) setField("supplierId", b.supplierId);
                  }
                }}
              >
                <option value="">No Bill (General Disbursal)</option>
                {bills
                  .filter((b) => Number(b.remainingBalance) > 0)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} - {b.supplierName} (Due: AED{" "}
                      {Number(b.remainingBalance).toFixed(2)})
                    </option>
                  ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Payment Amount (AED)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                required
              />

              <Select
                label="Payment Method"
                value={form.paymentMethod}
                onChange={(e) =>
                  setField("paymentMethod", e.target.value as any)
                }
              >
                <option value="BANK_TRANSFER">Bank Transfer (RAK Bank)</option>
                <option value="CHEQUE">Corporate Cheque</option>
                <option value="CASH">Petty Cash / Cash</option>
                <option value="CREDIT_CARD">Corporate Card</option>
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
                type="text"
                placeholder="e.g. CHQ-9921 or TXN-4421"
                value={form.referenceNumber}
                onChange={(e) => setField("referenceNumber", e.target.value)}
              />
            </div>

            <Textarea
              label="Disbursal Notes"
              rows={2}
              placeholder="Payment description and allocation details..."
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
                disabled={createPaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {createPaymentMutation.isPending
                  ? "Posting..."
                  : "Disburse & Post"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Supplier Disbursal Voucher - ${selectedPayment.paymentNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Paid To (Supplier / Vendor)
              </p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {selectedPayment.supplierName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Applied Bill:{" "}
                {selectedPayment.supplierBill?.billNumber ||
                  "General Supplier Credit"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                <p className="text-[10px] font-bold uppercase text-blue-800">
                  Debit (Liability Cleared)
                </p>
                <p className="font-mono font-bold text-blue-950 mt-0.5">
                  2000 - Accounts Payable
                </p>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80">
                <p className="text-[10px] font-bold uppercase text-rose-800">
                  Credit (Paid From)
                </p>
                <p className="font-mono font-bold text-rose-950 mt-0.5">
                  {selectedPayment.paymentMethod === "CASH"
                    ? "1010 - Petty Cash"
                    : "1020 - RAK Bank"}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono font-medium text-slate-800">
                  {selectedPayment.paymentDate
                    ? new Date(selectedPayment.paymentDate)
                        .toISOString()
                        .slice(0, 10)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">
                  {selectedPayment.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Transaction / Cheque Ref:
                </span>
                <span className="font-mono text-slate-800">
                  {selectedPayment.referenceNumber || "—"}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-1" />
              <div className="flex justify-between text-sm font-bold bg-blue-100/60 p-2 rounded-xl text-blue-950">
                <span>Total Amount Disbursed:</span>
                <span className="font-mono text-blue-900">
                  AED{" "}
                  {Number(selectedPayment.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs flex items-center gap-1.5"
                icon={<Printer size={13} />}
              >
                Print Disbursal Voucher
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
        </Modal>
      )}

      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
}
