"use client";

import React, { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import {
  useSalesInvoices,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  useUpdateSalesInvoice,
  useDeleteSalesInvoice,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import { useConfirm } from "@/context/ConfirmContext";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import { PageHeader } from "@/components/ui";
import {
  SalesInvoiceKPIs,
  SalesInvoiceFilters,
  SalesInvoiceTable,
  RecordPaymentModal,
  PrintableTaxInvoice,
  EditSalesInvoiceModal,
} from "@/app/(workspace)/commercial/sales-invoices/components";

export default function SalesInvoicesPage() {
  const { data: invoices = [], isLoading, error } = useSalesInvoices();

  const postInvoiceMutation = usePostSalesInvoice();
  const paymentMutation = useCreateCustomerPayment();
  const updateInvoiceMutation = useUpdateSalesInvoice();
  const deleteInvoiceMutation = useDeleteSalesInvoice();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null,
  );
  const [paymentModalInv, setPaymentModalInv] = useState<SalesInvoice | null>(
    null,
  );
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(
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
      const printTitle = formatPdfDocumentTitle(
        [
          inv.invoiceNumber,
          inv.customerName,
          inv.projectScope || (inv as any).project,
        ],
        "Tax-Invoice",
      );
      printWithDocumentTitle(printTitle);
    }, 50);
  };

  const handleEditInvoice = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
  };

  const handleSaveInvoiceEdit = async (id: string, updatedData: any) => {
    try {
      await updateInvoiceMutation.mutateAsync({ id, data: updatedData });
      toast.success("Sales invoice updated successfully!");
    } catch (err: any) {
      toast.error(`Error updating invoice: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteInvoice = async (inv: SalesInvoice) => {
    const confirmed = await confirm({
      title: "Delete Sales Invoice",
      message: `Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.customerName}? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Invoice",
    });
    if (!confirmed) return;

    try {
      await deleteInvoiceMutation.mutateAsync(inv.id);
      toast.success(`Invoice ${inv.invoiceNumber} deleted successfully.`);
      if (expandedInvoiceId === inv.id) {
        setExpandedInvoiceId(null);
      }
    } catch (err: any) {
      toast.error(`Error deleting invoice: ${err.message}`);
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

  const totalSettled = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0),
    [filteredInvoices],
  );

  const totalOutstanding = useMemo(
    () =>
      filteredInvoices.reduce((s, i) => {
        const bal = Math.max(
          0,
          Number(i.totalAmount || 0) - Number(i.paidAmount || 0),
        );
        return s + bal;
      }, 0),
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
        <PageHeader
          title="Sales Invoices"
          description="Issue tax-compliant sales invoices, calculate 5% output VAT, and track customer receivables."
        />

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
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            isFiltered={search.trim() !== "" || statusFilter !== "ALL"}
            onClearFilters={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          />
        </div>
      </div>

      <RecordPaymentModal
        invoice={paymentModalInv}
        onClose={() => setPaymentModalInv(null)}
        onSubmitPayment={async (paymentData) => {
          await paymentMutation.mutateAsync(paymentData);
        }}
      />

      <EditSalesInvoiceModal
        isOpen={Boolean(editingInvoice)}
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSaveInvoice={handleSaveInvoiceEdit}
      />

      <PrintableTaxInvoice invoice={selectedInvoice} />
    </div>
  );
}
