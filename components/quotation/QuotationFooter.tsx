import React from "react";

export const QuotationFooter: React.FC = () => {
  return (
    <div
      className="mt-8 relative w-full bg-white print-avoid-break"
      style={{ height: 64 }}
    >
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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[11px] font-semibold leading-5 text-center">
        <div className="flex items-center justify-center whitespace-nowrap">
          <span>VAT: 104094432200003</span>
          <span className="mx-8">AC Name : AGM Fitout Technical Services</span>
        </div>

        <div className="flex items-center justify-center whitespace-nowrap">
          <span>AC no: 0323111672001</span>
          <span className="mx-8">Iban : AE44 0400 0003 2311 1672 001 RAK Bank</span>
        </div>
      </div>
    </div>
  );
};

export default QuotationFooter;
