import React from "react";

export const QuotationFooter: React.FC = () => {
  return (
    <div
      className="mt-4 relative w-full bg-transparent print-avoid-break overflow-hidden"
      style={{ height: 70 }}
    >
      <svg
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <polygon points="0,0 150,0 90,100 0,100" fill="#22222e" />
        <polygon points="166,0 850,0 790,100 106,100" fill="#28633a" />
        <polygon points="866,0 1000,0 1000,100 806,100" fill="#22222e" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[10px] sm:text-[11px] font-semibold leading-4 text-center px-4">
        <div className="flex items-center justify-center whitespace-nowrap">
          <span>VAT: 104094432200003</span>
          <span className="mx-6">
            Company: AGM Fitout Technical Services LLC
          </span>
        </div>

        <div className="flex items-center justify-center whitespace-nowrap text-[9.5px] opacity-90 mt-0.5">
          Sheikh Zayed Road, near Oasis Centre, Office No. 13-11, Adel Mohammed <br />
          Ali Jassim Bldg, Al Quoz 1, Dubai, UAE
        </div>
      </div>
    </div>
  );
};

export default QuotationFooter;
