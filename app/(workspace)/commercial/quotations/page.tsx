"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RotateCw, FileSpreadsheet } from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import {
  useConvertQuotationToSalesInvoice,
  useConvertQuotationToSalesOrder,
  useDeleteQuotation,
  useProducts,
  useQuotations,
  useSalesInvoices,
} from "@/lib/hooks/api-hooks";
import { QuotationKPIs, QuotationFilters, QuotationTable } from "./components";
import { formatNumber } from "@/lib/utils/format";

export default function CommercialQuotationsPage() {
  const router = useRouter();
  const { data: products = [] } = useProducts();
  const {
    data: quotationsList = [],
    isLoading,
    error,
    refetch,
  } = useQuotations();
  const { data: salesInvoices = [] } = useSalesInvoices();
  const convertToInvoiceMutation = useConvertQuotationToSalesInvoice();
  const deleteQuotationMutation = useDeleteQuotation();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [expandedQuotationId, setExpandedQuotationId] = useState<string | null>(
    null,
  );

  const dynamicQuotationMeta: Partial<QuotationMeta> = useMemo(() => {
    if (selectedQuotation) {
      return {
        quotationNo: selectedQuotation.quotationNo,
        date: selectedQuotation.date,
        validUntil: selectedQuotation.validUntil,
        customerId: selectedQuotation.customerId || "",
        customer: selectedQuotation.customer,
        attention: selectedQuotation.attention,
        address: selectedQuotation.address,
        trn: selectedQuotation.trn,
        mobile: selectedQuotation.mobile,
        project: selectedQuotation.project,
        location: selectedQuotation.location,
        reference: selectedQuotation.reference,
        preparedBy: selectedQuotation.preparedBy,
        contact: selectedQuotation.contact,
      };
    }

    let nextNum = 1;
    const allRefs: string[] = [
      ...quotationsList.map((q: any) => q.quotationNo),
      ...salesInvoices.map((inv: any) => inv.quotationRef).filter(Boolean),
    ];
    if (allRefs.length > 0) {
      const nums = allRefs.map((ref: string) => {
        const match = ref?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNum = Math.max(...nums, 0) + 1;
    }
    const year = new Date().getFullYear();
    const paddedNum = String(nextNum).padStart(2, "0");

    return {
      quotationNo: `AGM-QTN-${year}-${paddedNum}`,
      date: new Date().toLocaleDateString("en-GB"),
      validUntil: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB"),
      customerId: "",
      customer: "",
      attention: "",
      address: "",
      trn: "",
      email: "",
      mobile: "",
      project: "",
      location: "",
      reference: "",
      preparedBy: "",
      contact: "",
    };
  }, [selectedQuotation, quotationsList, salesInvoices]);

  const dynamicQuotationItems: QuotationItem[] = useMemo(() => {
    if (selectedQuotation?.items?.length) {
      return selectedQuotation.items.map((i: any, idx: number) => ({
        id: idx + 1,
        productId: i.productId,
        desc: i.description,
        qty: Number(i.quantity),
        rate: Number(i.unitRate),
        unit: i.unit,
        isFree: i.isFree,
      }));
    }
    return [
      {
        id: 1,
        desc: "",
        qty: 1,
        rate: 0,
      },
    ];
  }, [selectedQuotation]);

  const handleConvertToInvoice = useCallback(
    async (qtn: any) => {
      const confirmed = await confirm({
        title: "Convert to Tax Invoice & Initiate Project",
        message: `Are you sure you want to convert Quotation "${qtn.quotationNo}" to a Tax Invoice? This will generate the official Tax Invoice with applied custom payment terms and automatically initialize the project under Planning status.`,
        variant: "primary",
        confirmText: "Convert to Invoice",
      });
      if (!confirmed) return;

      try {
        setConvertingId(qtn.id);
        const newInvoice: any = await convertToInvoiceMutation.mutateAsync(
          qtn.id,
        );
        toast.success(
          `Quotation converted to Tax Invoice #${newInvoice?.invoiceNumber || ""} & Project created in Planning!`,
        );
        router.push("/commercial/sales-invoices");
      } catch (err: any) {
        toast.error(`Error converting quotation: ${err.message}`);
      } finally {
        setConvertingId(null);
      }
    },
    [confirm, convertToInvoiceMutation, router],
  );

  const handleDeleteQuotation = useCallback(
    async (qtn: any) => {
      const confirmed = await confirm({
        title: "Delete Quotation",
        message: `Are you sure you want to delete quotation "${qtn.quotationNo}"? This action cannot be undone.`,
        variant: "danger",
        confirmText: "Delete Quotation",
      });
      if (!confirmed) return;

      try {
        await deleteQuotationMutation.mutateAsync(qtn.id);
        toast.success(`Quotation "${qtn.quotationNo}" deleted successfully`);
        if (expandedQuotationId === qtn.id) {
          setExpandedQuotationId(null);
        }
      } catch (err: any) {
        toast.error(`Error deleting quotation: ${err.message}`);
      }
    },
    [confirm, deleteQuotationMutation, expandedQuotationId],
  );

  const filteredQuotations = useMemo(() => {
    const q = search.toLowerCase().trim();
    return quotationsList.filter((item: any) => {
      const matchesSearch =
        !q ||
        item.quotationNo.toLowerCase().includes(q) ||
        (item.customer && item.customer.toLowerCase().includes(q)) ||
        (item.project && item.project.toLowerCase().includes(q)) ||
        (item.reference && item.reference.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotationsList, search, statusFilter]);

  const totalQuotedVolume = useMemo(
    () =>
      quotationsList.reduce(
        (s: number, q: any) => s + Number(q.totalAmount || 0),
        0,
      ),
    [quotationsList],
  );

  const acceptedCount = useMemo(
    () => quotationsList.filter((q: any) => q.status === "ACCEPTED").length,
    [quotationsList],
  );

  const rejectedCount = useMemo(
    () => quotationsList.filter((q: any) => q.status === "REJECTED").length,
    [quotationsList],
  );

  const isFiltered = search.trim().length > 0 || statusFilter !== "ALL";

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
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
                setSelectedQuotation(null);
                setActiveView("LIST");
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Quotations List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/commercial/sales-invoices")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Sales Invoices"
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
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                {activeView === "EDITOR"
                  ? selectedQuotation
                    ? `Edit Quotation ${selectedQuotation.quotationNo}`
                    : "New Quotation Proposal"
                  : "Commercial Quotations"}
              </h1>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                }}
              >
                {quotationsList.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {activeView === "EDITOR"
                ? "Draft, itemize bill of quantities, apply payment terms, and generate official proposal."
                : "Official commercial proposals, itemized BOQs, and one-click conversion to Tax Invoices."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeView === "EDITOR" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedQuotation(null);
                setActiveView("LIST");
              }}
              className="px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Proposals</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => refetch()}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer"
                style={{ border: "1px solid #cbd5e1" }}
                title="Refresh Quotations"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuotation(null);
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
                <span>New Quotation</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            initialVatPct={
              selectedQuotation?.vatPct !== undefined &&
              selectedQuotation?.vatPct !== null
                ? Number(selectedQuotation.vatPct)
                : 0
            }
            initialDiscount={
              selectedQuotation?.discount !== undefined &&
              selectedQuotation?.discount !== null
                ? Number(selectedQuotation.discount)
                : 0
            }
            availableProducts={products}
          />
        </div>
      ) : (
        <div className="space-y-3.5 print:hidden">
          {/* 2. Compact Pastel KPIs */}
          <QuotationKPIs
            totalQuotedVolume={totalQuotedVolume}
            totalCount={quotationsList.length}
            acceptedCount={acceptedCount}
            rejectedCount={rejectedCount}
            formatNumber={formatNumber}
          />

          {/* 3. Sleek Unified Filter Bar */}
          <QuotationFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            search={search}
            onSearchChange={setSearch}
            totalCount={filteredQuotations.length}
          />

          {/* 4. Clean Table Card */}
          <div
            className="rounded-xl overflow-hidden bg-white"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <QuotationTable
              quotations={filteredQuotations}
              isLoading={isLoading}
              error={error}
              isFiltered={isFiltered}
              convertingId={convertingId}
              expandedQuotationId={expandedQuotationId}
              onToggleExpand={(id) =>
                setExpandedQuotationId((prev) => (prev === id ? null : id))
              }
              onClearFilters={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              onOpenEditor={(q) => {
                setSelectedQuotation(q || null);
                setActiveView("EDITOR");
              }}
              onConvertToInvoice={handleConvertToInvoice}
              onDeleteQuotation={handleDeleteQuotation}
              formatNumber={formatNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
}
