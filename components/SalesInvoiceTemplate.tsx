"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  useCreateSalesInvoice,
  useUpdateSalesInvoice,
  useSalesInvoices,
  useProducts,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import {
  ChevronDown,
  Plus,
  Printer,
  Save,
  CheckCircle2,
  FileText,
  Send,
} from "lucide-react";
import {
  ItemKey,
  MetaKey,
  QuotationDetailsCards,
  QuotationDocTitleBar,
  QuotationFooter,
  QuotationHeader,
  QuotationItem,
  QuotationItemsTable,
  QuotationMeta,
  QuotationSignatures,
  QuotationTotalsTable,
  SalesInvoiceTerms,
} from "./quotation";
import {
  DEFAULT_SALES_INVOICE_TERMS_TEXT,
  DEFAULT_SALES_INVOICE_PAYMENT_PLANS,
} from "./quotation/SalesInvoiceTerms";

export interface SalesInvoiceTemplateProps {
  initialInvoice?: SalesInvoice | null;
  onSuccess?: (invoice: any) => void;
  onCancel?: () => void;
  availableProducts?: any[];
  hideOuterWrapper?: boolean;
}

function parseDateString(dStr?: string): Date {
  if (!dStr) return new Date();
  if (dStr.includes("/")) {
    const parts = dStr.split("/").map(Number);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d && m && y) return new Date(y, m - 1, d);
    }
  }
  const parsed = new Date(dStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function SalesInvoiceTemplate({
  initialInvoice,
  onSuccess,
  onCancel,
  availableProducts = [],
  hideOuterWrapper = false,
}: SalesInvoiceTemplateProps) {
  const { data: allInvoices = [] } = useSalesInvoices();
  const createInvoiceMutation = useCreateSalesInvoice();
  const updateInvoiceMutation = useUpdateSalesInvoice();

  const [status, setStatus] = useState<"DRAFT" | "POSTED">(
    initialInvoice?.status === "POSTED" ? "POSTED" : "DRAFT",
  );
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Auto-generate invoice number if new
  const generatedInvoiceNo = useMemo(() => {
    if (initialInvoice?.invoiceNumber) {
      return initialInvoice.invoiceNumber;
    }
    let nextNum = 1;
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const nums = allInvoices
      .map((inv) => {
        const match = inv.invoiceNumber?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(Boolean);

    if (nums.length > 0) {
      nextNum = Math.max(...nums, 0) + 1;
    }
    const padded = String(nextNum).padStart(4, "0");
    return `${prefix}${padded}`;
  }, [initialInvoice, allInvoices]);

  const [meta, setMeta] = useState<QuotationMeta>(() => {
    if (initialInvoice) {
      return {
        quotationNo: initialInvoice.invoiceNumber || "",
        date: initialInvoice.invoiceDate
          ? new Date(initialInvoice.invoiceDate).toLocaleDateString("en-GB")
          : new Date().toLocaleDateString("en-GB"),
        validUntil: initialInvoice.dueDate
          ? new Date(initialInvoice.dueDate).toLocaleDateString("en-GB")
          : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
        customerId: initialInvoice.customerId || "",
        customer: initialInvoice.customerName || "",
        attention: "",
        address: (initialInvoice as any).customerAddress || "",
        trn: initialInvoice.customerTrn || "",
        mobile: "",
        email: "",
        project: initialInvoice.projectScope || "Commercial Fitout Contract",
        location: "Dubai, UAE",
        reference: initialInvoice.quotationRef || "",
        preparedBy: "Accounts Department",
        contact: "+971 48 749839",
      };
    }
    return {
      quotationNo: generatedInvoiceNo,
      date: new Date().toLocaleDateString("en-GB"),
      validUntil: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB"),
      customerId: "",
      customer: "",
      attention: "",
      address: "",
      trn: "",
      mobile: "",
      email: "",
      project: "Commercial Fitout Contract",
      location: "Dubai, UAE",
      reference: "",
      preparedBy: "Accounts Department",
      contact: "+971 48 749839",
    };
  });

  useEffect(() => {
    if (!initialInvoice && generatedInvoiceNo) {
      setMeta((prev) => ({
        ...prev,
        quotationNo: generatedInvoiceNo,
      }));
    }
  }, [generatedInvoiceNo, initialInvoice]);

  // Initial Line Items
  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (initialInvoice?.items && initialInvoice.items.length > 0) {
      return initialInvoice.items.map((it: any, idx: number) => ({
        id: it.id || idx + 1,
        productId: it.productId || undefined,
        desc: it.description || "",
        qty: Number(it.quantity || 1),
        rate: Number(it.unitPrice || 0),
        unit: it.unit || "SQM",
        isFree: false,
      }));
    }
    return [
      {
        id: 1,
        desc: "Commercial Fitout Works / Execution",
        qty: 1,
        rate: 0,
        unit: "SQM",
      },
    ];
  });

  // Terms and Payment Plans
  const [terms, setTerms] = useState<string[]>(() => {
    if (initialInvoice?.terms) {
      try {
        const parsed = JSON.parse(initialInvoice.terms);
        if (parsed.terms && Array.isArray(parsed.terms)) {
          return parsed.terms.map((t: any) =>
            typeof t === "string" ? t : `${t.title ? t.title + ": " : ""}${t.text || ""}`,
          );
        }
      } catch {}
    }
    return DEFAULT_SALES_INVOICE_TERMS_TEXT;
  });

  const [paymentPlans, setPaymentPlans] = useState<string[]>(() => {
    if (initialInvoice?.terms) {
      try {
        const parsed = JSON.parse(initialInvoice.terms);
        if (parsed.paymentPlans && Array.isArray(parsed.paymentPlans)) {
          return parsed.paymentPlans;
        }
        if (parsed.paymentTerms && Array.isArray(parsed.paymentTerms)) {
          return parsed.paymentTerms;
        }
      } catch {}
    }
    return DEFAULT_SALES_INVOICE_PAYMENT_PLANS;
  });

  const [vatPct, setVatPct] = useState<number | string>(
    initialInvoice?.vatRate !== undefined && initialInvoice?.vatRate !== null
      ? Number(initialInvoice.vatRate)
      : 5.0,
  );
  const [discount, setDiscount] = useState<number | string>(
    initialInvoice?.discount !== undefined && initialInvoice?.discount !== null
      ? Number(initialInvoice.discount)
      : 0,
  );

  // Status dropdown outside click listener
  useEffect(() => {
    if (!isStatusOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusOpen]);

  const updateMeta = (k: MetaKey, v: string) =>
    setMeta((m) => ({ ...m, [k]: v }));

  const updateItem = (id: number | string, k: ItemKey, v: any) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, [k]: v } : it)));

  const addItem = () => {
    const nextId =
      items.length > 0 ? Math.max(...items.map((i) => Number(i.id) || 0)) + 1 : 1;
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        desc: "",
        qty: 1,
        rate: 0,
        unit: "SQM",
      },
    ]);
  };

  const removeItem = (id: number | string) => {
    if (items.length <= 1) {
      toast.warning("Invoice must contain at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
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
                desc: `${selected.name} (${selected.sku})${
                  selected.description ? ` - ${selected.description}` : ""
                }`,
                rate: Number(selected.sellingPrice || selected.costPrice || 0),
                unit: selected.unit || it.unit || "NOS",
              }
            : it,
        ),
      );
    }
  };

  // Terms and payment plans handlers
  const updateTerm = (idx: number, val: string) => {
    setTerms((prev) => prev.map((t, i) => (i === idx ? val : t)));
  };

  const addTerm = () => {
    setTerms((prev) => [...prev, "New invoice condition or specification clause."]);
  };

  const removeTerm = (idx: number) => {
    setTerms((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePaymentPlan = (idx: number, val: string) => {
    setPaymentPlans((prev) => prev.map((p, i) => (i === idx ? val : p)));
  };

  const addPaymentPlan = () => {
    setPaymentPlans((prev) => [...prev, "Progress billing milestone as agreed."]);
  };

  const removePaymentPlan = (idx: number) => {
    setPaymentPlans((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations
  const calculateRowTotal = (it: QuotationItem): number => {
    if (it.isFree || String(it.qty).toLowerCase() === "free" || String(it.rate).toLowerCase() === "free") {
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

  // New Blank Reset
  const handleNewBlank = () => {
    let nextNum = 1;
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const nums = allInvoices
      .map((inv) => {
        const match = inv.invoiceNumber?.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(Boolean);

    if (nums.length > 0) {
      nextNum = Math.max(...nums, 0) + 1;
    }
    const padded = String(nextNum).padStart(4, "0");

    setMeta({
      quotationNo: `${prefix}${padded}`,
      date: new Date().toLocaleDateString("en-GB"),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      customerId: "",
      customer: "",
      attention: "",
      address: "",
      trn: "",
      mobile: "",
      email: "",
      project: "Commercial Fitout Contract",
      location: "Dubai, UAE",
      reference: "",
      preparedBy: "Accounts Department",
      contact: "+971 48 749839",
    });
    setItems([
      {
        id: 1,
        desc: "Commercial Fitout Works / Execution",
        qty: 1,
        rate: 0,
        unit: "SQM",
      },
    ]);
    setTerms(DEFAULT_SALES_INVOICE_TERMS_TEXT);
    setPaymentPlans(DEFAULT_SALES_INVOICE_PAYMENT_PLANS);
    setDiscount(0);
    setVatPct(5.0);
    setStatus("DRAFT");
  };

  // Save to DB (Draft or Posted)
  const handleSave = async (forceDraft: boolean = false) => {
    if (!meta.customerId && (!meta.customer || !meta.customer.trim())) {
      toast.warning("Customer Required: Please select or enter a client name.");
      return;
    }

    const effectiveStatus = forceDraft ? "DRAFT" : status;
    const isPosted = effectiveStatus === "POSTED";

    const formattedItems = items
      .filter((it) => it.desc && it.desc.trim().length > 0)
      .map((it) => {
        const qty = Number(it.qty) || 1;
        const rate = Number(it.rate) || 0;
        return {
          productId: it.productId || null,
          description: it.desc.trim(),
          quantity: qty,
          unit: it.unit || "SQM",
          unitPrice: rate,
          discount: 0,
          totalAmount: qty * rate,
        };
      });

    if (formattedItems.length === 0) {
      toast.warning("Please add at least one line item with a description.");
      return;
    }

    const invDate = parseDateString(meta.date);
    const dueDate = meta.validUntil
      ? parseDateString(meta.validUntil)
      : new Date(invDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const payload = {
      invoiceNumber: meta.quotationNo,
      customerId: meta.customerId || null,
      customerName: meta.customer.trim(),
      customerTrn: meta.trn?.trim() || null,
      projectScope: meta.project?.trim() || "Commercial Fitout Project",
      quotationRef: meta.reference?.trim() || null,
      invoiceDate: invDate.toISOString(),
      dueDate: dueDate.toISOString(),
      items: formattedItems,
      discount: discountNum,
      vatRate: vatRate,
      vatAmount: vatAmt,
      totalAmount: total,
      terms: JSON.stringify({ terms, paymentPlans }),
      autoPost: isPosted,
    };

    try {
      if (initialInvoice?.id) {
        await updateInvoiceMutation.mutateAsync({
          id: initialInvoice.id,
          data: payload as any,
        });
        toast.success(`Sales invoice "${meta.quotationNo}" updated successfully!`);
      } else {
        const created = await createInvoiceMutation.mutateAsync(payload);
        toast.success(
          `Sales Invoice "${created?.invoiceNumber || meta.quotationNo}" created successfully${
            isPosted ? " and posted to GL!" : " as Draft!"
          }`,
        );
      }
      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err: any) {
      toast.error(`Error saving invoice: ${err.message}`);
    }
  };

  const isSaving =
    createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  return (
    <div
      className={
        hideOuterWrapper
          ? "w-full"
          : "min-h-screen print:bg-white print:py-0 print:px-0"
      }
    >
      {/* Top Action Toolbar */}
      <div className="max-w-full mx-auto mb-4 bg-white/95 backdrop-blur-sm p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handleNewBlank}
          className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
          <span>New Blank</span>
        </button>

        {/* Status Dropdown */}
        <div ref={statusRef} className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => setIsStatusOpen((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] ${
              status === "POSTED"
                ? "bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200/90"
                : "bg-amber-50 hover:bg-amber-100/90 text-amber-800 border-amber-200/90"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status === "POSTED"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
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
            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              {[
                {
                  val: "DRAFT",
                  label: "Draft",
                  dot: "bg-amber-500",
                  badge: "bg-amber-50 text-amber-700",
                },
                {
                  val: "POSTED",
                  label: "Posted to GL",
                  dot: "bg-emerald-500",
                  badge: "bg-emerald-50 text-emerald-700",
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

        {/* Save to DB (respects selected status) */}
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer ${
            !meta.customerId && !meta.customer.trim()
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              : status === "POSTED"
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border border-emerald-400/25"
                : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border border-blue-400/25"
          }`}
          title={
            !meta.customerId && !meta.customer.trim()
              ? "Select or enter customer name first"
              : "Save invoice to database"
          }
        >
          <Save className="w-3.5 h-3.5" />
          <span>
            {isSaving
              ? "Saving..."
              : initialInvoice?.id
                ? "Update Invoice"
                : status === "POSTED"
                  ? "Save & Post to GL"
                  : "Save Invoice"}
          </span>
        </button>

        {/* Quick Save as Draft Button if status is currently POSTED */}
        {status === "POSTED" && !initialInvoice?.id && (
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>Save as Draft</span>
          </button>
        )}

        {/* Print / PDF Button */}
        <button
          type="button"
          onClick={() => {
            if (!meta.customerId && !meta.customer.trim()) {
              toast.warning(
                "Customer Required: Please select or enter a client name before printing.",
              );
              return;
            }
            const printTitle = formatPdfDocumentTitle(
              [meta.quotationNo, meta.customer, meta.project],
              "Tax-Invoice",
            );
            printWithDocumentTitle(printTitle);
          }}
          className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / PDF</span>
        </button>

        {!meta.customerId && !meta.customer.trim() && (
          <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Client Name Required</span>
          </span>
        )}

        {initialInvoice?.id && (
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Editing: {meta.quotationNo}</span>
          </span>
        )}
      </div>

      {/* Main Printable Tax Invoice Document */}
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
                    docType="TAX_INVOICE"
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
              <tr>
                <td className="p-0 border-none align-top pb-6 print:pb-0">
                  <SalesInvoiceTerms
                    className="px-10 mt-4 print:px-0 print:mt-2"
                    terms={terms}
                    onUpdateTerm={updateTerm}
                    onAddTerm={addTerm}
                    onRemoveTerm={removeTerm}
                    paymentPlans={paymentPlans}
                    onUpdatePaymentPlan={updatePaymentPlan}
                    onAddPaymentPlan={addPaymentPlan}
                    onRemovePaymentPlan={removePaymentPlan}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-0 border-none align-top">
                  <QuotationSignatures />
                </td>
              </tr>
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
