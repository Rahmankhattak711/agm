"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { toast } from "@/lib/toast";
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
  SalesInvoiceKPIs,
  SalesInvoiceFilters,
  SalesInvoiceTable,
  CreateSalesInvoiceModal,
  RecordPaymentModal,
  PrintableTaxInvoice,
} from "@/app/(workspace)/commercial/sales-invoices/components";

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

  const handlePostInvoice = async (invoiceId: string) => {
    try {
      await postInvoiceMutation.mutateAsync(invoiceId);
      toast.success("Sales invoice posted to General Ledger successfully!");
    } catch (err: any) {
      toast.error(`Error posting invoice: ${err.message}`);
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

  const totalSettled = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0),
    [filteredInvoices],
  );

  const totalVatOutput = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
    [filteredInvoices],
  );

  const handleToggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className={`space-y-6 ${selectedInvoice ? "print:hidden" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sales Invoices
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue tax-compliant sales invoices, calculate 5% output VAT, and
              track customer receivables.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial"
            >
              Create Sales Invoice
            </Button>
          </div>
        </div>

        <SalesInvoiceKPIs
          totalBilled={totalBilled}
          totalOutstanding={totalOutstanding}
          totalSettled={totalSettled}
          totalVatOutput={totalVatOutput}
        />

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 print:p-0 print:border-none print:shadow-none min-w-0 max-w-full">
          <SalesInvoiceFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            search={search}
            onSearchChange={setSearch}
            totalCount={filteredInvoices.length}
          />

          <SalesInvoiceTable
            invoices={filteredInvoices}
            isLoading={isLoading}
            error={error}
            expandedInvoiceId={expandedInvoiceId}
            onToggleExpand={handleToggleExpand}
            onPrint={handlePrintTaxInvoice}
            onPost={handlePostInvoice}
            onOpenPayment={(inv) => setPaymentModalInv(inv)}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        </div>
      </div>

      <CreateSalesInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        customers={customers}
        products={products}
        onSubmitInvoice={async (invoiceData) => {
          await createInvoiceMutation.mutateAsync(invoiceData);
        }}
      />

      <RecordPaymentModal
        invoice={paymentModalInv}
        onClose={() => setPaymentModalInv(null)}
        onSubmitPayment={async (paymentData) => {
          await paymentMutation.mutateAsync(paymentData);
        }}
      />

      <PrintableTaxInvoice invoice={selectedInvoice} />
    </div>
  );
}
