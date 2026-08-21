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
  ChevronDown,
  ChevronUp,
  FileCheck,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Save,
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
  section?: string;
  productId?: string;
  desc: string;
  qty: number | string;
  unit?: string;
  rate: number | string;
  isFree?: boolean;
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

export const DEFAULT_TERMS_AND_CONDITIONS = [
  {
    id: 1,
    title: "Quotation Validity:",
    text: "This quotation is valid for Ten(10) days from the date of issuance.",
  },
  {
    id: 2,
    title: "Preliminary Site Assessment and Material Submissions:",
    text: "Prior to the confirmation of pricing, a site visit and the submission of material details are required.",
  },
  {
    id: 3,
    title: "Confirmation of Red Marked Items:",
    text: "All items marked in red will be confirmed post thorough inspections of the site, design validation, and material confirmation.",
  },
  {
    id: 4,
    title: "Quotation Considerations:",
    text: "The quotation encompasses all specified items. Any alterations in quantity or removal of items may result in adjustments to the overall project cost.",
  },
  {
    id: 5,
    title: "Client Responsibilities:",
    text: "The client is responsible for obtaining all necessary approvals and permits before the commencement of work. AGM holds no liability for any delays caused, and is not obliged to adhere to the initially agreed starting date. If there any third-party insurance and gate pass required shall be paid by the Client.",
  },
  {
    id: 6,
    title: "Design and Material Selection Timeline:",
    text: "A period of days is required for design development and material selections.",
  },
  {
    id: 7,
    title: "Quality and Finish Disclaimer:",
    text: "The Client acknowledges and agrees that item related to repairs, remodelling, and refurbishment materials, such as doors, walls, and cabinets etc may be not result in a 100% perfect finish due to the condition of item.",
  },
  {
    id: 8,
    title: "Third-Party Contractor Liability:",
    text: "The Client acknowledges that other contractors working on-site. AGM Fitout Technical Services LLC shall not be held liable for any major or minor damage caused by (Whom). The Client shall ensure proper coordination among all parties on-site. Any repair or rework required because of such damage shall be carried out at the Client’s cost.",
  },
  {
    id: 9,
    title: "Commencement of Work:",
    text: "Work will commence 7 to 10 days from the date of confirmation (defined as the date of payment receipt). AGM reserves the right to modify the start date if the work permit is not secured or advance payment not received.",
  },
  {
    id: 10,
    title: "Documentation Requirements:",
    text: "Client identification and title deed must be submitted before the commencement of work.",
  },
  {
    id: 11,
    title: "Project Duration:",
    text: "The project timeline is estimated at 55 to 60 working days, contingent upon material availability at the site.",
  },
  {
    id: 12,
    title: "Material Delivery:",
    text: "All materials must be received within the contract location. Additional charges may apply for handling and must be settled promptly.",
  },
  {
    id: 13,
    title: "Electrical and Plumbing Connections:",
    text: "Electrical and plumbing connections must be prepared at the installation site. Additional charges will be incurred if professional assistance is required.",
  },
  {
    id: 14,
    title: "Work Suspension:",
    text: "AGM retains the right to suspend work in the event of delayed client payments, with rescheduling of work to be determined accordingly.",
  },
  {
    id: 15,
    title: "Variation Costs:",
    text: "Any variations to the agreed scope will incur immediate additional costs.",
  },
  {
    id: 16,
    title: "For quotations below 10,000 AED,",
    text: "the full amount (100%) is due advance payment upon acceptance of the offer to commence work.",
  },
  {
    id: 17,
    title: "Any changes requested by the Client",
    text: "to the approved materials, samples, installation supplies, or any mutually agreed-upon specifications after the acceptance of this quotation will be subject to additional costs and a reasonable extension of the project timeline. All additional costs must be paid immediately upon invoicing and prior to the implementation of the changes.",
  },
  {
    id: 18,
    title: "Site Access :",
    text: "No other contractors are present at the work site during our operational period. Our company is not responsible for any damage or breakage that occurs on the site in the event of a violation of this clause, Furthermore, any such presence requires a prior written Letter of No Objection from our side, and a signed undertaking letter from the other contractor formally accepting full responsibility for their presence and actions.",
  },
  {
    id: 19,
    title: "Any materials or equipment supplied or stored at the work site by the Client",
    text: "that are unrelated to the scope of work agreed upon in this contract fall under the sole responsibility of the Client. Our company is not responsible for protecting these materials against loss, theft, damage, or any harm that may befall them.",
  },
  {
    id: 20,
    title: "Materials that are manufactured or supplied by the Client",
    text: "are considered outside our contractual scope of responsibility. We completely disclaim responsibility for any manufacturing defects, damage during supply/delivery, or errors in the installation of these materials. The Client alone bears full responsibility for the quality and suitability of these materials.",
  },
];

export const DEFAULT_PAYMENT_TERMS = [
  "40 % Advance",
  "20% Floor work done at ground floor (whichever comes first)",
  "20% Glass work at site (whichever comes first)",
  "15% Wood work at site",
  "5 % Upon handing over",
];

export const SAMPLE_SCOPE_ITEMS: QuotationItem[] = [
  {
    id: 1,
    section: "Preliminaries",
    desc: "Preliminaries and mobilization for the project. Includes site protection where required, and demobilization upon completion. All as per local contract conditions, Rate covers standard site protection to common areas. Extensive protection to furniture/artworks charged extra.",
    qty: "Free",
    rate: "Free",
    isFree: true,
  },
  {
    id: 2,
    section: "Garage Work",
    desc: "Removal of existing aluminum frames from site including careful dismantling, Loading, Transportation & Disposal of debris to Dubai Municipality approved landfill.",
    qty: 1,
    rate: 3600,
  },
  {
    id: 3,
    section: "Garage Work",
    desc: "Heavy duty aluminum garage door, powder coated, double skin insulated panels, with thermal break. Color:(client will choose), Supply & install aluminum frame with all necessary fixing brackets and anchors.",
    qty: 1,
    rate: 3900,
  },
  {
    id: 4,
    section: "Garage Work",
    desc: "Supply and installation of\nGlass: double glass Fixed unit 6 mm-16 mm air space - 6mm external glass to be reflective\nFrame Finish: Aluminum powder coated.",
    qty: 2,
    rate: 5400,
  },
  {
    id: 5,
    section: "Entrance",
    desc: "Dismantling, removal, and site clearance of the existing main entrance door and frame assembly.\nSupply and installation of Wooden Main Entrance Door with Sidelight.\nSupply, fitting, and finishing of a new wooden entrance door assembly with an integrated glass side panel, including framing and standard ironmongery (hinges, handles, and locks).",
    qty: 1,
    rate: 14500,
  },
  {
    id: 6,
    section: "Tiling work (Ground Floor)",
    desc: "Remove the existing floor tiles. Supply and professional laying of floor tiles. (Note: The quoted rate is applicable for porcelain tiles wooden-finish, Italian or Spanish made as per client selection). Inspection and preparation of the existing subfloor, including the application of a self-leveling compound (where required) to ensure a perfectly flat and sound base for installation.",
    qty: 98,
    rate: 250,
  },
  {
    id: 7,
    section: "Kitchen",
    desc: "Fabrication and installation of kitchen cabinets made of MR MDF, laminated white carcass, center island cabinets with quartz countertop, Blum soft close hinges and drawer railings. Drawing & design to be issued after client confirmation.",
    qty: 1,
    rate: 76200,
  },
  {
    id: 8,
    section: "Others",
    desc: "Complimentary site inspection after 3 month of handing over.",
    qty: 1,
    rate: "Free",
    isFree: true,
  },
];

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
  const [showAllTerms, setShowAllTerms] = useState<boolean>(true);

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
    customer: initialMeta?.customer || "Brian Berthelsen",
    attention: initialMeta?.attention || "",
    address: initialMeta?.address || "Dubai, UAE",
    trn: initialMeta?.trn || "",
    mobile: initialMeta?.mobile || "+971 56 545 3103",
    project: initialMeta?.project || "Proposed G+1 Townhouses",
    location: initialMeta?.location || "Al Furjan, Dubai - UAE",
    reference: initialMeta?.reference || "",
    preparedBy: initialMeta?.preparedBy || "assem@agmfitout.com",
    contact: initialMeta?.contact || "+971 48 749839 / +971 50 3407300",
  });

  const [items, setItems] = useState<QuotationItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : SAMPLE_SCOPE_ITEMS
  );

  const [vatPct, setVatPct] = useState<number | string>(5);
  const [discount, setDiscount] = useState<number | string>(0);
  const [termsList] = useState(DEFAULT_TERMS_AND_CONDITIONS);
  const [paymentTermsList] = useState(DEFAULT_PAYMENT_TERMS);

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
                rate: Number(selected.sellingPrice || selected.costPrice || 0),
              }
            : it
        )
      );
    }
  };

  const addItem = (sectionName = "") =>
    setItems((its) => [
      ...its,
      {
        id: Date.now() + Math.random(),
        section: sectionName || (its.length > 0 ? its[its.length - 1].section || "" : ""),
        desc: "",
        qty: 1,
        rate: 0,
      },
    ]);

  const removeItem = (id: number | string) =>
    setItems((its) => (its.length > 1 ? its.filter((it) => it.id !== id) : its));

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
    setVatPct(5);
    setDiscount(0);
    setSaveSuccessMsg("Loaded Quotation Scope Sample!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const calculateRowTotal = (it: QuotationItem): number => {
    if (it.isFree || String(it.qty).toLowerCase() === "free" || String(it.rate).toLowerCase() === "free") {
      return 0;
    }
    const q = Number(it.qty || 0);
    const r = Number(it.rate || 0);
    return isNaN(q * r) ? 0 : q * r;
  };

  const subtotal = items.reduce((s, it) => s + calculateRowTotal(it), 0);
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
    for (let i = scales.length - 1; i >= 0; i--) {
      const scaleValue = scales[i][1];
      const scaleName = scales[i][0];
      const scaleCount = Math.floor(n / scaleValue);
      if (scaleCount > 0) {
        parts.push(chunk(scaleCount) + (scaleName ? " " + scaleName : ""));
        n %= scaleValue;
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
        items: items.map((it, idx) => {
          const isFree = Boolean(
            it.isFree ||
            String(it.qty).toLowerCase() === "free" ||
            String(it.rate).toLowerCase() === "free"
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
        section: "",
        desc: "",
        qty: 1,
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
    "w-full bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1 py-0.5 transition-colors print:bg-transparent print:p-0";

  return (
    <div
      className={
        hideOuterWrapper
          ? "w-full"
          : "min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0"
      }
    >
      {/* Control Action Toolbar */}
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
            onClick={loadSamplePdfPreset}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Load sample scope of work and details"
          >
            <RotateCcw size={13} /> Load Sample Scope
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
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Saved Drawer Modal */}
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
                    No quotations stored in the database yet. Create one and click &quot;Save to DB&quot;.
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
                          {q.project ? `— Project: ${q.project}` : ""}{" "}
                          {q.location ? `(${q.location})` : ""}
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

      {/* Main Printable A4 Document Container with Original AGM Aesthetic House UI */}
      <div
        className="mx-auto bg-white shadow-lg print:shadow-none max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible"
        id="printable-voucher"
      >
        <table className="print-page-table w-full border-collapse">
          {/* Header */}
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <div className="flex items-start justify-between px-10 pt-8 pb-6 border-b border-slate-100 bg-white">
                  <div className="flex flex-col items-start">
                    <Image
                      src="/assets/logo.png"
                      alt="AGM Aesthetic House"
                      width={150}
                      height={150}
                      sizes="100vh"
                      quality={100}
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="text-right text-[12px] leading-5 text-slate-800 max-w-[440px]">
                    <div className="font-bold text-[15px] mb-1 text-agm-green">
                      A G M FITOUT TECHNICAL SERVICES L.L.C
                    </div>
                    <div>
                      Sheikh Zayed Road, near Oasis Centre, Office No. 13-11 Building: Adel Mohammed Ali Jassim Al Marzouqi, Al Quoz First 1, Dubai, UAE
                    </div>
                    <div>
                      Tel: +971 48 749839 | Mob: +971 50 340 7300 | TRN: 104094432200003
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

        {/* Footer repeating on every page */}
<tfoot className="print-page-footer-group">
  <tr>
    <td className="p-0 border-none">
      <div
        className="mt-8 relative w-full bg-white print-avoid-break"
        style={{ height: 64 }}
      >
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="w-full h-full block"
        >
          {/* Left charcoal */}
          <polygon
            points="0,0 150,0 90,100 0,100"
            fill="var(--agm-charcoal)"
          />

          {/* Green center */}
          <polygon
            points="166,0 850,0 790,100 106,100"
            fill="var(--agm-green)"
          />

          {/* Right charcoal */}
          <polygon
            points="866,0 1000,0 1000,100 806,100"
            fill="var(--agm-charcoal)"
          />
        </svg>

        {/* Footer values */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[11px] font-semibold leading-5 text-center">

          {/* First row */}
          <div className="flex items-center justify-center whitespace-nowrap">
            <span>
              VAT: 104094432200003
            </span>

            <span className="mx-8">
              AC Name : AGM Fitout Technical Services
            </span>
          </div>

          {/* Second row */}
          <div className="flex items-center justify-center whitespace-nowrap">
            <span>
              AC no: 0323111672001
            </span>

            <span className="mx-8">
              Iban : AE44 0400 0003 2311 1672 001 RAK Bank
            </span>
          </div>
        </div>
      </div>
    </td>
  </tr>
</tfoot>

          {/* Document Body */}
          <tbody className="print-page-body-group">
            <tr>
              <td className="p-0 border-none align-top">
                {/* Document Title Bar */}
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

                {/* Dual Details Cards: Client / Bill To & Project / Site Details (with Location) */}
                <div className="grid grid-cols-2 gap-0 px-10 py-6 text-[12.5px] print-avoid-break">
                  {/* Left: Client Box */}
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

                  {/* Right: Project Details Box with Location */}
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
                      {/* Location Field */}
                      <input
                        className={inputBase + " font-semibold text-slate-900"}
                        placeholder="Location: Site / Building Location (e.g. Al Furjan, Dubai - UAE)"
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

                {/* Opening Salutation */}
                {/* <div className="px-10 text-[13px] text-slate-800 print-avoid-break">
                  <div className="font-bold">Dear Sir / Madam,</div>
                  <div className="text-slate-600 mt-0.5">
                    Thank you for the opportunity. We are pleased to submit our commercial quotation and scope of work as detailed below:
                  </div>
                </div> */}

                {/* Quotation Table with Original Green Header & Boxed Styling - NO UNIT COLUMN, Textarea for Description */}
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
                        <th className="py-2.5 px-2 text-center font-bold w-20 border border-agm-box-border">
                          QTY
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold w-28 border border-agm-box-border">
                          RATE (AED)
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold w-32 border border-agm-box-border">
                          AMOUNT (AED)
                        </th>
                        <th className="py-2.5 px-1 w-8 print:hidden bg-white border-none"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-agm-box-border">
                      {items.map((it, idx) => {
                        const isFree = Boolean(
                          it.isFree ||
                          String(it.qty).toLowerCase() === "free" ||
                          String(it.rate).toLowerCase() === "free"
                        );
                        const rowTotal = calculateRowTotal(it);
                        const prevSection = idx > 0 ? items[idx - 1].section : null;
                        const showSectionHeader = it.section && it.section !== prevSection;

                        return (
                          <React.Fragment key={it.id}>
                            {showSectionHeader && (
                              <tr className="bg-agm-box-bg font-bold border-t border-b border-agm-box-border print-avoid-break">
                                <td
                                  colSpan={5}
                                  className="py-1.5 px-3 text-[12px] font-bold text-agm-green uppercase tracking-wide border border-agm-box-border"
                                >
                                  {it.section}
                                </td>
                                <td className="print:hidden border-none bg-white"></td>
                              </tr>
                            )}

                            <tr
                              className={`print-avoid-break ${
                                idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                              }`}
                            >
                              {/* # Row Index */}
                              <td className="py-2 px-2 align-top text-center text-slate-700 font-bold border border-agm-box-border">
                                {idx + 1}
                              </td>

                              {/* DESCRIPTION / SCOPE OF WORK (Textarea) */}
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

                                {/* Section Header Tag in screen mode */}
                                <div className="print:hidden flex items-center gap-1 mb-1">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Section:
                                  </span>
                                  <input
                                    className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 w-40 font-semibold"
                                    placeholder="e.g. Garage Work, Kitchen..."
                                    value={it.section || ""}
                                    onChange={(e) => updateItem(it.id, "section", e.target.value)}
                                  />
                                </div>

                                {/* Textarea for Description / Scope of Work */}
                                <div className="hidden print:block whitespace-pre-wrap text-slate-800 text-[11.5px] leading-relaxed">
                                  {it.desc}
                                </div>

                                <textarea
                                  rows={Math.max(2, (it.desc.match(/\n/g) || []).length + 2)}
                                  placeholder="Enter scope of work, specifications, or select a product above..."
                                  className={
                                    inputBase +
                                    " print:hidden resize-y min-h-[46px] text-slate-800 leading-snug"
                                  }
                                  value={it.desc}
                                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                    updateItem(it.id, "desc", e.target.value)
                                  }
                                />
                              </td>

                              {/* QTY Column (No Unit column) */}
                              <td className="py-2 px-2 align-top text-center border border-agm-box-border">
                                <input
                                  type="text"
                                  className={inputBase + " text-center font-bold"}
                                  value={it.qty}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    updateItem(it.id, "qty", e.target.value)
                                  }
                                  placeholder="1"
                                />
                              </td>

                              {/* RATE (AED) */}
                              <td className="py-2 px-2 align-top text-right border border-agm-box-border">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className={
                                    inputBase +
                                    " text-right font-mono font-semibold"
                                  }
                                  value={
                                    isFree
                                      ? "Free"
                                      : typeof it.rate === "number"
                                      ? it.rate.toLocaleString("en-AE")
                                      : it.rate
                                  }
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    updateItem(it.id, "rate", e.target.value)
                                  }
                                />
                              </td>

                              {/* AMOUNT (AED) */}
                              <td className="py-2 px-3 align-top text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                                {isFree ? "Free" : fmt(rowTotal)}
                              </td>

                              {/* Remove line button (hidden on print) */}
                              <td className="py-2 px-1 align-top text-center print:hidden border-none">
                                <button
                                  onClick={() => removeItem(it.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition"
                                  title="Remove row"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add Row Controls */}
                  <div className="flex items-center gap-3 mt-2.5 print:hidden">
                    <button
                      onClick={() => addItem()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-agm-green hover:underline cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      <Plus size={14} /> + Add Line Item
                    </button>
                    <button
                      onClick={() => addItem("New Section")}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:underline cursor-pointer bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <Plus size={14} /> + Add Line with Section Header
                    </button>
                  </div>

                  {/* Summary Totals Block in Original AGM Theme */}
                  <div className="flex justify-end mt-4 print-avoid-break">
                    <table className="text-[12.5px] border-collapse border border-agm-box-border w-84 rounded-lg overflow-hidden">
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

                  {/* Amount in words */}
                  <div className="mt-3.5 p-2.5 rounded-lg bg-agm-box-bg border border-agm-box-border text-[12px] font-bold text-agm-green print-avoid-break">
                    Amount in words: AED {numberToWords(total)} Dhs Only
                  </div>
                </div>

                {/* Terms and Conditions (All 20 Clauses + Payment Terms) Styled in AGM Theme */}
                <div className="px-10 mt-6 print-avoid-break">
                  <div className="border border-agm-box-border bg-agm-box-bg p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-slate-900 uppercase text-[11.5px] tracking-wider text-agm-green">
                        TERMS AND CONDITIONS (20 CLAUSES)
                      </div>
                      <button
                        onClick={() => setShowAllTerms(!showAllTerms)}
                        className="print:hidden text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showAllTerms ? (
                          <>
                            <ChevronUp size={14} /> Collapse View
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> Expand All 20 Terms
                          </>
                        )}
                      </button>
                    </div>

                    <div
                      className={`space-y-1 text-[11px] text-slate-700 leading-relaxed ${
                        showAllTerms ? "" : "max-h-48 overflow-hidden print:max-h-none"
                      }`}
                    >
                      {termsList.map((t) => (
                        <div key={t.id} className="flex items-start gap-1.5 py-0.5">
                          <span className="font-bold text-agm-green min-w-[18px]">
                            {t.id}.
                          </span>
                          <div>
                            <strong className="text-slate-900 mr-1">{t.title}</strong>
                            <span>{t.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Terms Sub-Block */}
                    <div className="mt-3.5 pt-3 border-t border-agm-box-border">
                      <div className="font-bold text-slate-900 uppercase text-[11px] text-agm-green mb-1.5">
                        PAYMENT TERMS
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-800 font-semibold">
                        {paymentTermsList.map((pt, idx) => (
                          <div
                            key={idx}
                            className="bg-white/80 border border-agm-box-border px-2.5 py-1 rounded"
                          >
                            • {pt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Acceptance and AGM Signatures Block in AGM Theme */}
                <div className="grid grid-cols-2 gap-0 px-10 mt-6 text-[11.5px] print-avoid-break">
                  {/* Left: Commercial & Banking Overview */}
                  <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-l-xl">
                    <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
                      BANKING INFORMATION
                    </div>
                    <div className="space-y-1 text-slate-700 font-medium">
                      <div>Company: <strong className="text-slate-900">A G M FITOUT TECHNICAL SERVICES LLC</strong></div>
                      <div>Bank: <strong className="text-slate-900">The National Bank of Ras Al Khaimah (RAKBANK)</strong></div>
                      <div>Account (AED): <strong className="text-slate-900 font-mono">0323111672001</strong></div>
                      <div>IBAN: <strong className="text-slate-900 font-mono">AE44 0400 0003 2311 1672 001</strong></div>
                      <div>SWIFT Code: <strong className="text-slate-900 font-mono">NRAKAEAK</strong></div>
                    </div>
                  </div>

                  {/* Right: Client Acceptance */}
                  <div className="border border-l-0 border-agm-box-border bg-agm-box-bg p-3.5 rounded-r-xl">
                    <div className="font-bold mb-2 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
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

                {/* Company Signatory */}
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
