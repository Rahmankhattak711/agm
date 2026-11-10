"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ChevronLeft, ChevronRight, Eye, Plus, Printer, Search } from "lucide-react";
import {
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";
import { useForm } from "@tanstack/react-form";
import {
  useSupplierPayments,
  useCreateSupplierPayment,
  useSuppliers,
  useSupplierBills,
  SupplierPayment,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

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

const PAGE_SIZE = 15;

export default function SupplierPaymentsPage() {
  const router = useRouter();
  const { data: payments = [], isLoading } = useSupplierPayments();
  const { data: suppliers = [] } = useSuppliers();
  const { data: bills = [] } = useSupplierBills();

  const createPaymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<SupplierPayment | null>(null);

  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: { ...EMPTY_FORM },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createPaymentMutation.mutateAsync({
          supplierId: value.supplierId || undefined,
          supplierName: value.supplierName || "Vendor",
          supplierBillId: value.supplierBillId || undefined,
          paymentDate: value.paymentDate,
          amount: parseFloat(value.amount),
          paymentMethod: value.paymentMethod,
          referenceNumber: value.referenceNumber,
          notes: value.notes,
        });
        setIsCreateOpen(false);
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to record supplier payment");
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

  const totalDisbursed = useMemo(
    () => payments.reduce((acc, p) => acc + Number(p.amount || 0), 0),
    [payments],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.paymentNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
        );
      }),
    [payments, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-bold text-slate-900 uppercase">
              Supplier Payment Disbursal Voucher
            </h1>
            <p className="text-xs text-slate-500">
              Accounts Payable Settlement &amp; Vendor Payment Schedule
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Printed: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {/* 1. Executive Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/inventory/purchase-orders")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Purchase Orders"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <Banknote className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Supplier Payments (Disbursals)
            </h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {payments.length} records
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg text-white hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
          style={{
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            border: "1px solid #1e40af",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Disburse Supplier Payment</span>
        </button>
      </div>

      {/* Procurement Cycle Horizontal Quick Navigation */}
      <div className="print:hidden">
        <ProcurementQuickNav />
      </div>

      {/* 2. Four Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            TOTAL DISBURSED
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-rose-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {totalDisbursed.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Cumulative vendor disbursements
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            DISBURSALS ISSUED
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {payments.length} Vouchers
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Completed payment schedule
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            IMPACTED GL ACCOUNTS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            Dr 2000 / Cr 1020
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            AP Debit / Bank Credit
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            SETTLEMENT ACCOUNTS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-[#1d4ed8] leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            RAK Bank / Cash
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Corporate banking facility
          </span>
        </div>
      </div>

      {/* 3. Soft Filter Bar */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search payment number, supplier, reference..."
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-normal">
          Total: <span className="font-medium text-slate-800">{filteredPayments.length} payments</span>
        </div>
      </div>

      {/* 4. Bordered Table Card with Responsive Pagination */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr
                className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 select-none"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <th className="py-2.5 px-4 font-medium text-slate-600">Payment No</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Supplier &amp; Bill Ref</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">GL Impact (Debit / Credit)</th>
                <th className="py-2.5 px-3 font-medium text-slate-600">Date &amp; Method</th>
                <th className="py-2.5 px-4 font-medium text-slate-600 text-right">Amount Paid</th>
                <th className="py-2.5 px-3 font-medium text-slate-600 text-center print:hidden pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Loading supplier payment records...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No supplier payments found.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((pmt) => {
                  const isBank =
                    pmt.paymentMethod === "BANK_TRANSFER" ||
                    pmt.paymentMethod === "CHEQUE";
                  const creditAccount = isBank
                    ? "1020 - RAK Bank"
                    : "1010 - Petty Cash";

                  return (
                    <tr
                      key={pmt.id}
                      onClick={() => setSelectedPayment(pmt)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                        <span
                          className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          {pmt.paymentNumber}
                        </span>
                        {pmt.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {pmt.referenceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-800">
                          {pmt.supplierName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {pmt.supplierBill?.billNumber
                            ? `Bill: ${pmt.supplierBill.billNumber}`
                            : "Direct Disbursal (On Account)"}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <div className="text-[#1d4ed8] font-medium">
                          Dr. 2000 - Accounts Payable
                        </div>
                        <div className="text-slate-500">Cr. {creditAccount}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-700 text-[11px]">
                          {pmt.paymentDate
                            ? new Date(pmt.paymentDate).toISOString().slice(0, 10)
                            : "—"}
                        </div>
                        <span
                          className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-medium"
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          {pmt.paymentMethod?.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-medium text-rose-700 whitespace-nowrap text-xs">
                        AED{" "}
                        {Number(pmt.amount).toLocaleString("en-AE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-2.5 px-3 text-center print:hidden pr-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(pmt);
                          }}
                          className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
                          title="View Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > 0 && (
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t select-none print:hidden"
            style={{ borderColor: "#cbd5e1" }}
          >
            <div className="text-xs text-slate-500 font-normal">
              Showing{" "}
              <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-slate-800">
                {Math.min(startIndex + PAGE_SIZE, filteredPayments.length)}
              </span>{" "}
              of <span className="font-medium text-slate-800">{filteredPayments.length}</span> payments
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === currentPage;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={
                        isActive
                          ? {
                              backgroundColor: "#1d4ed8",
                              color: "#ffffff",
                              borderColor: "#1d4ed8",
                            }
                          : { borderColor: "#cbd5e1" }
                      }
                      className={`min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? ""
                          : "text-slate-700 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return (
                    <span key={p} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disburse Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Disburse Supplier Payment"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 text-xs font-normal"
          >
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

            {/* Section 1: Vendor & Bill Allocation */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Vendor &amp; Bill Allocation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <form.Field name="supplierId">
                  {(field) => (
                    <FormSelect
                      field={field}
                      label="Supplier / Vendor *"
                      onChange={(e) => {
                        const sid = e.target.value;
                        field.handleChange(sid);
                        const s = suppliers.find((sup) => sup.id === sid);
                        if (s) form.setFieldValue("supplierName", s.name);
                      }}
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.trn ? `TRN: ${s.trn}` : "Vendor"})
                        </option>
                      ))}
                    </FormSelect>
                  )}
                </form.Field>

                <form.Field name="supplierBillId">
                  {(field) => (
                    <FormSelect
                      field={field}
                      label="Apply to Supplier Bill (Optional)"
                      onChange={(e) => {
                        const bid = e.target.value;
                        field.handleChange(bid);
                        const b = bills.find((bill) => bill.id === bid);
                        if (b) {
                          form.setFieldValue(
                            "amount",
                            String(b.remainingBalance),
                          );
                          form.setFieldValue("supplierName", b.supplierName);
                          if (b.supplierId)
                            form.setFieldValue("supplierId", b.supplierId);
                        }
                      }}
                    >
                      <option value="">No Bill (General Advance / Disbursal)</option>
                      {bills
                        .filter((b) => Number(b.remainingBalance) > 0)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.billNumber} - {b.supplierName} (Due: AED{" "}
                            {Number(b.remainingBalance).toFixed(2)})
                          </option>
                        ))}
                    </FormSelect>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Section 2: Disbursement Execution */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Disbursement &amp; Settlement Details
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
                      placeholder="0.00"
                      className="font-mono font-semibold"
                      required
                    />
                  )}
                </form.Field>

                <form.Field name="paymentMethod">
                  {(field) => (
                    <FormSelect field={field} label="Payment Method *">
                      <option value="BANK_TRANSFER">
                        Bank Transfer (RAK Bank Corporate)
                      </option>
                      <option value="CHEQUE">Corporate Bank Cheque</option>
                      <option value="CASH">Petty Cash / Cash Facility</option>
                      <option value="CARD">Corporate Commercial Card</option>
                    </FormSelect>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <form.Field name="paymentDate">
                  {(field) => (
                    <FormInput field={field} label="Payment Date *" type="date" required />
                  )}
                </form.Field>

                <form.Field name="referenceNumber">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Cheque / Transaction Ref #"
                      type="text"
                      placeholder="e.g. CHQ-9921 or TXN-4421"
                      className="font-mono"
                    />
                  )}
                </form.Field>
              </div>

              <form.Field name="notes">
                {(field) => (
                  <FormTextarea
                    field={field}
                    label="Disbursal Notes &amp; Purpose"
                    rows={2}
                    placeholder="Payment description and allocation details..."
                  />
                )}
              </form.Field>

              {/* General Ledger Posting Preview */}
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">GL Posting Preview:</span>
                  <span>Dr. 2000 (Accounts Payable)</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10.5px]">
                  <span>→ Cr. Settlement (Bank / Cash)</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseCreate}
                className="px-3.5 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPaymentMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                {createPaymentMutation.isPending ? "Disbursing..." : "Disburse & Post Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Selected Payment Voucher Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Supplier Disbursal Voucher - ${selectedPayment.paymentNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700 font-normal">
            <div
              className="p-3.5 rounded-xl border space-y-1.5"
              style={{ backgroundColor: "#f4f7fb", borderColor: "#cbd5e1" }}
            >
              <p className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500">
                Paid To (Supplier / Vendor)
              </p>
              <p className="font-semibold text-slate-800 text-sm">
                {selectedPayment.supplierName}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Applied Bill:{" "}
                {selectedPayment.supplierBill?.billNumber ||
                  "General Supplier Credit"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 rounded-xl border"
                style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
              >
                <p className="text-[9.5px] font-medium uppercase tracking-wider text-[#1d4ed8]">
                  Debit (Liability Cleared)
                </p>
                <p className="font-mono font-medium text-slate-800 mt-0.5">
                  2000 - Accounts Payable
                </p>
              </div>
              <div
                className="p-3 rounded-xl border"
                style={{ backgroundColor: "#fff1f2", borderColor: "#fda4af" }}
              >
                <p className="text-[9.5px] font-medium uppercase tracking-wider text-rose-700">
                  Credit (Paid From)
                </p>
                <p className="font-mono font-medium text-slate-800 mt-0.5">
                  {selectedPayment.paymentMethod === "CASH"
                    ? "1010 - Petty Cash"
                    : "1020 - RAK Bank"}
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border space-y-2"
              style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }}
            >
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
                <span className="font-medium text-slate-800">
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
              <div
                className="flex justify-between items-center text-sm font-semibold p-2.5 rounded-xl"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                <span>Total Amount Disbursed:</span>
                <span className="font-mono">
                  AED{" "}
                  {Number(selectedPayment.amount).toLocaleString("en-AE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Print Disbursal Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
              >
                Close View
              </button>
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
