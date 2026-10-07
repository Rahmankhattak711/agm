"use client";

import React, {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightElement,
      className = "",
      containerClassName = "w-full",
      labelClassName = "block text-xs font-bold text-agm-text mb-1",
      id,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={id || props.name} className={labelClassName}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-subtle pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full ${
              leftIcon ? "pl-9" : "px-3"
            } ${rightElement ? "pr-10" : "px-3"} py-2 text-xs rounded-xl border border-agm-box-border bg-white focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green text-agm-text disabled:bg-agm-box-bg disabled:text-agm-subtle placeholder:text-agm-subtle ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : ""
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-agm-subtle flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string | number; label: string }>;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      children,
      className = "",
      containerClassName = "w-full",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xs font-bold text-agm-text mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 text-xs rounded-xl border border-agm-box-border bg-white focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green text-agm-text font-medium disabled:bg-agm-box-bg disabled:text-agm-subtle ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : ""
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, className = "", containerClassName = "w-full", ...props },
    ref,
  ) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xs font-bold text-agm-text mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 text-xs rounded-xl border border-agm-box-border bg-white focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green text-agm-text disabled:bg-agm-box-bg disabled:text-agm-subtle placeholder:text-agm-subtle ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
