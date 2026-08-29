"use client";

import React from "react";
import Image from "next/image";

interface PrintHeaderProps {
  reportTitle?: string;
  documentRef?: string;
  subtitle?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  reportTitle,
  documentRef,
  subtitle,
}) => {
  return (
    <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-start">
          <Image
            src="/assets/logo.png"
            alt="AGM Aesthetic House"
            width={140}
            height={70}
            className="object-contain"
            priority
          />
          <span className="text-[10px] text-slate-500 mt-1 font-bold tracking-wider uppercase">
            Aesthetic House ERP System
          </span>
        </div>

        <div className="text-right text-[11px] leading-4 text-slate-800 max-w-[440px]">
          <div className="font-black text-[14px] text-[#28633a] tracking-tight mb-0.5">
            A G M FITOUT TECHNICAL SERVICES L.L.C
          </div>
          <div>
            Sheikh Zayed Road, near Oasis Centre, Office No. 13-11 Building: Adel
            Mohammed Ali Jassim Al Marzouqi, Al Quoz First 1, Dubai, UAE
          </div>
          <div className="font-semibold mt-0.5 text-slate-900">
            Tel: +971 48 749839 | Mob: +971 50 340 7300 | TRN: 104094432200003
          </div>
        </div>
      </div>

      {(reportTitle || documentRef) && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {reportTitle || "Official Financial Statement"}
            </h1>
            {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
          </div>
          <div className="text-right text-xs">
            {documentRef && (
              <p className="font-mono font-bold text-slate-800">
                Ref: {documentRef}
              </p>
            )}
            <p className="text-[10px] text-slate-500 font-mono">
              Printed: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const PrintFooter: React.FC = () => {
  return (
    <div className="hidden print:block fixed bottom-0 left-0 right-0 w-full overflow-hidden z-50">
      <div className="relative w-full h-[60px]">
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="w-full h-full block"
        >
          <polygon points="0,0 150,0 90,100 0,100" fill="#22222e" />
          <polygon points="166,0 850,0 790,100 106,100" fill="#28633a" />
          <polygon points="866,0 1000,0 1000,100 806,100" fill="#22222e" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-[10px] font-semibold leading-3 text-center px-4">
          <div className="flex items-center justify-center whitespace-nowrap">
            <span>TRN: 104094432200003</span>
            <span className="mx-4">|</span>
            <span>AGM FITOUT TECHNICAL SERVICES LLC</span>
            <span className="mx-4">|</span>
            <span>info@agmfitout.com</span>
          </div>
          <div className="text-[8.5px] opacity-80 mt-1">
            Sheikh Zayed Road, Adel Mohammed Ali Jassim Bldg, Al Quoz 1, Dubai, UAE
          </div>
        </div>
      </div>
    </div>
  );
};
