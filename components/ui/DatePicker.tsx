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

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
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
    onChange(formatDateString(selected));
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange(formatDateString(today));
    setIsOpen(false);
  };

  const selectedDateObj = useMemo(() => parseAnyDate(value), [value]);

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-1 text-xs bg-agm-card border border-agm-box-border rounded-full hover:border-agm-green focus-within:border-agm-green focus-within:ring-2 focus-within:ring-agm-green/20 transition-all ${
          isOpen ? "ring-2 ring-agm-green/20 border-agm-green" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed bg-agm-box-bg" : ""} ${className}`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none text-xs font-semibold text-agm-text placeholder:text-agm-muted focus:ring-0 p-0"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className="p-1 text-agm-muted hover:text-agm-green transition-colors cursor-pointer shrink-0"
          title="Pick date from calendar"
        >
          <CalendarIcon size={14} className="text-agm-green" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-agm-card rounded-2xl shadow-2xl border border-agm-box-border p-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-agm-box-border">
            <span className="text-xs font-bold text-agm-text">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-agm-box-bg text-agm-muted hover:text-agm-text transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeftIcon size={13} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-agm-box-bg text-agm-muted hover:text-agm-text transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRightIcon size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-agm-box-bg text-agm-muted hover:text-agm-text transition-colors cursor-pointer ml-1"
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
                className="text-[10px] font-bold text-agm-muted uppercase"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} className="h-6 w-6" />
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
                        ? "bg-agm-green-soft text-agm-green font-bold border border-agm-green/30"
                        : "text-agm-text hover:bg-agm-box-bg"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-agm-box-border text-[11px]">
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
                className="text-agm-muted hover:text-agm-text cursor-pointer flex items-center gap-0.5"
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
