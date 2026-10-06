"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import {
  useConvertQuotationToSalesInvoice,
  useConvertQuotationToSalesOrder,
  useProducts,
  useQuotations,
  useSalesInvoices,
} from "@/lib/hooks/api-hooks";
import {
  QuotationKPIs,
  QuotationFilters,
  QuotationTable,
} from "./components";

export default function CommercialQuotationsPage() {
  const router = useRouter();
  const { data: products = [] } = useProducts();
  const { data: quotationsList = [], isLoading, error } = useQuotations();
  const { data: salesInvoices = [] } = useSalesInvoices();
  const convertToOrderMutation = useConvertQuotationToSalesOrder();
  const convertToInvoiceMutation = useConvertQuotationToSalesInvoice();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
    () => quotationsList.reduce((s: number, q: any) => s + Number(q.totalAmount || 0), 0),
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeView === "EDITOR"
              ? "Quotation Editor"
              : "Commercial Quotations"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeView === "EDITOR"
              ? "Draft, edit, and print official commercial proposals with custom payment milestones."
              : "Create commercial proposals, generate itemized BOQs, and convert accepted quotes into sales invoices."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView === "EDITOR" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedQuotation(null);
                setActiveView("LIST");
              }}
              icon={<ChevronLeftIcon size={14} />}
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-xs cursor-pointer"
            >
              Back to Proposals
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedQuotation(null);
                setActiveView("EDITOR");
              }}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              New Quotation
            </Button>
          )}
        </div>
      </div>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            availableProducts={products}
          />
        </div>
      ) : (
        <div className="space-y-6 print:hidden">
          <QuotationKPIs
            totalQuotedVolume={totalQuotedVolume}
            totalCount={quotationsList.length}
            acceptedCount={acceptedCount}
            rejectedCount={rejectedCount}
            formatNumber={formatNumber}
          />

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <QuotationFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              search={search}
              onSearchChange={setSearch}
              totalCount={filteredQuotations.length}
            />

            <QuotationTable
              quotations={filteredQuotations}
              isLoading={isLoading}
              error={error}
              isFiltered={isFiltered}
              convertingId={convertingId}
              onClearFilters={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              onOpenEditor={(q) => {
                setSelectedQuotation(q || null);
                setActiveView("EDITOR");
              }}
              onConvertToInvoice={handleConvertToInvoice}
              formatNumber={formatNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
}
