"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DateRange {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
}

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate = "",
  endDate = "",
  onChange,
  placeholder = "Select Date Range",
  className = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection state while popover is open
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Current view calendar month
  const initialYear = startDate
    ? Number(startDate.split("-")[0])
    : new Date().getFullYear();
  const initialMonth = startDate
    ? Number(startDate.split("-")[1]) - 1
    : new Date().getMonth();

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const clickedDate = toDateString(new Date(currentYear, currentMonth, day));

    if (!tempStart || (tempStart && tempEnd)) {
      // First click: start new range
      setTempStart(clickedDate);
      setTempEnd("");
    } else if (tempStart && !tempEnd) {
      // Second click: set end range
      if (clickedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange({ startDate: tempStart, endDate: tempEnd });
      setIsOpen(false);
    } else if (tempStart && !tempEnd) {
      onChange({ startDate: tempStart, endDate: tempStart });
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStart("");
    setTempEnd("");
    onChange({ startDate: "", endDate: "" });
  };

  const applyPreset = (type: string) => {
    const now = new Date();
    let s = "";
    let e = "";

    if (type === "THIS_MONTH") {
      s = toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
      e = toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (type === "LAST_MONTH") {
      s = toDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      e = toDateString(new Date(now.getFullYear(), now.getMonth(), 0));
    } else if (type === "THIS_YEAR") {
      s = toDateString(new Date(now.getFullYear(), 0, 1));
      e = toDateString(new Date(now.getFullYear(), 11, 31));
    } else if (type === "LAST_YEAR") {
      s = toDateString(new Date(now.getFullYear() - 1, 0, 1));
      e = toDateString(new Date(now.getFullYear() - 1, 11, 31));
    } else if (type === "Q1") {
      s = toDateString(new Date(now.getFullYear(), 0, 1));
      e = toDateString(new Date(now.getFullYear(), 2, 31));
    } else if (type === "Q2") {
      s = toDateString(new Date(now.getFullYear(), 3, 1));
      e = toDateString(new Date(now.getFullYear(), 5, 30));
    } else if (type === "Q3") {
      s = toDateString(new Date(now.getFullYear(), 6, 1));
      e = toDateString(new Date(now.getFullYear(), 8, 30));
    } else if (type === "Q4") {
      s = toDateString(new Date(now.getFullYear(), 9, 1));
      e = toDateString(new Date(now.getFullYear(), 11, 31));
    }

    if (s && e) {
      setTempStart(s);
      setTempEnd(e);
      const sYear = Number(s.split("-")[0]);
      const sMonth = Number(s.split("-")[1]) - 1;
      setCurrentYear(sYear);
      setCurrentMonth(sMonth);
      onChange({ startDate: s, endDate: e });
      setIsOpen(false);
    }
  };

  const isSelectedRange = (day: number) => {
    const dateStr = toDateString(new Date(currentYear, currentMonth, day));
    const effectiveEnd = tempEnd || hoverDate;

    const isStart = tempStart === dateStr;
    const isEnd = tempEnd === dateStr;
    const inRange =
      tempStart && effectiveEnd
        ? (dateStr > tempStart && dateStr < effectiveEnd) ||
          (dateStr < tempStart && dateStr > effectiveEnd)
        : false;

    return { isStart, isEnd, inRange };
  };

  const isToday = (day: number) => {
    const today = toDateString(new Date());
    return toDateString(new Date(currentYear, currentMonth, day)) === today;
  };

  const displayText =
    startDate && endDate
      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
      : startDate
        ? `${formatDisplayDate(startDate)} - Select end`
        : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none bg-white text-slate-800 hover:border-slate-300 shadow-2xs ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
            : startDate
              ? "border-emerald-400 bg-emerald-50/30 text-emerald-950 font-bold"
              : "border-slate-200"
        }`}
      >
        <Calendar
          size={14}
          className={startDate ? "text-emerald-700" : "text-slate-400"}
        />
        <span className="whitespace-nowrap">{displayText}</span>

        {startDate && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer"
            title="Clear date range"
          >
            <X size={12} />
          </span>
        )}

        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-[330px] sm:w-[440px] max-w-[calc(100vw-2rem)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Presets Sidebar */}
              <div className="sm:w-36 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-3 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 hidden sm:block">
                  Quick Presets
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset("THIS_YEAR")}
                  className="px-2.5 py-1.5 text-xs text-left font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  This Year ({new Date().getFullYear()})
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("LAST_YEAR")}
                  className="px-2.5 py-1.5 text-xs text-left font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Last Year ({new Date().getFullYear() - 1})
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("THIS_MONTH")}
                  className="px-2.5 py-1.5 text-xs text-left font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("LAST_MONTH")}
                  className="px-2.5 py-1.5 text-xs text-left font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Last Month
                </button>
                <div className="border-t border-slate-100 my-1 hidden sm:block" />
                <div className="grid grid-cols-2 gap-1">
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => applyPreset(q)}
                      className="px-2 py-1 text-center text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Calendar Month */}
              <div className="flex-1">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(Number(e.target.value))}
                      className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(Number(e.target.value))}
                      className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 10 }, (_, i) => 2020 + i).map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-bold text-slate-400"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-7 w-7" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dateStr = toDateString(
                      new Date(currentYear, currentMonth, day),
                    );
                    const { isStart, isEnd, inRange } = isSelectedRange(day);
                    const today = isToday(day);

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={() => setHoverDate(dateStr)}
                        onMouseLeave={() => setHoverDate(null)}
                        className={`h-7 w-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isStart || isEnd
                            ? "bg-emerald-700 text-white font-bold shadow-xs scale-105"
                            : inRange
                              ? "bg-emerald-100/70 text-emerald-950 font-bold"
                              : today
                                ? "border border-emerald-500 text-emerald-800 font-bold hover:bg-emerald-50"
                                : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {tempStart && tempEnd ? (
                      <span className="font-semibold text-slate-800">
                        {formatDisplayDate(tempStart)} →{" "}
                        {formatDisplayDate(tempEnd)}
                      </span>
                    ) : tempStart ? (
                      <span>Pick end date</span>
                    ) : (
                      <span>Pick start date</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={!tempStart}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={12} />
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
