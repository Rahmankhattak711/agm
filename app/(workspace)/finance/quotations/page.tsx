"use client";

import React from "react";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import { useProducts } from "@/lib/hooks/api-hooks";

export default function QuotationsPage() {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Commercial Quotations & Invoices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, manage, and print official commercial proposals, multi-point scope bundles, and client invoices.
          </p>
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
