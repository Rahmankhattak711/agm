"use client";

import { Product } from "@/lib/hooks/api-hooks";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useState } from "react";

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
  id: number;
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
  const [meta, setMeta] = useState<QuotationMeta>({
    quotationNo: initialMeta?.quotationNo || `AGM-QTN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
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

  const updateMeta = (k: MetaKey, v: string) =>
    setMeta((m) => ({ ...m, [k]: v }));

  const updateItem = (id: number, k: ItemKey, v: any) =>
    setItems((its) => its.map((it) => (it.id === id ? { ...it, [k]: v } : it)));

  const handleProductSelect = (id: number, productId: string) => {
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
        id: (its[its.length - 1]?.id || 0) + 1,
        desc: "",
        qty: 1,
        unit: "Lot",
        rate: 0,
      },
    ]);

  const removeItem = (id: number) =>
    setItems((its) => (its.length > 1 ? its.filter((it) => it.id !== id) : its));

  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.rate || 0),
    0
  );
  const vatAmt = (subtotal * Number(vatPct || 0)) / 100;
  const total = subtotal + vatAmt - Number(discount || 0);

  const fmt = (n: number): string =>
    n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const numberToWords = (num: number): string => {
    if (!num || num === 0) return "Zero";
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

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
    const scales: [string, number][] = [["", 1], ["Thousand", 1000], ["Million", 1000000]];
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

  const inputBase =
    "w-full bg-transparent outline-none focus:bg-blue-50/60 rounded px-1 py-0.5 transition-colors";

  return (
    <div className={hideOuterWrapper ? "w-full" : "min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0"}>
      <div className="mx-auto bg-white shadow-lg print:shadow-none max-w-4xl rounded-xl print:rounded-none overflow-hidden" id="printable-voucher">
        {/* Header */}
        <div className="flex items-start justify-between px-10 pt-8 pb-6 border-b border-slate-100">
          <div className="flex flex-col items-center">
            <Image
              src="/assets/logo.png"
              alt="AGM"
              width={150}
              height={150}
              sizes="100vh"
              quality={100}
              className="object-cover"
            />
          </div>
          <div className="text-right text-[12px] leading-5 text-slate-800 max-w-[380px]">
            <div className="font-bold text-[15px] mb-1 text-agm-green">
              A G M FITOUT TECHNICAL SERVICES L.L.C
            </div>
            <div>029 Maryam Ahmad Bldg, Al Bareha, Dubai, UAE</div>
            <div>M: +971 50 340 7300 | TRN: 104094432200003 | Licence: 1120959</div>
          </div>
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between px-10 py-4 w-full border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">COMMERCIAL QUOTATION</h1>
          <div className="text-[12px] text-right space-y-0.5">
            <div className="flex justify-end gap-2">
              <span className="text-slate-500 font-semibold">Quotation No:</span>
              <input
                className={inputBase + " text-right w-36 font-bold text-slate-900 font-mono"}
                value={meta.quotationNo}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateMeta("quotationNo", e.target.value)
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <span className="text-slate-500 font-semibold">Date:</span>
              <input
                className={inputBase + " text-right w-36 font-bold text-slate-900"}
                value={meta.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateMeta("date", e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <span className="text-slate-500 font-semibold">Valid Until:</span>
              <input
                className={inputBase + " text-right w-36 font-bold text-slate-900"}
                value={meta.validUntil}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateMeta("validUntil", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Info boxes */}
        <div className="grid grid-cols-2 gap-0 px-10 py-6 text-[12.5px]">
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

        {/* Salutation */}
        <div className="px-10 text-[13px] text-slate-800">
          <div className="font-bold">Dear Sir / Madam,</div>
          <div className="text-slate-600 mt-0.5">
            Thank you for the opportunity. We are pleased to submit our commercial quotation and scope of work as detailed below:
          </div>
        </div>

        {/* Table */}
        <div className="px-10 mt-4">
          <table className="w-full text-[12px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs">
            <thead>
              <tr className="text-white bg-agm-green">
                <th className="py-2.5 px-2 text-center font-bold w-10 border border-agm-box-border">#</th>
                <th className="py-2.5 px-3 text-left font-bold border border-agm-box-border">DESCRIPTION / SCOPE OF WORK</th>
                <th className="py-2.5 px-2 text-center font-bold w-16 border border-agm-box-border">QTY</th>
                <th className="py-2.5 px-2 text-center font-bold w-16 border border-agm-box-border">UNIT</th>
                <th className="py-2.5 px-2 text-right font-bold w-24 border border-agm-box-border">RATE (AED)</th>
                <th className="py-2.5 px-3 text-right font-bold w-28 border border-agm-box-border">AMOUNT (AED)</th>
                <th className="py-2.5 px-1 w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agm-box-border">
              {items.map((it, idx) => (
                <tr key={it.id} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="py-2 px-2 align-top text-center text-slate-700 font-bold border border-agm-box-border">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 align-top border border-agm-box-border">
                    {availableProducts.length > 0 && (
                      <div className="mb-1 print:hidden">
                        <select
                          className="w-full text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white font-medium text-slate-700"
                          value={it.productId || ""}
                          onChange={(e) => handleProductSelect(it.id, e.target.value)}
                        >
                          <option value="">-- Choose from Catalog (Auto-fill) --</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) - AED {Number(p.sellingPrice || p.costPrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <textarea
                      rows={2}
                      placeholder="Enter scope of work, specifications, or select a product above..."
                      className={inputBase + " resize-none text-slate-800 leading-snug"}
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
                      className={inputBase + " text-right font-mono font-semibold"}
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

          {/* Totals Box */}
          <div className="flex justify-end mt-4">
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setVatPct(e.target.value)}
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
                    />
                  </td>
                </tr>
                <tr className="bg-agm-green text-white">
                  <td className="py-2.5 px-3 text-right font-black">TOTAL (AED)</td>
                  <td className="py-2.5 px-3 text-right font-black font-mono text-sm">{fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 p-2 rounded bg-agm-box-bg border border-agm-box-border text-[12px] font-bold text-agm-green">
            Amount in words: AED {numberToWords(total)} Dirhams Only
          </div>
        </div>

        {/* Commercial Terms & Acceptance */}
        <div className="grid grid-cols-2 gap-0 px-10 mt-6 text-[11.5px]">
          <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-l-xl">
            <div className="font-bold mb-1 text-slate-900 uppercase text-[11px]">COMMERCIAL TERMS</div>
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
            <div className="font-bold mb-2 text-slate-900 uppercase text-[11px]">CLIENT ACCEPTANCE</div>
            <div className="space-y-2 text-slate-800">
              <div>Accepted by: ______________________</div>
              <div>Designation: ______________________</div>
              <div>Signature &amp; stamp:</div>
              <div className="h-6" />
              <div>Date: ______________________</div>
            </div>
          </div>
        </div>

        <div className="px-10 mt-6 text-right text-[12px] font-bold mb-10 text-agm-green">
          For A G M FITOUT TECHNICAL SERVICES L.L.C
          <div className="mt-4 font-normal text-slate-600 text-[11.5px]">
            Authorized Signatory: ______________________
          </div>
        </div>

        {/* Footer ribbon banner */}
        <div className="mt-8 relative w-full" style={{ height: 64 }}>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full block">
            <polygon points="0,0 150,0 90,100 0,100" fill="var(--agm-charcoal)" />
            <polygon points="166,0 850,0 790,100 106,100" fill="var(--agm-green)" />
            <polygon points="866,0 1000,0 1000,100 806,100" fill="var(--agm-charcoal)" />
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
      </div>
    </div>
  );
}
