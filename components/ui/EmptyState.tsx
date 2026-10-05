"use client";

import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`py-14 sm:py-16 px-4 flex flex-col items-center justify-center text-center select-none ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-base mb-2">
        {icon ? (
          <div className="text-slate-400 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
        ) : (
          "🗂"
        )}
      </div>

      <p className="text-sm font-bold text-slate-700">{title}</p>

      {description && (
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-1">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
