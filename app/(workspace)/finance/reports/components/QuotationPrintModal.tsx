"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import { Product } from "@/lib/hooks/api-hooks";

interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  dynamicQuotationMeta: Partial<QuotationMeta>;
  dynamicQuotationItems: QuotationItem[];
  products: Product[];
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  isOpen,
  onClose,
  dynamicQuotationMeta,
  dynamicQuotationItems,
  products,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: dynamicQuotationMeta.quotationNo || "Commercial-Quotation",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-2 sm:p-6 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
              AGM
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">
                Commercial Quotation Document
              </h3>
              <p className="text-[10.5px] text-slate-300">
                Official UAE formatted proposal & cost estimate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              onClick={() => handlePrint()}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              ✕ Close
            </Button>
          </div>
        </div>

        <div ref={contentRef} className="bg-white p-2 sm:p-4">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            availableProducts={products}
            hideOuterWrapper={true}
          />
        </div>
      </div>
    </div>
  );
};
