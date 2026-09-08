import React from "react";

export const QuotationSignatures: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 px-10 print:px-8 mt-6 print:mt-3 mb-10 print:mb-4 text-[11.5px] print:text-[12px] print-avoid-break">
      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-2.5 rounded-xl">
        <div className="font-bold mb-2 print:mb-1 text-slate-900 uppercase text-[11px] print:text-[12px] tracking-wider text-agm-green">
          CLIENT ACCEPTANCE
        </div>
        <div className="space-y-2 print:space-y-1 text-slate-800">
          <div>Accepted by: ______________________</div>
          <div>Designation: ______________________</div>
          <div>Signature &amp; stamp:</div>
          <div className="h-6 print:h-4" />
          <div>Date: ______________________</div>
        </div>
      </div>

      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-2.5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="font-bold mb-2 print:mb-1 text-slate-900 uppercase text-[11px] print:text-[12px] tracking-wider text-agm-green">
            AGM AUTHORIZED SIGNATORY
          </div>
          <div className="text-slate-800 font-medium">
            For A G M FITOUT TECHNICAL SERVICES L.L.C
          </div>
        </div>
        <div className="space-y-2 text-slate-800 mt-6">
          <div>Authorized Signatory: ______________________</div>
          <div>Date: ______________________</div>
        </div>
      </div>
    </div>
  );
};

export default QuotationSignatures;
