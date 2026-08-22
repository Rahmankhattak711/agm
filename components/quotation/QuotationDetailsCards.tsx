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
    "w-full bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1 py-0.5 transition-colors print:bg-transparent print:p-0";

  return (
    <div className="grid grid-cols-2 gap-0 px-10 py-6 text-[12.5px] print-avoid-break">
      <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-l-xl">
        <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
          CLIENT / BILL TO
        </div>
        <div className="space-y-0.5 text-slate-800">
          <div>
            <input
              placeholder="Client / Company Name"
              className={inputBase + " font-bold text-slate-900"}
              value={meta.customer}
              onChange={(e) => onUpdateMeta("customer", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Attention: Contact Person"
              className={inputBase}
              value={meta.attention}
              onChange={(e) => onUpdateMeta("attention", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Address: Client Address, Dubai, UAE"
              className={inputBase}
              value={meta.address}
              onChange={(e) => onUpdateMeta("address", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="TRN: Client Tax Registration Number"
              className={inputBase}
              value={meta.trn}
              onChange={(e) => onUpdateMeta("trn", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="M: Phone Number  |  E: Email Address"
              className={inputBase}
              value={meta.mobile}
              onChange={(e) => onUpdateMeta("mobile", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-l-0 border-agm-box-border bg-agm-box-bg p-3.5 rounded-r-xl">
        <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
          PROJECT / SITE DETAILS
        </div>
        <div className="space-y-0.5 text-slate-800">
          <div>
            <input
              placeholder="Project: Project / Fitout Scope Name"
              className={inputBase + " font-bold text-slate-900"}
              value={meta.project}
              onChange={(e) => onUpdateMeta("project", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Location: Site / Building Location (e.g. Al Furjan, Dubai - UAE)"
              className={inputBase}
              value={meta.location}
              onChange={(e) => onUpdateMeta("location", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Reference: Enquiry / RFQ Reference"
              className={inputBase}
              value={meta.reference}
              onChange={(e) => onUpdateMeta("reference", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Prepared by: Estimator / Representative"
              className={inputBase}
              value={meta.preparedBy}
              onChange={(e) => onUpdateMeta("preparedBy", e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="Contact: Phone & Email"
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
