import React from "react";
import { QuotationMeta } from "./constants";

export interface QuotationDetailsCardsProps {
  meta: QuotationMeta;
  onUpdateMeta: (key: keyof QuotationMeta, val: string) => void;
}

export const QuotationDetailsCards: React.FC<QuotationDetailsCardsProps> = ({
  meta,
  onUpdateMeta,
}) => {
  const inputBase =
    "flex-1 bg-transparent outline-none focus:bg-emerald-50/80 rounded px-1.5 py-0.5 text-slate-800 border-b border-dashed border-transparent hover:border-slate-300 focus:border-emerald-500 transition-colors print:bg-transparent print:p-0 print:border-none";

  const labelBase =
    "w-20 print:w-16 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0";

  return (
    <div className="grid grid-cols-2 gap-4 print:gap-2 px-10 py-3.5 print:px-8 print:py-1 text-[12px] print:text-[9.5px] print-avoid-break">
      {/* Client / Bill To Card */}
      <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl shadow-2xs">
        <div className="font-bold mb-2 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
          CLIENT / BILL TO
        </div>
        <div className="space-y-1 print:space-y-0.5">
          <div className="flex items-center gap-1">
            <span className={labelBase}>Client:</span>
            <input
              placeholder="Client / Company Name"
              className={inputBase + " font-bold text-slate-900"}
              value={meta.customer}
              onChange={(e) => onUpdateMeta("customer", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Attention:</span>
            <input
              placeholder="Contact Person"
              className={inputBase}
              value={meta.attention}
              onChange={(e) => onUpdateMeta("attention", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Address:</span>
            <input
              placeholder="Client Address, Dubai, UAE"
              className={inputBase}
              value={meta.address}
              onChange={(e) => onUpdateMeta("address", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Email:</span>
            <input
              placeholder="client@email.com"
              type="email"
              className={inputBase}
              value={meta.email || ""}
              onChange={(e) => onUpdateMeta("email", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Mobile:</span>
            <input
              placeholder="+971 50 000 0000"
              className={inputBase}
              value={meta.mobile}
              onChange={(e) => onUpdateMeta("mobile", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Project / Site Details Card */}
      <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl shadow-2xs">
        <div className="font-bold mb-2 text-slate-900 uppercase text-[11px] print:text-[9.5px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
          PROJECT / SITE DETAILS
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className={labelBase}>Project:</span>
            <input
              placeholder="Project / Scope Name"
              className={inputBase + " font-bold text-slate-900"}
              value={meta.project}
              onChange={(e) => onUpdateMeta("project", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Location:</span>
            <input
              placeholder="Site / Building Location (e.g. Al Furjan, Dubai)"
              className={inputBase}
              value={meta.location}
              onChange={(e) => onUpdateMeta("location", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Reference:</span>
            <input
              placeholder="Enquiry / RFQ Reference"
              className={inputBase}
              value={meta.reference}
              onChange={(e) => onUpdateMeta("reference", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Prepared by:</span>
            <input
              placeholder="Estimator / Representative"
              className={inputBase}
              value={meta.preparedBy}
              onChange={(e) => onUpdateMeta("preparedBy", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className={labelBase}>Contact:</span>
            <input
              placeholder="Phone & Email"
              className={inputBase}
              value={meta.contact}
              onChange={(e) => onUpdateMeta("contact", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetailsCards;
