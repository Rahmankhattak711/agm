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
    <div
      className="rounded-xl p-3 space-y-2 overflow-x-auto font-sans"
      style={{
        backgroundColor: "#f4f7fb",
        border: "1px solid #cbd5e1",
      }}
    >
      {/* Year Indicators */}
      <div className="flex justify-between text-[11px] font-normal text-slate-500 px-1">
        <span>2025</span>
        <span className="font-medium" style={{ color: "#1d4ed8" }}>
          2026
        </span>
        <span>2027</span>
      </div>

      {/* Months Scrubber Bar */}
      <div
        className="flex items-center min-w-[650px] gap-1 p-1 bg-white rounded-lg"
        style={{ border: "1px solid #cbd5e1" }}
      >
        {months.map((m, idx) => {
          const isSelected = idx >= startIdx && idx <= endIdx;
          const isBoundary = idx === startIdx || idx === endIdx;

          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleMonthClick(m.key)}
              style={
                isBoundary
                  ? {
                      backgroundColor: "#1d4ed8",
                      color: "#ffffff",
                      border: "1px solid #1e40af",
                    }
                  : isSelected
                  ? {
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                    }
                  : undefined
              }
              className={`flex-1 py-1.5 text-[11px] rounded-md transition-all select-none cursor-pointer ${
                isBoundary
                  ? "font-medium"
                  : isSelected
                  ? "font-medium"
                  : "text-slate-500 font-normal hover:text-slate-800 hover:bg-slate-50"
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
