"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export interface BackButtonConfig {
  label?: string;
  onClick?: () => void;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  backButton?: React.ReactNode | BackButtonConfig;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
  backButton,
  className = "",
  children,
}) => {
  let renderedBackButton: React.ReactNode = null;
  if (backButton) {
    if (
      React.isValidElement(backButton) ||
      typeof backButton === "string" ||
      typeof backButton === "number"
    ) {
      renderedBackButton = backButton;
    } else if (typeof backButton === "object" && backButton !== null) {
      const config = backButton as BackButtonConfig;
      if (config.onClick) {
        renderedBackButton = (
          <button
            type="button"
            onClick={config.onClick}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeftIcon size={16} />
            {config.label && <span>{config.label}</span>}
          </button>
        );
      } else if (config.href) {
        renderedBackButton = (
          <Link
            href={config.href}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeftIcon size={16} />
            {config.label && <span>{config.label}</span>}
          </Link>
        );
      }
    }
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden ${className}`}
    >
      <div className="flex items-center gap-3">
        {renderedBackButton}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {(actions || children) && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
