"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { formatUaePhone, UAE_PHONE_PREFIX } from "@/lib/utils/phone";
import { Phone } from "lucide-react";

export interface UaePhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  value?: string | null;
  onChange?: (val: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
}

export const UaePhoneInput = forwardRef<HTMLInputElement, UaePhoneInputProps>(
  (
    {
      label,
      error,
      value,
      onChange,
      className = "",
      containerClassName = "w-full",
      labelClassName = "block text-xs font-bold text-agm-text mb-1",
      required,
      id,
      name,
      placeholder = "+971 50 000 0000",
      ...props
    },
    ref,
  ) => {
    // Keep local formatted state
    const [displayValue, setDisplayValue] = useState<string>(() => {
      if (!value) return UAE_PHONE_PREFIX;
      return formatUaePhone(value);
    });

    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(value ? formatUaePhone(value) : UAE_PHONE_PREFIX);
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // If user deletes everything or tries to remove +971
      if (!raw || raw.trim() === "+" || raw.trim() === "+9" || raw.trim() === "+97") {
        setDisplayValue(UAE_PHONE_PREFIX);
        if (onChange) onChange(UAE_PHONE_PREFIX);
        return;
      }

      const formatted = formatUaePhone(raw);
      setDisplayValue(formatted);
      if (onChange) onChange(formatted);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!displayValue || displayValue === UAE_PHONE_PREFIX) {
        setDisplayValue(UAE_PHONE_PREFIX);
      }
      if (props.onFocus) props.onFocus(e);
    };

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={id || name} className={labelClassName}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {/* UAE Flag Badge / Country Indicator */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none text-slate-400">
            <span className="text-sm leading-none" title="United Arab Emirates (+971)">🇦🇪</span>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="h-4 w-px bg-slate-200 ml-0.5" />
          </div>

          <input
            ref={ref}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={17}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={`w-full pl-16 pr-3 py-2 text-xs rounded-xl border border-agm-box-border bg-white font-mono focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green text-agm-text placeholder:text-agm-subtle ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>
    );
  },
);

UaePhoneInput.displayName = "UaePhoneInput";
