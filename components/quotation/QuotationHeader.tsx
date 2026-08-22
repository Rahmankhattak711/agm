import React from "react";
import Image from "next/image";

export const QuotationHeader: React.FC = () => {
  return (
    <div className="flex items-start justify-between px-10 pt-8 pb-6 border-b border-slate-100 bg-white">
      <div className="flex flex-col items-start">
        <Image
          src="/assets/logo.png"
          alt="AGM Aesthetic House"
          width={150}
          height={150}
          sizes="100vh"
          quality={100}
          className="object-cover"
          priority
        />
      </div>
      <div className="text-right text-[12px] leading-5 text-slate-800 max-w-[440px]">
        <div className="font-bold text-[15px] mb-1 text-agm-green">
          A G M FITOUT TECHNICAL SERVICES L.L.C
        </div>
        <div>
          Sheikh Zayed Road, near Oasis Centre, Office No. 13-11 Building: Adel
          Mohammed Ali Jassim Al Marzouqi, Al Quoz First 1, Dubai, UAE
        </div>
        <div>
          Tel: +971 48 749839 | Mob: +971 50 340 7300 | TRN: 104094432200003
        </div>
      </div>
    </div>
  );
};

export default QuotationHeader;
