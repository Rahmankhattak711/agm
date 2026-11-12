"use client";

import {
  QuotationRecord,
  useDeleteQuotation,
  useQuotations,
  useSaveQuotation,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import {
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Plus,
  Printer,
  Save,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_TERMS_AND_CONDITIONS,
  ItemKey,
  MetaKey,
  QuotationDetailsCards,
  QuotationDocTitleBar,
  QuotationFooter,
  QuotationHeader,
  QuotationItem,
  QuotationItemsTable,
  QuotationMeta,
  QuotationPaymentTerms,
  QuotationSavedModal,
  QuotationTemplateProps,
  QuotationTerms,
  QuotationTotalsTable,
  SAMPLE_SCOPE_ITEMS,
  SalesInvoiceTerms,
} from "./quotation";

export {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_TERMS_AND_CONDITIONS,
  SAMPLE_SCOPE_ITEMS,
};
export type { QuotationItem, QuotationMeta, QuotationTemplateProps };

export default function QuotationTemplate({
  initialMeta,
  initialItems,
  initialVatPct,
  initialDiscount,
  availableProducts = [],
  hideOuterWrapper = false,
}: QuotationTemplateProps) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");
  const [docType, setDocType] = useState<"QUOTATION" | "TAX_INVOICE">(
    "QUOTATION",
  );
  const [status, setStatus] = useState<"ACCEPTED" | "REJECTED" | "DRAFT">(
    "ACCEPTED",
  );
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const { confirm } = useConfirm();

  const { data: savedQuotations = [], isLoading: isLoadingSaved } =
    useQuotations();
  const saveQuotationMutation = useSaveQuotation();
  const deleteQuotationMutation = useDeleteQuotation();

  useEffect(() => {
    if (!isStatusOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(e.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusOpen]);

  const [meta, setMeta] = useState<QuotationMeta>({
    quotationNo:
      initialMeta?.quotationNo || `AGM-QTN-${new Date().getFullYear()}-01`,
    date: initialMeta?.date || new Date().toLocaleDateString("en-GB"),
    validUntil:
      initialMeta?.validUntil ||
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-GB",
      ),
    customerId: initialMeta?.customerId || "",
    customer: initialMeta?.customer || "",
    address: initialMeta?.address || "",
    email: initialMeta?.email || "",
    mobile: initialMeta?.mobile || "",
    project: initialMeta?.project || "Commercial Fitout Contract",
    location: initialMeta?.location || "Dubai, UAE",
    reference: initialMeta?.reference || "",
    preparedBy: initialMeta?.preparedBy || "assem@agmfitout.com",
    contact: initialMeta?.contact || "+971 48 749839 / +971 50 3407300",
  });

  const [items, setItems] = useState<QuotationItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : SAMPLE_SCOPE_ITEMS,
  );

  const [paymentTerms, setPaymentTerms] = useState<string[]>(
    DEFAULT_PAYMENT_TERMS,
  );
  const [quotationTerms, setQuotationTerms] = useState<
    { id: number | string; title: string; text: string }[]
  >(DEFAULT_TERMS_AND_CONDITIONS);
  const [vatPct, setVatPct] = useState<number | string>(
    initialVatPct !== undefined ? Number(initialVatPct) : 0,
  );
  const [discount, setDiscount] = useState<number | string>(
    initialDiscount !== undefined ? Number(initialDiscount) : 0,
  );

  useEffect(() => {
    if (initialMeta?.quotationNo && !selectedQuotationId) {
      setMeta((prev) => ({
        ...prev,
        ...initialMeta,
      }));
    }
  }, [initialMeta, selectedQuotationId]);

  useEffect(() => {
    if (initialVatPct !== undefined && !selectedQuotationId) {
      setVatPct(Number(initialVatPct));
    }
  }, [initialVatPct, selectedQuotationId]);

  useEffect(() => {
    if (initialDiscount !== undefined && !selectedQuotationId) {
      setDiscount(Number(initialDiscount));
    }
  }, [initialDiscount, selectedQuotationId]);

  const updateMeta = (k: MetaKey, v: string) =>
    setMeta((m) => ({ ...m, [k]: v }));

  const updateItem = (id: number | string, k: ItemKey, v: any) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, [k]: v } : it)));

  const updatePaymentTerm = (idx: number, val: string) => {
    setPaymentTerms((prev) => prev.map((term, i) => (i === idx ? val : term)));
  };

  const addPaymentTerm = () => {
    setPaymentTerms((prev) => [...prev, "Payment milestone term"]);
  };

  const removePaymentTerm = (idx: number) => {
    setPaymentTerms((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuotationTerm = (
    idx: number,
    field: "title" | "text",
    val: string,
  ) => {
    setQuotationTerms((prev) =>
      prev.map((term, i) => (i === idx ? { ...term, [field]: val } : term)),
    );
  };

  const addQuotationTerm = () => {
    setQuotationTerms((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "Additional Condition:",
        text: "Specify any custom requirements, approvals, site clearance, or warranty conditions.",
      },
    ]);
  };

  const removeQuotationTerm = (idx: number) => {
    setQuotationTerms((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (id: number | string, productId: string) => {
    const selected = availableProducts.find((p) => p.id === productId);
    if (selected) {
      setItems((its) =>
        its.map((it) =>
          it.id === id
            ? {
                ...it,
                productId,
                desc: `${selected.name} (${selected.sku})${selected.description ? ` - ${selected.description}` : ""}`,
                rate: Number(selected.sellingPrice || selected.costPrice || 0),
              }
            : it,
        ),
      );
    }
  };

  const addItem = (sectionName = "") =>
    setItems((its) => [
      ...its,
      {
        id: Date.now() + Math.random(),
        section:
          sectionName ||
          (its.length > 0 ? its[its.length - 1].section || "" : ""),
        desc: "",
        qty: 1,
        rate: 0,
      },
    ]);

  const removeItem = (id: number | string) =>
    setItems((its) =>
      its.length > 1 ? its.filter((it) => it.id !== id) : its,
    );

  const calculateRowTotal = (it: QuotationItem): number => {
    if (
      it.isFree ||
      String(it.qty).toLowerCase() === "free" ||
      String(it.rate).toLowerCase() === "free"
    ) {
      return 0;
    }
    const q = Number(it.qty || 0);
    const r = Number(it.rate || 0);
    return isNaN(q * r) ? 0 : q * r;
  };

  const subtotal = items.reduce((s, it) => s + calculateRowTotal(it), 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const afterDiscount = Math.max(0, subtotal - discountNum);
  const vatRate = Math.max(0, Number(vatPct) || 0);
  const vatAmt = Math.round(afterDiscount * (vatRate / 100) * 100) / 100;
  const total = Math.round((afterDiscount + vatAmt) * 100) / 100;

  const handleSaveToDb = async () => {
    if (!meta.customerId && (!meta.customer || !meta.customer.trim())) {
      toast.warning(
        "Cannot generate quotation: Please select or create a registered customer profile first.",
      );
      return;
    }

    try {
      const payload = {
        quotationNo: meta.quotationNo,
        date: meta.date,
        validUntil: meta.validUntil,
        customerId: meta.customerId || null,
        customer: meta.customer,
        address: meta.address,
        mobile: meta.mobile,
        project: meta.project,
        location: meta.location,
        reference: meta.reference,
        preparedBy: meta.preparedBy,
        contact: meta.contact,
        vatPct: Number(vatPct || 0),
        discount: Number(discount || 0),
        status,
        terms: JSON.stringify(quotationTerms),
        paymentTerms: JSON.stringify(paymentTerms),
        items: items.map((it, idx) => {
          const isFree = Boolean(
            it.isFree ||
            String(it.qty).toLowerCase() === "free" ||
            String(it.rate).toLowerCase() === "free",
          );
          return {
            productId: it.productId || null,
            section: it.section || "",
            itemOrder: idx + 1,
            description: it.desc || "Scope item",
            quantity: isFree ? 0 : Number(it.qty || 1),
            unitRate: isFree ? 0 : Number(it.rate || 0),
            isFree,
          };
        }),
      };

      const result = await saveQuotationMutation.mutateAsync(payload as any);
      if (result?.id) {
        setSelectedQuotationId(result.id);
        toast.success(`Saved successfully as ${result.quotationNo}!`);
      }
    } catch (err: any) {
      toast.error(
        "Error saving quotation: " + (err.message || "Unknown error"),
      );
    }
  };

  const handleLoadQuotation = (q: QuotationRecord) => {
    setSelectedQuotationId(q.id);
    setStatus(q.status as any);
    setVatPct(
      q.vatPct !== undefined && q.vatPct !== null ? Number(q.vatPct) : 0,
    );
    setDiscount(Number(q.discount || 0));
    setMeta({
      quotationNo: q.quotationNo,
      date: q.date || "",
      validUntil: q.validUntil || "",
      customerId: q.customerId || "",
      customer: q.customer || "",
      address: q.address || "",
      mobile: q.mobile || "",
      project: q.project || "",
      location: q.location || "",
      reference: q.reference || "",
      preparedBy: q.preparedBy || "",
      contact: q.contact || "",
    });

    if (q.terms) {
      try {
        const parsed = JSON.parse(q.terms);
        if (Array.isArray(parsed)) {
          setQuotationTerms(
            parsed.map((item, idx) =>
              typeof item === "string"
                ? { id: idx + 1, title: "", text: item }
                : {
                    id: item.id || idx + 1,
                    title: item.title || "",
                    text: item.text || "",
                  },
            ),
          );
        }
      } catch {
        setQuotationTerms([{ id: 1, title: "Condition:", text: q.terms }]);
      }
    } else {
      setQuotationTerms(DEFAULT_TERMS_AND_CONDITIONS);
    }

    if (q.paymentTerms) {
      try {
        const parsed = JSON.parse(q.paymentTerms);
        if (Array.isArray(parsed)) {
          setPaymentTerms(
            parsed.map((p) => (typeof p === "string" ? p : String(p))),
          );
        }
      } catch {
        setPaymentTerms([q.paymentTerms]);
      }
    } else {
      setPaymentTerms(DEFAULT_PAYMENT_TERMS);
    }

    if (q.items && q.items.length > 0) {
      setItems(
        q.items.map((item, idx) => ({
          id: item.id || idx + 1,
          section: item.section || "",
          productId: item.productId || undefined,
          desc: item.description,
          qty: item.isFree ? "Free" : Number(item.quantity || 1),
          rate: item.isFree ? "Free" : Number(item.unitRate || 0),
          isFree: item.isFree,
        })),
      );
    }
    setIsSavedDrawerOpen(false);
    toast.info(`Loaded quotation ${q.quotationNo}`);
  };

  const handleNewQuotation = () => {
    setSelectedQuotationId("");
    setDocType("QUOTATION");

    let nextNum = 1;
    if (savedQuotations && savedQuotations.length > 0) {
      const nums = savedQuotations.map((q: any) => {
        const match = q.quotationNo?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNum = Math.max(...nums, 0) + 1;
    }
    const year = new Date().getFullYear();
    const paddedNum = String(nextNum).padStart(2, "0");

    setMeta({
      quotationNo: `AGM-QTN-${year}-${paddedNum}`,
      date: new Date().toLocaleDateString("en-GB"),
      validUntil: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB"),
      customerId: "",
      customer: "",
      address: "",
      mobile: "",
      project: "",
      location: "",
      reference: "",
      preparedBy: "",
      contact: "",
    });
    setItems([
      {
        id: 1,
        section: "",
        desc: "",
        qty: 1,
        rate: 0,
      },
    ]);
    setPaymentTerms(DEFAULT_PAYMENT_TERMS);
    setQuotationTerms(DEFAULT_TERMS_AND_CONDITIONS);
    setDiscount(0);
    setVatPct(0);
    setStatus("DRAFT");
  };

  const handleDeleteQuotation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "Delete Quotation",
      message: "Are you sure you want to delete this saved quotation?",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!isConfirmed) return;
    try {
      await deleteQuotationMutation.mutateAsync(id);
      toast.success("Quotation deleted successfully");
      if (selectedQuotationId === id) {
        handleNewQuotation();
      }
    } catch (err: any) {
      toast.error("Error deleting: " + err.message);
    }
  };

  return (
    <div
      className={
        hideOuterWrapper
          ? "w-full"
          : "min-h-screen print:bg-white print:py-0 print:px-0"
      }
    >
      <div className="max-w-full mx-auto mb-4 bg-white p-2 sm:p-2.5 rounded-xl border border-[#cbd5e1] shadow-2xs flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handleNewQuotation}
          className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-[#cbd5e1] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>New Blank</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSavedDrawerOpen(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Saved DB ({savedQuotations.length})</span>
        </button>

        {/* Modern Custom Status Selector Dropdown */}
        <div ref={statusRef} className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setIsStatusOpen((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              status === "ACCEPTED"
                ? "bg-[#f0fdf4] hover:bg-emerald-100 text-[#15803d] border-[#bbf7d0]"
                : status === "REJECTED"
                  ? "bg-[#fff1f2] hover:bg-rose-100 text-[#be123c] border-[#fecdd3]"
                  : "bg-[#fefce8] hover:bg-amber-100 text-[#a16207] border-[#fef08a]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status === "ACCEPTED"
                  ? "bg-emerald-500"
                  : status === "REJECTED"
                    ? "bg-rose-500"
                    : "bg-amber-500"
              }`}
            />
            <span className="font-semibold">
              Status: <span className="capitalize">{status.toLowerCase()}</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 opacity-60 ${
                isStatusOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isStatusOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-white border border-[#cbd5e1] shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              {[
                {
                  val: "ACCEPTED",
                  label: "Accepted",
                  dot: "bg-emerald-500",
                  badge: "bg-[#f0fdf4] text-[#15803d]",
                },
                {
                  val: "DRAFT",
                  label: "Draft",
                  dot: "bg-amber-500",
                  badge: "bg-[#fefce8] text-[#a16207]",
                },
                {
                  val: "REJECTED",
                  label: "Rejected",
                  dot: "bg-rose-500",
                  badge: "bg-[#fff1f2] text-[#be123c]",
                },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setStatus(opt.val as any);
                    setIsStatusOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                    status === opt.val
                      ? `${opt.badge} font-bold`
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </div>
                  {status === opt.val && (
                    <span className="text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveToDb}
          disabled={saveQuotationMutation.isPending}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
            !meta.customerId && !meta.customer.trim()
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-[#1d4ed8] hover:bg-[#1e40af] text-white"
          }`}
          title={
            !meta.customerId && !meta.customer.trim()
              ? "Select or create a customer before saving"
              : "Save quotation to database"
          }
        >
          <Save className="w-3.5 h-3.5" />
          <span>
            {saveQuotationMutation.isPending
              ? "Saving..."
              : selectedQuotationId
                ? "Update in DB"
                : "Save to DB"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!meta.customerId && !meta.customer.trim()) {
              toast.warning(
                "Customer Required: Please select or create a customer profile before printing or generating this official quotation.",
              );
              return;
            }
            const printTitle = formatPdfDocumentTitle([
              meta.quotationNo,
              meta.customer,
              meta.project,
            ]);
            printWithDocumentTitle(printTitle);
          }}
          className="border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-700 rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print / PDF</span>
        </button>

        {!meta.customerId && !meta.customer.trim() && (
          <span className="px-2.5 py-1 bg-[#fefce8] border border-[#fef08a] text-[#a16207] rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Customer Profile Required</span>
          </span>
        )}

        {selectedQuotationId && (
          <span className="px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
            <span>Loaded: {meta.quotationNo}</span>
          </span>
        )}
      </div>

      <QuotationSavedModal
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedQuotations={savedQuotations}
        isLoadingSaved={isLoadingSaved}
        onLoadQuotation={handleLoadQuotation}
        onDeleteQuotation={handleDeleteQuotation}
      />

      <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar print:overflow-visible">
        <div
          className="mx-auto bg-white shadow-lg print:shadow-none max-w-full min-w-full rounded-xl print:rounded-none overflow-visible print:overflow-visible"
          id="printable-voucher"
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
                  <div
                    className="w-full opacity-0 pointer-events-none select-none"
                    style={{ minHeight: "175px" }}
                    aria-hidden="true"
                  >
                    <QuotationFooter />
                    <div style={{ height: "45px", minHeight: "45px" }} />
                  </div>
                </td>
              </tr>
            </tfoot>

            <tbody className="print-page-body-group">
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationDocTitleBar
                    docType={docType}
                    meta={meta}
                    onUpdateMeta={updateMeta}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationDetailsCards
                    meta={meta}
                    onUpdateMeta={updateMeta}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationItemsTable
                    items={items}
                    availableProducts={availableProducts}
                    onProductSelect={handleProductSelect}
                    onUpdateItem={updateItem}
                    onAddItem={addItem}
                    onRemoveItem={removeItem}
                    calculateRowTotal={calculateRowTotal}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationTotalsTable
                    subtotal={subtotal}
                    vatPct={vatPct}
                    vatAmt={vatAmt}
                    discount={discount}
                    total={total}
                    onUpdateVatPct={(val) => setVatPct(val)}
                    onUpdateDiscount={(val) => setDiscount(val)}
                  />
                </td>
              </tr>
              {docType === "TAX_INVOICE" ? (
                <tr>
                  <td className="p-0 border-none align-top pb-6 print:pb-0">
                    <SalesInvoiceTerms
                      className="px-10 mt-4 print:px-0 print:mt-2"
                      terms={quotationTerms.map((t) =>
                        t.title ? `${t.title} ${t.text}` : t.text,
                      )}
                      onUpdateTerm={(idx, val) =>
                        updateQuotationTerm(idx, "text", val)
                      }
                      onAddTerm={addQuotationTerm}
                      onRemoveTerm={removeQuotationTerm}
                      paymentPlans={paymentTerms}
                      onUpdatePaymentPlan={updatePaymentTerm}
                      onAddPaymentPlan={addPaymentTerm}
                      onRemovePaymentPlan={removePaymentTerm}
                    />
                  </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td className="p-0 border-none align-top">
                      <QuotationTerms
                        termsList={quotationTerms}
                        onUpdateTerm={updateQuotationTerm}
                        onAddTerm={addQuotationTerm}
                        onRemoveTerm={removeQuotationTerm}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-0 border-none align-top pb-6 print:pb-0">
                      <QuotationPaymentTerms
                        paymentTerms={paymentTerms}
                        onUpdatePaymentTerm={updatePaymentTerm}
                        onAddPaymentTerm={addPaymentTerm}
                        onRemovePaymentTerm={removePaymentTerm}
                      />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div className="print-footer-bottom fixed-print-footer hidden print:block">
            <QuotationFooter />
          </div>

          <div className="px-10 pb-6 print:hidden">
            <QuotationFooter className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
