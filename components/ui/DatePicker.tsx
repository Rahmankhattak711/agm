"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/icons";

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  labelClassName?: string;
  containerClassName?: string;
  align?: "left" | "right";
  format?: "display" | "iso";
  id?: string;
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

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseAnyDate(str?: string): Date | null {
  if (!str) return null;
  const normalized = str.replace(/Sept/i, "Sep").trim();
  const parsed = Date.parse(normalized);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }
  const dmY = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmY) {
    const day = parseInt(dmY[1], 10);
    const month = parseInt(dmY[2], 10) - 1;
    const year = parseInt(dmY[3], 10);
    return new Date(year, month, day);
  }
  return null;
}

function formatDateString(d: Date): string {
  const day = d.getDate();
  const month = MONTH_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
  label,
  required = false,
  error,
  labelClassName,
  containerClassName = "",
  align = "left",
  format,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => parseAnyDate(value) || new Date(), [value]);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const d = parseAnyDate(value);
    if (d) {
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const isIsoFormat =
    format === "iso" || (!format && /^\d{4}-\d{2}-\d{2}$/.test(value));

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(
      isIsoFormat ? formatIsoDate(selected) : formatDateString(selected),
    );
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(isIsoFormat ? formatIsoDate(today) : formatDateString(today));
    setIsOpen(false);
  };

  const selectedDateObj = useMemo(() => parseAnyDate(value), [value]);
  const alignClass =
    align === "right" ? "right-0 left-auto" : "left-0 right-auto";

  return (
    <div
      className={`relative inline-block w-full ${containerClassName}`}
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={id}
          className={
            labelClassName || "block text-xs font-bold text-slate-700 mb-1"
          }
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div
        className={`flex items-center justify-between w-full px-3 ${
          label
            ? "py-2 rounded-xl bg-white border border-slate-200 shadow-2xs"
            : "py-1 rounded-full bg-agm-card border border-agm-box-border"
        } text-xs hover:border-agm-green focus-within:border-agm-green focus-within:ring-2 focus-within:ring-agm-green/20 transition-all ${
          error
            ? "border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/20"
            : ""
        } ${isOpen ? "ring-2 ring-agm-green/20 border-agm-green" : ""} ${
          disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
        } ${className}`}
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-0 p-0"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className="p-1 text-slate-400 hover:text-agm-green transition-colors cursor-pointer shrink-0"
          title="Pick date from calendar"
        >
          <CalendarIcon size={14} className="text-agm-green" />
        </button>
      </div>

      {error && (
        <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>
      )}

      {isOpen && (
        <div
          className={`absolute ${alignClass} top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeftIcon size={13} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRightIcon size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-1"
                title="Close calendar"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_SHORT.map((d) => (
              <span
                key={d}
                className="text-[10px] font-bold text-slate-400 uppercase"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} className="h-7 w-7" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDateObj &&
                selectedDateObj.getFullYear() === currentYear &&
                selectedDateObj.getMonth() === currentMonth &&
                selectedDateObj.getDate() === day;

              const isToday =
                new Date().getFullYear() === currentYear &&
                new Date().getMonth() === currentMonth &&
                new Date().getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all mx-auto cursor-pointer ${
                    isSelected
                      ? "bg-agm-green text-white font-bold shadow-xs"
                      : isToday
                        ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-300"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-agm-green hover:underline font-bold cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
              >
                <CloseIcon size={11} /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
