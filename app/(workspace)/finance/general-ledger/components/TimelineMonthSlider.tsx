"use client";

import React from "react";

export interface MonthItem {
  key: string; // e.g. "2026-04"
  label: string; // e.g. "Apr"
  year: number; // e.g. 2026
}

interface TimelineMonthSliderProps {
  months: MonthItem[];
  selectedRange: [string, string]; // [startMonthKey, endMonthKey]
  onChange: (range: [string, string]) => void;
}

export function TimelineMonthSlider({
  months,
  selectedRange,
  onChange,
}: TimelineMonthSliderProps) {
  const [startKey, endKey] = selectedRange;

  const startIdx = months.findIndex((m) => m.key === startKey);
  const endIdx = months.findIndex((m) => m.key === endKey);

  const handleMonthClick = (clickedKey: string) => {
    const clickedIdx = months.findIndex((m) => m.key === clickedKey);
    if (clickedIdx === -1) return;

    // If clicking before start, make it new start
    if (clickedIdx < startIdx) {
      onChange([clickedKey, endKey]);
    } else if (clickedIdx > endIdx) {
      // If clicking after end, make it new end
      onChange([startKey, clickedKey]);
    } else {
      // Clicking inside range toggles to single month or adjusts
      onChange([clickedKey, clickedKey]);
    }
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 overflow-x-auto">
      {/* Year Indicators */}
      <div className="flex justify-between text-xs font-semibold text-slate-500 px-1">
        <span>2025</span>
        <span className="text-[#5046e5] font-bold">2026</span>
        <span>2027</span>
      </div>

      {/* Months Scrubber Bar */}
      <div className="flex items-center min-w-[650px] gap-1 p-1 bg-white border border-slate-200 rounded-lg">
        {months.map((m, idx) => {
          const isSelected = idx >= startIdx && idx <= endIdx;
          const isBoundary = idx === startIdx || idx === endIdx;

          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleMonthClick(m.key)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-all select-none cursor-pointer ${
                isBoundary
                  ? "bg-[#5046e5] text-white font-bold shadow-2xs"
                  : isSelected
                  ? "bg-indigo-50 text-[#5046e5] font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
