"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import { useProducts } from "@/lib/hooks/api-hooks";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";

export default function QuotationsPage() {
  const router = useRouter();
  const { data: products = [], isLoading } = useProducts();

  const dynamicQuotationMeta: Partial<QuotationMeta> = {
    quotationNo: `AGM-QTN-2026-${Date.now().toString().slice(-4)}`,
    date: new Date().toLocaleDateString("en-GB"),
    validUntil: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-GB"),
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

  const dynamicQuotationItems: QuotationItem[] =
    products.length > 0
      ? products.slice(0, 3).map((p, idx) => ({
          id: idx + 1,
          productId: p.id,
          desc: `${p.name} (${p.sku})${p.description ? ` - ${p.description}` : ""}`,
          qty: 1,
          rate: Number(p.sellingPrice || p.costPrice || 0),
        }))
      : [
          {
            id: 1,
            desc: "",
            qty: 1,
            rate: 0,
          },
        ];

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* 1. Top Executive Compact Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Financial Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

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
                Commercial Quotations &amp; Proposals
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Create, manage, and print official commercial proposals, multi-point scope bundles, and client invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-visible">
        <QuotationTemplate
          initialMeta={dynamicQuotationMeta}
          initialItems={dynamicQuotationItems}
          availableProducts={products}
        />
      </div>
    </div>
  );
}
