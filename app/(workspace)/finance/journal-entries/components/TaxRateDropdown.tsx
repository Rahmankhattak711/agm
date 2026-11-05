"use client";

import React, { useState, useRef, useEffect } from "react";
import { TaxCategoryType } from "@/lib/services/accounting/tax-engine.service";

interface TaxRateOptionItem {
  code: TaxCategoryType;
  label: string;
  rate: number;
}

interface TaxGroup {
  category: string;
  options: TaxRateOptionItem[];
}

export const TAX_RATE_GROUPS: TaxGroup[] = [
  {
    category: "OUT OF SCOPE",
    options: [
      { code: "OUT_OF_SCOPE", label: "0% - Out of Scope", rate: 0 },
    ],
  },
  {
    category: "PURCHASES",
    options: [
      { code: "STANDARD_PURCHASES", label: "5% - VAT on Purchases", rate: 5 },
    ],
  },
  {
    category: "REVERSE CHARGE",
    options: [
      { code: "REVERSE_CHARGE", label: "5% - Reverse Charge", rate: 5 },
    ],
  },
  {
    category: "SALES",
    options: [
      { code: "ZERO_RATED", label: "0% - Zero-Rated Sales", rate: 0 },
      { code: "EXEMPT", label: "0% - Exempt", rate: 0 },
      { code: "STANDARD_SALES", label: "5% - VAT on Sales", rate: 5 },
    ],
  },
];

// Flat list for quick lookup
export const ALL_TAX_OPTIONS: TaxRateOptionItem[] = TAX_RATE_GROUPS.flatMap(
  (g) => g.options
);

interface TaxRateDropdownProps {
  value: TaxCategoryType;
  onChange: (value: TaxCategoryType) => void;
  disabled?: boolean;
}

export function TaxRateDropdown({
  value,
  onChange,
  disabled = false,
}: TaxRateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = ALL_TAX_OPTIONS.find((opt) => opt.code === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: TaxCategoryType) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Box matching screenshot */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white px-2.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer select-none flex items-center justify-between ${
          isOpen
            ? "border-2 border-[#5046e5] ring-1 ring-[#5046e5]/20 shadow-xs"
            : "border border-slate-200 hover:border-slate-300 text-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <span className="truncate font-medium text-slate-800">
          {selectedOption ? selectedOption.label : "Select"}
        </span>
      </div>

      {/* Modern Custom Dropdown Popover matching Image 2 & 3 */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-60 max-h-[310px] bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in-50 zoom-in-95 duration-100">
          {TAX_RATE_GROUPS.map((group, groupIdx) => (
            <div key={group.category} className="w-full">
              {/* Category Header */}
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                {group.category}
              </div>

              {/* Options in Category */}
              <div className="space-y-0.5 px-1">
                {group.options.map((opt) => {
                  const isSelected = opt.code === value;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => handleSelect(opt.code)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-slate-100/90 text-slate-900 font-semibold"
                          : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span>{opt.label}</span>

                      {/* VAT Glyph matching screenshot (double-V / tax emblem) */}
                      <svg
                        className={`w-3.5 h-3 shrink-0 ${
                          isSelected ? "text-slate-800" : "text-slate-600"
                        }`}
                        viewBox="0 0 16 12"
                        fill="currentColor"
                      >
                        <path d="M1.5 1.5L4.5 9.5L7.5 1.5H9L6 10.5H4L1 2.5V1.5H1.5ZM8.5 1.5L11.5 9.5L14.5 1.5H16L13 10.5H11L8 2.5V1.5H8.5Z" />
                      </svg>
                    </div>
                  );
                })}
              </div>

              {/* Divider between sections, except last */}
              {groupIdx < TAX_RATE_GROUPS.length - 1 && (
                <div className="border-b border-slate-100 my-1 mx-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

