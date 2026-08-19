"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import {
  Product,
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
  Loader2,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import Image from "next/image";
import OutsideClickHandler from "react-outside-click-handler";

export interface QuotationMeta {
  quotationNo: string;
  date: string;
  validUntil: string;
  customer: string;
  attention: string;
  address: string;
  trn: string;
  mobile: string;
  project: string;
  location: string;
  reference: string;
  preparedBy: string;
  contact: string;
}

export interface QuotationItem {
  id: number | string;
  productId?: string;
  desc: string;
  qty: number | string;
  unit: string;
  rate: number | string;
}

export interface QuotationTemplateProps {
  initialMeta?: Partial<QuotationMeta>;
  initialItems?: QuotationItem[];
  availableProducts?: Product[];
  onPrint?: () => void;
  hideOuterWrapper?: boolean;
}

type MetaKey = keyof QuotationMeta;
type ItemKey = keyof Omit<QuotationItem, "id">;

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
  const [docType, setDocType] = useState<"QUOTATION" | "TAX_INVOICE">("QUOTATION");
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
    quotationNo:
      initialMeta?.quotationNo ||
      `AGM-QTN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    date: initialMeta?.date || new Date().toLocaleDateString("en-GB"),
    validUntil:
      initialMeta?.validUntil ||
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
    customer: initialMeta?.customer || "",
    attention: initialMeta?.attention || "",
    address: initialMeta?.address || "",
    trn: initialMeta?.trn || "",
    mobile: initialMeta?.mobile || "",
    project: initialMeta?.project || "",
    location: initialMeta?.location || "",
    reference: initialMeta?.reference || "",
    preparedBy: initialMeta?.preparedBy || "",
    contact: initialMeta?.contact || "",
  });

  const [items, setItems] = useState<QuotationItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [
          {
            id: 1,
            desc: "",
            qty: 1,
            unit: "Lot",
            rate: 0,
          },
        ]
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
                unit: selected.unit || "PCS",
                rate: Number(selected.sellingPrice || selected.costPrice || 0),
              }
            : it
        )
      );
    }
  };

  const addItem = () =>
    setItems((its) => [
      ...its,
      {
        id: Date.now() + Math.random(),
        desc: "",
        qty: 1,
        unit: "Lot",
        rate: 0,
      },
    ]);

  const removeItem = (id: number | string) =>
    setItems((its) => (its.length > 1 ? its.filter((it) => it.id !== id) : its));

  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.rate || 0),
    0
  );
  const vatAmt = (subtotal * Number(vatPct || 0)) / 100;
  const total = subtotal + vatAmt - Number(discount || 0);

  const fmt = (n: number): string =>
    n.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const numberToWords = (num: number): string => {
    if (!num || num === 0) return "Zero";
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const chunk = (n: number): string => {
      let s = "";
      if (n >= 100) {
        s += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n >= 20) {
        s += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }
      if (n > 0) s += ones[n] + " ";
      return s.trim();
    };

    let n = Math.floor(num);
    if (n === 0) return "Zero";

    const parts: string[] = [];
    const scales: [string, number][] = [
      ["", 1],
      ["Thousand", 1000],
      ["Million", 1000000],
    ];
    const groups: number[] = [];
    while (n > 0) {
      groups.push(n % 1000);
      n = Math.floor(n / 1000);
    }
    for (let i = groups.length - 1; i >= 0; i--) {
      if (groups[i] > 0) {
        parts.push(chunk(groups[i]) + (i > 0 ? " " + scales[i][0] : ""));
      }
    }
    return parts.join(" ").trim();
  };

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
        items: items.map((it, idx) => ({
          productId: it.productId || null,
          itemOrder: idx + 1,
          description: it.desc || "Scope item",
          quantity: Number(it.qty || 1),
          unit: it.unit || "Lot",
          unitRate: Number(it.rate || 0),
        })),
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
          productId: item.productId || undefined,
          desc: item.description,
          qty: Number(item.quantity || 1),
          unit: item.unit || "Lot",
          rate: Number(item.unitRate || 0),
        }))
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
          `• Debit Accounts Receivable: AED ${fmt(total)}\n` +
          `• Credit Fitout Revenue: AED ${fmt(subtotal - Number(discount || 0))}\n` +
          `• Credit UAE VAT Output (5%): AED ${fmt(vatAmt)}\n\n` +
          `This will record turnover in Profit & Loss and update the VAT Return!`
      )
    ) {
      return;
    }

    setIsPostingLedger(true);
    try {
      const arAccount =
        accountsList.find((a) => a.accountCode === "1200") ||
        accountsList.find((a) => a.type === "ASSET" && a.accountName.toLowerCase().includes("receivable")) ||
        accountsList.find((a) => a.accountCode === "1020") ||
        accountsList[0];
      const revAccount =
        accountsList.find((a) => a.accountCode === "4000") ||
        accountsList.find((a) => a.type === "REVENUE") ||
        accountsList[1];
      const vatOutAccount =
        accountsList.find((a) => a.accountCode === "2210") ||
        accountsList.find((a) => a.accountName.toLowerCase().includes("vat output")) ||
        accountsList[2];

      if (!arAccount || !revAccount || !vatOutAccount) {
        alert("Chart of accounts not found for AR (1200), Revenue (4000), or VAT Output (2210).");
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
      setLedgerPostedMsg(`Posted to General Ledger as ${entryNumber}! P&L & VAT updated.`);
      setTimeout(() => setLedgerPostedMsg(""), 6000);
    } catch (err: any) {
      alert("Error posting invoice to ledger: " + (err.message || "Unknown error"));
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
        Date.now() + 15 * 24 * 60 * 60 * 1000
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
        desc: "",
        qty: 1,
        unit: "Lot",
        rate: 0,
      },
    ]);
    setDiscount(0);
    setVatPct(5);
    setStatus("DRAFT");
  };

  const handleDeleteQuotation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved quotation?")) return;
    try {
      await deleteQuotationMutation.mutateAsync(id);
      if (selectedQuotationId === id) {
        handleNewQuotation();
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const inputBase =
    "w-full bg-transparent outline-none focus:bg-blue-50/60 rounded px-1 py-0.5 transition-colors print:bg-transparent print:p-0";

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
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setDocType("QUOTATION")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                docType === "QUOTATION"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={13} /> Quotation
            </button>
            <button
              onClick={() => setDocType("TAX_INVOICE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                docType === "TAX_INVOICE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileCheck size={13} /> Tax Invoice
            </button>
          </div>

          <button
            onClick={handleNewQuotation}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> New Blank
          </button>

          <button
            onClick={() => setIsSavedDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen size={14} /> Saved DB ({savedQuotations.length})
          </button>

          {docType === "QUOTATION" ? (
            <button
              onClick={handleConvertToInvoice}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Convert this quotation directly into an official UAE Tax Invoice"
            >
              <ArrowRightLeft size={14} /> Convert to Invoice
            </button>
          ) : (
            <button
              onClick={handlePostInvoiceToLedger}
              disabled={isPostingLedger}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Post this Invoice directly to General Ledger, updating Turnover and VAT Return"
            >
              {isPostingLedger ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} className="text-amber-300" />
              )}
              Post to Accounting (GL)
            </button>
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

          <button
            onClick={handleSaveToDb}
            disabled={saveQuotationMutation.isPending}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saveQuotationMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {selectedQuotationId ? "Update in DB" : "Save to DB"}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-4 flex justify-center items-center print:hidden">
          <OutsideClickHandler onOutsideClick={() => setIsSavedDrawerOpen(false)}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Saved Database Quotations</h3>
              </div>
              <button
                onClick={() => setIsSavedDrawerOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {isLoadingSaved ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-emerald-600" size={24} />
                  Loading database records...
                </div>
              ) : savedQuotations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No quotations stored in the database yet. Create one and click
                  &quot;Save to DB&quot;.
                </div>
              ) : (
                savedQuotations.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => handleLoadQuotation(q)}
                    className="py-3 px-3 hover:bg-slate-50 rounded-xl transition flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {q.quotationNo}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Client:{" "}
                        <strong className="text-slate-800">
                          {q.customer || "Unnamed Client"}
                        </strong>{" "}
                        {q.project ? `— Project: ${q.project}` : ""}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Date: {q.date || "N/A"} | Total:{" "}
                        <strong>AED {fmt(Number(q.totalAmount || 0))}</strong> |
                        Items: {q.items?.length || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadQuotation(q)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={(e) => handleDeleteQuotation(q.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete from DB"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </OutsideClickHandler>
      </div>
      )}

      <div
        className="mx-auto bg-white shadow-lg print:shadow-none max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible"
        id="printable-voucher"
      >
        <table className="print-page-table w-full border-collapse">
          
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <div className="flex items-start justify-between px-10 pt-8 pb-6 border-b border-slate-100 bg-white">
                  <div className="flex flex-col items-center">
                    <Image
                      src="/assets/logo.png"
                      alt="AGM"
                      width={150}
                      height={150}
                      sizes="100vh"
                      quality={100}
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="text-right text-[12px] leading-5 text-slate-800 max-w-[380px]">
                    <div className="font-bold text-[15px] mb-1 text-agm-green">
                      A G M FITOUT TECHNICAL SERVICES L.L.C
                    </div>
                    <div>029 Maryam Ahmad Bldg, Al Bareha, Dubai, UAE</div>
                    <div>
                      M: +971 50 340 7300 | TRN: 104094432200003 | Licence: 1120959
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tfoot className="print-page-footer-group">
            <tr>
              <td className="p-0 border-none">
                <div className="mt-8 relative w-full bg-white print-avoid-break" style={{ height: 64 }}>
                  <svg
                    viewBox="0 0 1000 100"
                    preserveAspectRatio="none"
                    className="w-full h-full block"
                  >
                    <polygon
                      points="0,0 150,0 90,100 0,100"
                      fill="var(--agm-charcoal)"
                    />
                    <polygon
                      points="166,0 850,0 790,100 106,100"
                      fill="var(--agm-green)"
                    />
                    <polygon
                      points="866,0 1000,0 1000,100 806,100"
                      fill="var(--agm-charcoal)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[11px] font-semibold leading-6 px-[19%]">
                    <div className="flex gap-10 whitespace-nowrap">
                      <span>VAT: 104094432200003</span>
                      <span>AC Name : AGM Fitout Technical Services</span>
                    </div>
                    <div className="flex gap-10 whitespace-nowrap">
                      <span>AC no: 0323111672001</span>
                      <span>Iban : AE44 0000 0003 2311 1672 001 RAK Bank</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>

          <tbody className="print-page-body-group">
            <tr>
              <td className="p-0 border-none align-top">
                
                <div className="flex items-center justify-between px-10 py-4 w-full border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {docType === "TAX_INVOICE" ? "TAX INVOICE" : "COMMERCIAL QUOTATION"}
                    </h1>
                    {docType === "TAX_INVOICE" && (
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
                      </p>
                    )}
                  </div>
                  <div className="text-[12px] text-right space-y-0.5">
                    <div className="flex justify-end gap-2">
                      <span className="text-slate-500 font-semibold">
                        {docType === "TAX_INVOICE" ? "Invoice No:" : "Quotation No:"}
                      </span>
                      <input
                        className={
                          inputBase +
                          " text-right w-36 font-bold text-slate-900 font-mono"
                        }
                        value={meta.quotationNo}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateMeta("quotationNo", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-slate-500 font-semibold">
                        {docType === "TAX_INVOICE" ? "Invoice Date:" : "Date:"}
                      </span>
                      <input
                        className={
                          inputBase + " text-right w-36 font-bold text-slate-900"
                        }
                        value={meta.date}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateMeta("date", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-slate-500 font-semibold">
                        {docType === "TAX_INVOICE" ? "Payment Due Date:" : "Valid Until:"}
                      </span>
                      <input
                        className={
                          inputBase + " text-right w-36 font-bold text-slate-900"
                        }
                        value={meta.validUntil}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateMeta("validUntil", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-0 px-10 py-6 text-[12.5px] print-avoid-break">
                  <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-l-xl">
                    <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
                      CLIENT / BILL TO
                    </div>
                    <div className="space-y-0.5 text-slate-800">
                      <input
                        className={inputBase + " font-bold text-slate-900"}
                        placeholder="Client / Company Name"
                        value={meta.customer}
                        onChange={(e) => updateMeta("customer", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Attention: Contact Person"
                        value={meta.attention}
                        onChange={(e) => updateMeta("attention", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Address: Client Address, Dubai, UAE"
                        value={meta.address}
                        onChange={(e) => updateMeta("address", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="TRN: Client Tax Registration Number"
                        value={meta.trn}
                        onChange={(e) => updateMeta("trn", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="M: Phone Number  |  E: Email Address"
                        value={meta.mobile}
                        onChange={(e) => updateMeta("mobile", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border border-l-0 border-agm-box-border bg-agm-box-bg p-3.5 rounded-r-xl">
                    <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
                      PROJECT / SITE DETAILS
                    </div>
                    <div className="space-y-0.5 text-slate-800">
                      <input
                        className={inputBase + " font-bold text-slate-900"}
                        placeholder="Project: Project / Fitout Scope Name"
                        value={meta.project}
                        onChange={(e) => updateMeta("project", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Location: Site / Building Location"
                        value={meta.location}
                        onChange={(e) => updateMeta("location", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Reference: Enquiry / RFQ Reference"
                        value={meta.reference}
                        onChange={(e) => updateMeta("reference", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Prepared by: Estimator / Representative"
                        value={meta.preparedBy}
                        onChange={(e) => updateMeta("preparedBy", e.target.value)}
                      />
                      <input
                        className={inputBase}
                        placeholder="Contact: Phone & Email"
                        value={meta.contact}
                        onChange={(e) => updateMeta("contact", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-10 text-[13px] text-slate-800 print-avoid-break">
                  <div className="font-bold">Dear Sir / Madam,</div>
                  <div className="text-slate-600 mt-0.5">
                    Thank you for the opportunity. We are pleased to submit our commercial quotation and scope of work as detailed below:
                  </div>
                </div>

                <div className="px-10 mt-4">
                  <table className="w-full text-[12px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs">
                    <thead>
                      <tr className="text-white bg-agm-green">
                        <th className="py-2.5 px-2 text-center font-bold w-10 border border-agm-box-border">
                          #
                        </th>
                        <th className="py-2.5 px-3 text-left font-bold border border-agm-box-border">
                          DESCRIPTION / SCOPE OF WORK
                        </th>
                        <th className="py-2.5 px-2 text-center font-bold w-16 border border-agm-box-border">
                          QTY
                        </th>
                        <th className="py-2.5 px-2 text-center font-bold w-16 border border-agm-box-border">
                          UNIT
                        </th>
                        <th className="py-2.5 px-2 text-right font-bold w-24 border border-agm-box-border">
                          RATE (AED)
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold w-28 border border-agm-box-border">
                          AMOUNT (AED)
                        </th>
                        <th className="py-2.5 px-1 w-8 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-agm-box-border">
                      {items.map((it, idx) => (
                        <tr
                          key={it.id}
                          className={`print-avoid-break ${
                            idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                          }`}
                        >
                          <td className="py-2 px-2 align-top text-center text-slate-700 font-bold border border-agm-box-border">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 align-top border border-agm-box-border">
                            {availableProducts.length > 0 && (
                              <div className="mb-1 print:hidden">
                                <select
                                  className="w-full text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white font-medium text-slate-700"
                                  value={it.productId || ""}
                                  onChange={(e) =>
                                    handleProductSelect(it.id, e.target.value)
                                  }
                                >
                                  <option value="">
                                    -- Choose from Catalog (Auto-fill) --
                                  </option>
                                  {availableProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.sku}) - AED{" "}
                                      {Number(
                                        p.sellingPrice || p.costPrice
                                      ).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <textarea
                              rows={2}
                              placeholder="Enter scope of work, specifications, or select a product above..."
                              className={
                                inputBase +
                                " resize-none text-slate-800 leading-snug"
                              }
                              value={it.desc}
                              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                updateItem(it.id, "desc", e.target.value)
                              }
                            />
                          </td>
                          <td className="py-2 px-2 align-top text-center border border-agm-box-border">
                            <input
                              type="number"
                              min="0"
                              className={inputBase + " text-center font-bold"}
                              value={it.qty}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateItem(it.id, "qty", e.target.value)
                              }
                            />
                          </td>
                          <td className="py-2 px-2 align-top text-center border border-agm-box-border">
                            <input
                              placeholder="Lot/PCS"
                              className={inputBase + " text-center"}
                              value={it.unit}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateItem(it.id, "unit", e.target.value)
                              }
                            />
                          </td>
                          <td className="py-2 px-2 align-top text-right border border-agm-box-border">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0.00"
                              className={
                                inputBase +
                                " text-right font-mono font-semibold"
                              }
                              value={it.rate}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateItem(it.id, "rate", e.target.value)
                              }
                            />
                          </td>
                          <td className="py-2 px-3 align-top text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                            {fmt(Number(it.qty || 0) * Number(it.rate || 0))}
                          </td>
                          <td className="py-2 px-1 align-top text-center print:hidden">
                            <button
                              onClick={() => removeItem(it.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    onClick={addItem}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold print:hidden text-agm-green hover:underline cursor-pointer"
                  >
                    <Plus size={14} /> + Add Line Item
                  </button>

                  <div className="flex justify-end mt-4 print-avoid-break">
                    <table className="text-[12.5px] border-collapse border border-agm-box-border w-80 rounded-lg overflow-hidden">
                      <tbody>
                        <tr>
                          <td className="py-2 px-3 text-right font-bold border border-agm-box-border bg-agm-box-bg text-slate-700">
                            Subtotal
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold border border-agm-box-border bg-agm-box-bg text-slate-900">
                            {fmt(subtotal)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-right font-bold border border-agm-box-border bg-agm-box-bg text-slate-700">
                            <span className="inline-flex items-center gap-1 justify-end">
                              VAT
                              <input
                                type="number"
                                className="w-9 bg-transparent outline-none border-b border-dotted border-slate-400 text-center font-bold text-agm-green"
                                value={vatPct}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  setVatPct(e.target.value)
                                }
                              />
                              %
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold border border-agm-box-border bg-agm-box-bg text-slate-900">
                            {fmt(vatAmt)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-right font-bold border border-agm-box-border bg-agm-box-bg text-slate-700">
                            Discount (AED)
                          </td>
                          <td className="py-2 px-3 text-right border border-agm-box-border bg-agm-box-bg text-slate-900">
                            <input
                              type="number"
                              placeholder="0.00"
                              className="text-right w-full bg-transparent outline-none font-mono font-bold"
                              value={discount}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setDiscount(e.target.value)
                              }
                            />
                          </td>
                        </tr>
                        <tr className="bg-agm-green text-white">
                          <td className="py-2.5 px-3 text-right font-black">
                            TOTAL (AED)
                          </td>
                          <td className="py-2.5 px-3 text-right font-black font-mono text-sm">
                            {fmt(total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3.5 p-2 rounded bg-agm-box-bg border border-agm-box-border text-[12px] font-bold text-agm-green print-avoid-break">
                    Amount in words: AED {numberToWords(total)} Dirhams Only
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-0 px-10 mt-6 text-[11.5px] print-avoid-break">
                  <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-l-xl">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[11px]">
                      COMMERCIAL TERMS
                    </div>
                    <ul className="text-slate-700 list-none space-y-0.5">
                      <li>• Validity: 15 days from quotation date.</li>
                      <li>• Payment: 50% advance; balance upon completion.</li>
                      <li>• Completion: As mutually agreed after advance payment and site access.</li>
                      <li>• VAT: 5% UAE VAT applied according to FTA regulations.</li>
                      <li>• Exclusions: Authority approval fees and work not listed above.</li>
                      <li>• Variations: Additional work requires client written approval.</li>
                    </ul>
                  </div>
                  <div className="border border-l-0 border-agm-box-border bg-agm-box-bg p-3.5 rounded-r-xl text-agm-green">
                    <div className="font-bold mb-2 text-slate-900 uppercase text-[11px]">
                      CLIENT ACCEPTANCE
                    </div>
                    <div className="space-y-2 text-slate-800">
                      <div>Accepted by: ______________________</div>
                      <div>Designation: ______________________</div>
                      <div>Signature &amp; stamp:</div>
                      <div className="h-6" />
                      <div>Date: ______________________</div>
                    </div>
                  </div>
                </div>

                <div className="px-10 mt-6 text-right text-[12px] font-bold mb-10 text-agm-green print-avoid-break">
                  For A G M FITOUT TECHNICAL SERVICES L.L.C
                  <div className="mt-4 font-normal text-slate-600 text-[11.5px]">
                    Authorized Signatory: ______________________
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
