import React from "react";
import Image from "next/image";

interface QuotationHeaderProps {
  className?: string;
}

export const QuotationHeader: React.FC<QuotationHeaderProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex items-start justify-between px-10 pt-8 pb-6 print:px-8 print:pt-3 print:pb-2 border-b border-slate-100 bg-white ${className}`}
    >
      <div className="flex flex-col items-start">
        <Image
          src="/assets/logo.png"
          alt="AGM Aesthetic House"
          width={160}
          height={160}
          sizes="100vh"
          quality={100}
          className="object-cover print:w-[160px] print:h-auto"
          priority
        />
      </div>
      <div className="text-right text-[12px] print:text-[11.5px] leading-5 print:leading-snug text-slate-800 max-w-[500px] print:max-w-[500px]">
        <div className="font-bold text-[22px] print:text-[22px] mb-1 print:mb-1 text-agm-green">
          A G M FITOUT TECHNICAL SERVICES L.L.C
        </div>
        <div className="text-slate-700">
          Sheikh Zayed Road, near Oasis Centre, Office No. 13-11 <br /> Building: Adel
          Mohammed Ali Jassim Al Marzouqi, <br /> Al Quoz First 1, Dubai, UAE
        </div>
        <div className="font-medium text-slate-900 mt-0.5">
          Tel: +971 48 749839 | Mob: +971 50 340 7300 | TRN: 104094432200003
        </div>
      </div>
    </div>
  );
};

export default QuotationHeader;
