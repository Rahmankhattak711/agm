"use client";

import React from "react";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import { Product } from "@/lib/hooks/api-hooks";

interface QuotationReportProps {
  dynamicQuotationMeta: Partial<QuotationMeta>;
  dynamicQuotationItems: QuotationItem[];
  products: Product[];
}

export const QuotationReport: React.FC<QuotationReportProps> = ({
  dynamicQuotationMeta,
  dynamicQuotationItems,
  products,
}) => {
  return (
    <div className="space-y-4">
      <QuotationTemplate
        initialMeta={dynamicQuotationMeta}
        initialItems={dynamicQuotationItems}
        availableProducts={products}
      />
    </div>
  );
};
