"use client";

import { Button } from "@/components/ui";
import {
  QuotationRecord,
  useAccounts,
  useCreateJournalEntry,
  useDeleteQuotation,
  useQuotations,
  useSaveQuotation,
} from "@/lib/hooks/api-hooks";
import {
  ArrowRightLeft,
  Check,
  FileCheck,
  FileText,
  FolderOpen,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_TERMS_AND_CONDITIONS,
  formatCurrency,
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
  availableProducts = [],
  hideOuterWrapper = false,
}: QuotationTemplateProps) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");
  const [ledgerPostedMsg, setLedgerPostedMsg] = useState<string>("");
  const [isPostingLedger, setIsPostingLedger] = useState<boolean>(false);
  const [docType, setDocType] = useState<"QUOTATION" | "TAX_INVOICE">(
    "QUOTATION",
  );
  const [status, setStatus] = useState<
    "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED"
  >("DRAFT");
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);

  const { data: savedQuotations = [], isLoading: isLoadingSaved } =
    useQuotations();
  const { data: accountsList = [] } = useAccounts();
  const saveQuotationMutation = useSaveQuotation();
  const deleteQuotationMutation = useDeleteQuotation();
  const createJournalEntryMutation = useCreateJournalEntry();

  const [meta, setMeta] = useState<QuotationMeta>({
    quotationNo: initialMeta?.quotationNo || "AGM-QTN-2026-01217",
    date: initialMeta?.date || "06/08/2026",
    validUntil: initialMeta?.validUntil || "16/08/2026",
    customer: initialMeta?.customer || "Brian Berthelsen",
    attention: initialMeta?.attention || "",
    address: initialMeta?.address || "Dubai, UAE",
    trn: initialMeta?.trn || "",
    email: initialMeta?.email || "brian@example.com",
    mobile: initialMeta?.mobile || "+971 56 545 3103",
    project: initialMeta?.project || "Proposed G+1 Townhouses",
    location: initialMeta?.location || "Al Furjan, Dubai - UAE",
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
  const [vatPct, setVatPct] = useState<number | string>(5);
  const [discount, setDiscount] = useState<number | string>(0);

  useEffect(() => {
    if (initialMeta?.quotationNo && !selectedQuotationId) {
      setMeta((prev) => ({
        ...prev,
        ...initialMeta,
      }));
    }
  }, [initialMeta, selectedQuotationId]);

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

  const loadSamplePdfPreset = () => {
    setMeta({
      quotationNo: "Q-01217",
      date: "06/08/2026",
      validUntil: "16/08/2026",
      customer: "Brian Berthelsen",
      attention: "",
      address: "Dubai, UAE",
      trn: "",
      mobile: "+971 56 545 3103",
      project: "Proposed G+1 Townhouses",
      location: "Al Furjan, Dubai - UAE",
      reference: "",
      preparedBy: "assem@agmfitout.com",
      contact: "+971 48 749839 / +971 50 3407300",
    });
    setItems(SAMPLE_SCOPE_ITEMS);
    setPaymentTerms(DEFAULT_PAYMENT_TERMS);
    setVatPct(5);
    setDiscount(0);
    setSaveSuccessMsg("Loaded Quotation Scope Sample!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

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
  const vatAmt = (subtotal * Number(vatPct || 0)) / 100;
  const total = subtotal + vatAmt - Number(discount || 0);

  const handleSaveToDb = async () => {
    try {
      const payload = {
        quotationNo: meta.quotationNo,
        date: meta.date,
        validUntil: meta.validUntil,
        customer: meta.customer,
        attention: meta.attention,
        address: meta.address,
        trn: meta.trn,
        mobile: meta.mobile,
        project: meta.project,
        location: meta.location,
        reference: meta.reference,
        preparedBy: meta.preparedBy,
        contact: meta.contact,
        vatPct: Number(vatPct || 0),
        discount: Number(discount || 0),
        status,
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
        setSaveSuccessMsg(`Saved successfully as ${result.quotationNo}!`);
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      alert("Error saving quotation: " + (err.message || "Unknown error"));
    }
  };

  const handleLoadQuotation = (q: QuotationRecord) => {
    setSelectedQuotationId(q.id);
    setStatus(q.status);
    setVatPct(Number(q.vatPct || 5));
    setDiscount(Number(q.discount || 0));
    setMeta({
      quotationNo: q.quotationNo,
      date: q.date || "",
      validUntil: q.validUntil || "",
      customer: q.customer || "",
      attention: q.attention || "",
      address: q.address || "",
      trn: q.trn || "",
      mobile: q.mobile || "",
      project: q.project || "",
      location: q.location || "",
      reference: q.reference || "",
      preparedBy: q.preparedBy || "",
      contact: q.contact || "",
    });

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
  };

  const handleConvertToInvoice = () => {
    setDocType("TAX_INVOICE");
    setStatus("ACCEPTED");
    if (meta.quotationNo.startsWith("AGM-QTN-")) {
      const invNo = meta.quotationNo.replace("AGM-QTN-", "AGM-INV-");
      setMeta((prev) => ({
        ...prev,
        quotationNo: invNo,
        reference: prev.reference || prev.quotationNo,
      }));
    } else if (!meta.quotationNo.startsWith("AGM-INV-")) {
      const invNo = `AGM-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      setMeta((prev) => ({
        ...prev,
        quotationNo: invNo,
        reference: prev.reference || prev.quotationNo,
      }));
    }
    setSaveSuccessMsg("Converted to Official UAE Tax Invoice!");
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  const handlePostInvoiceToLedger = async () => {
    if (items.length === 0 || subtotal <= 0) {
      alert("Please add at least one line item with a rate before posting.");
      return;
    }
    if (
      !confirm(
        `Post this Tax Invoice (${meta.quotationNo}) to the General Ledger?\n\n` +
          `• Debit Accounts Receivable: AED ${formatCurrency(total)}\n` +
          `• Credit Fitout Revenue: AED ${formatCurrency(subtotal - Number(discount || 0))}\n` +
          `• Credit UAE VAT Output (5%): AED ${formatCurrency(vatAmt)}\n\n` +
          `This will record turnover in Profit & Loss and update the VAT Return!`,
      )
    ) {
      return;
    }

    setIsPostingLedger(true);
    try {
      const arAccount =
        accountsList.find((a) => a.accountCode === "1200") ||
        accountsList.find(
          (a) =>
            a.type === "ASSET" &&
            a.accountName.toLowerCase().includes("receivable"),
        ) ||
        accountsList.find((a) => a.accountCode === "1020") ||
        accountsList[0];
      const revAccount =
        accountsList.find((a) => a.accountCode === "4000") ||
        accountsList.find((a) => a.type === "REVENUE") ||
        accountsList[1];
      const vatOutAccount =
        accountsList.find((a) => a.accountCode === "2210") ||
        accountsList.find((a) =>
          a.accountName.toLowerCase().includes("vat output"),
        ) ||
        accountsList[2];

      if (!arAccount || !revAccount || !vatOutAccount) {
        alert(
          "Chart of accounts not found for AR (1200), Revenue (4000), or VAT Output (2210).",
        );
        setIsPostingLedger(false);
        return;
      }

      const entryNumber = `JE-INV-${Date.now().toString().slice(-6)}`;
      const payload = {
        entryNumber,
        entryDate: new Date().toISOString(),
        description: `Tax Invoice ${meta.quotationNo} - ${meta.customer || "Client"} (${meta.project || "Fitout Project"})`,
        reference: meta.quotationNo,
        createdBy: "system",
        lines: [
          {
            accountId: arAccount.id,
            debit: total,
            credit: 0,
          },
          {
            accountId: revAccount.id,
            debit: 0,
            credit: subtotal - Number(discount || 0),
          },
          {
            accountId: vatOutAccount.id,
            debit: 0,
            credit: vatAmt,
            vatType: "OUTPUT" as const,
            taxableAmount: subtotal - Number(discount || 0),
            vatAmount: vatAmt,
          },
        ],
      };

      await createJournalEntryMutation.mutateAsync(payload);
      setLedgerPostedMsg(
        `Posted to General Ledger as ${entryNumber}! P&L & VAT updated.`,
      );
      setTimeout(() => setLedgerPostedMsg(""), 6000);
    } catch (err: any) {
      alert(
        "Error posting invoice to ledger: " + (err.message || "Unknown error"),
      );
    } finally {
      setIsPostingLedger(false);
    }
  };

  const handleNewQuotation = () => {
    setSelectedQuotationId("");
    setDocType("QUOTATION");
    setMeta({
      quotationNo: `AGM-QTN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("en-GB"),
      validUntil: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB"),
      customer: "",
      attention: "",
      address: "",
      trn: "",
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
    setDiscount(0);
    setVatPct(5);
    setStatus("DRAFT");
  };

  const handleDeleteQuotation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved quotation?"))
      return;
    try {
      await deleteQuotationMutation.mutateAsync(id);
      if (selectedQuotationId === id) {
        handleNewQuotation();
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div
      className={
        hideOuterWrapper
          ? "w-full"
          : "min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0"
      }
    >
      <div className="max-w-4xl mx-auto mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <Button
              type="button"
              variant={docType === "QUOTATION" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setDocType("QUOTATION")}
              icon={<FileText size={13} />}
              className={
                docType === "QUOTATION"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500"
              }
            >
              Quotation
            </Button>
            <Button
              type="button"
              variant={docType === "TAX_INVOICE" ? "dark" : "ghost"}
              size="sm"
              onClick={() => setDocType("TAX_INVOICE")}
              icon={<FileCheck size={13} />}
              className={
                docType === "TAX_INVOICE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500"
              }
            >
              Tax Invoice
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleNewQuotation}
            icon={<Plus size={14} />}
          >
            New Blank
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadSamplePdfPreset}
            icon={<RotateCcw size={13} />}
            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
            title="Load sample scope of work and details"
          >
            Load Sample Scope
          </Button>

          <Button
            type="button"
            variant="dark"
            size="sm"
            onClick={() => setIsSavedDrawerOpen(true)}
            icon={<FolderOpen size={14} />}
          >
            Saved DB ({savedQuotations.length})
          </Button>

          {docType === "QUOTATION" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleConvertToInvoice}
              icon={<ArrowRightLeft size={14} />}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              title="Convert this quotation directly into an official UAE Tax Invoice"
            >
              Convert to Invoice
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handlePostInvoiceToLedger}
              loading={isPostingLedger}
              icon={<Zap size={14} className="text-amber-300" />}
              className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-xs"
              title="Post this Invoice directly to General Ledger, updating Turnover and VAT Return"
            >
              Post to Accounting (GL)
            </Button>
          )}

          {selectedQuotationId && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              Loaded: {meta.quotationNo}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <Check size={14} /> {saveSuccessMsg}
            </span>
          )}

          {ledgerPostedMsg && (
            <span className="text-xs font-bold text-purple-700 flex items-center gap-1 animate-fade-in bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              <Check size={14} /> {ledgerPostedMsg}
            </span>
          )}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="DRAFT">Status: DRAFT</option>
            <option value="SENT">Status: SENT</option>
            <option value="ACCEPTED">Status: ACCEPTED</option>
            <option value="REJECTED">Status: REJECTED</option>
            <option value="EXPIRED">Status: EXPIRED</option>
          </select>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveToDb}
            loading={saveQuotationMutation.isPending}
            icon={<Save size={14} />}
          >
            {selectedQuotationId ? "Update in DB" : "Save to DB"}
          </Button>

          <Button
            type="button"
            variant="dark"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={14} />}
          >
            Print / PDF
          </Button>
        </div>
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
          className="mx-auto bg-white shadow-lg print:shadow-none max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible"
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
                {/* Spacer row to prevent body rows from overlapping the fixed bottom footer */}
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
                <QuotationDetailsCards meta={meta} onUpdateMeta={updateMeta} />
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
              <td className="p-0 border-none align-top">
                <QuotationTerms termsList={DEFAULT_TERMS_AND_CONDITIONS} />
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
          </tbody>
        </table>

        {/* Fixed Footer pinned to the bottom of every page (including the last page) */}
        <div className="print-footer-bottom fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>

        {/* On-Screen Footer */}
        <div className="px-10 pb-6 print:hidden">
          <QuotationFooter className="mt-6" />
        </div>
      </div>
      </div>
    </div>
  );
}
