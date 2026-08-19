import React, { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  loading = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1.5 font-bold transition rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3.5 py-2 text-xs",
    lg: "px-4 py-2.5 text-xs shadow-sm",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white shadow-sm",
    secondary:
      "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200/80",
    outline:
      "border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 bg-white",
    danger:
      "border border-red-200 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700",
    dark: "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="w-3.5 h-3.5 animate-spin"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-1.39-7" />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
