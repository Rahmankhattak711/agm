"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  useSalesInvoices,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  useUpdateSalesInvoice,
  useDeleteSalesInvoice,
  useProducts,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import { useConfirm } from "@/context/ConfirmContext";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import { ArrowLeft, Plus, RotateCw, Receipt } from "lucide-react";
import SalesInvoiceTemplate from "@/components/SalesInvoiceTemplate";
import {
  SalesInvoiceKPIs,
  SalesInvoiceFilters,
  SalesInvoiceTable,
  RecordPaymentModal,
  PrintableTaxInvoice,
  EditSalesInvoiceModal,
} from "@/app/(workspace)/commercial/sales-invoices/components";

function SalesInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch,
  } = useSalesInvoices();
  const { data: products = [] } = useProducts();

  const postInvoiceMutation = usePostSalesInvoice();
  const paymentMutation = useCreateCustomerPayment();
  const updateInvoiceMutation = useUpdateSalesInvoice();
  const deleteInvoiceMutation = useDeleteSalesInvoice();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedInvoiceForEditor, setSelectedInvoiceForEditor] =
    useState<SalesInvoice | null>(null);

  const [search, setSearch] = useState(urlSearch);
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

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    if (urlSearch && invoices.length > 0) {
      const match = invoices.find(
        (inv) =>
          inv.invoiceNumber.toLowerCase() === urlSearch.toLowerCase() ||
          inv.id.toLowerCase() === urlSearch.toLowerCase(),
      );
      if (match) {
        router.push(`/commercial/sales-invoices/${match.id}`);
      }
    }
  }, [urlSearch, invoices, router]);

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
    <>
      <div
        className={`w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16 ${
          selectedInvoice ? "print:hidden" : ""
        }`}
      >
      {/* 1. Top Executive Compact Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-3">
          {activeView === "EDITOR" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedInvoiceForEditor(null);
                setActiveView("LIST");
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Invoices List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/commercial/quotations")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Quotations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div
            className="p-2.5 rounded-xl shadow-2xs shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            <Receipt className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                {activeView === "EDITOR"
                  ? selectedInvoiceForEditor
                    ? `Edit Tax Invoice ${selectedInvoiceForEditor.invoiceNumber}`
                    : "Create Tax Invoice"
                  : "Commercial Sales Invoices"}
              </h1>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                }}
              >
                {invoices.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {activeView === "EDITOR"
                ? "Draft, customize, and print official UAE FTA tax-compliant sales invoices with terms & conditions."
                : "Issue tax-compliant sales invoices, calculate 5% output VAT, and track customer receivables."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeView === "EDITOR" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedInvoiceForEditor(null);
                setActiveView("LIST");
              }}
              className="px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Invoices</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => refetch()}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer"
                style={{ border: "1px solid #cbd5e1" }}
                title="Refresh Invoices"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceForEditor(null);
                  setActiveView("EDITOR");
                }}
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
                <span>New Invoice</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <SalesInvoiceTemplate
            initialInvoice={selectedInvoiceForEditor}
            availableProducts={products}
            onSuccess={() => {
              setActiveView("LIST");
              setSelectedInvoiceForEditor(null);
            }}
            onCancel={() => {
              setActiveView("LIST");
              setSelectedInvoiceForEditor(null);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3.5 print:hidden">
          {/* 2. Compact Pastel KPIs */}
          <SalesInvoiceKPIs
            totalBilled={totalBilled}
            totalOutstanding={totalOutstanding}
            totalSettled={totalSettled}
            totalVatOutput={totalVatOutput}
          />

          {/* 3. Sleek Unified Filter Bar */}
          <SalesInvoiceFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            search={search}
            onSearchChange={setSearch}
            totalCount={filteredInvoices.length}
          />

          {/* 4. Clean Table Card */}
          <div
            className="rounded-xl overflow-hidden bg-white"
            style={{ border: "1px solid #cbd5e1" }}
          >
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
              onOpenCreate={() => {
                setSelectedInvoiceForEditor(null);
                setActiveView("EDITOR");
              }}
              isFiltered={search.trim() !== "" || statusFilter !== "ALL"}
              onClearFilters={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
            />
          </div>
        </div>
      )}

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

      </div>

      {selectedInvoice && (
        <div className="hidden print:block">
          <PrintableTaxInvoice invoice={selectedInvoice} isPrintOnly={false} />
        </div>
      )}
    </>
  );
}

export default function SalesInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Sales Invoices...
        </div>
      }
    >
      <SalesInvoicesContent />
    </Suspense>
  );
}
