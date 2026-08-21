import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = "", containerClassName = "w-full", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${
              leftIcon ? "pl-9" : "px-3"
            } py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 ${
              error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string | number; label: string }>;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = "", containerClassName = "w-full", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium disabled:bg-slate-50 disabled:text-slate-400 ${
            error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
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
        {error && <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", containerClassName = "w-full", ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 ${
            error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
