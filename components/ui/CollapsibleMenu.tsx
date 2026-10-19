"use client";

import React, { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export interface CollapsibleMenuProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
  variant?: "card" | "bordered" | "subtle" | "ghost";
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  expandInPrint?: boolean;
}

export const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({
  title,
  subtitle,
  icon,
  badge,
  headerRight,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  variant = "card",
  className = "",
  headerClassName = "",
  contentClassName = "",
  expandInPrint = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const nextState = !open;
    if (!isControlled) {
      setInternalOpen(nextState);
    }
    if (onToggle) {
      onToggle(nextState);
    }
  };

  const variantStyles = {
    card: "bg-agm-card border border-agm-box-border rounded-2xl shadow-2xs overflow-hidden",
    bordered: "bg-white border border-agm-box-border rounded-xl overflow-hidden",
    subtle: "bg-agm-box-bg border border-agm-box-border/80 rounded-xl overflow-hidden",
    ghost: "border-b border-agm-box-border",
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer select-none group hover:bg-agm-box-bg/70 ${
          open && variant !== "ghost" ? "border-b border-agm-box-border/60" : ""
        } ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-agm-box-bg border border-agm-box-border/70 flex items-center justify-center text-agm-green shrink-0 group-hover:bg-agm-green-soft group-hover:text-agm-green-dark transition-colors">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-agm-text truncate">
                {title}
              </span>
              {badge && <span>{badge}</span>}
            </div>
            {subtitle && (
              <p className="text-[11px] text-agm-muted truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerRight && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mr-1"
            >
              {headerRight}
            </div>
          )}
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-agm-muted group-hover:text-agm-text group-hover:bg-agm-box-border/40 transition-all ${
              open ? "rotate-180 text-agm-green" : ""
            }`}
          >
            <ChevronDownIcon size={16} />
          </div>
        </div>
      </button>

      <div
        className={`${open ? "block" : "hidden"} ${
          expandInPrint ? "print:!block" : ""
        } p-4 sm:p-5 animate-in fade-in duration-150 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
};

export interface CollapsibleGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  children,
  className = "space-y-3",
}) => {
  return <div className={className}>{children}</div>;
};

export default CollapsibleMenu;
