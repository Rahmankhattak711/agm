"use client";

import React from "react";
import { Clock, AlertCircle } from "lucide-react";

export interface AgingBucket {
  label: string;
  daysRange: string;
  amount: number;
  count: number;
  color: string;
  badgeBg: string;
}

export interface AgingBucketCardProps {
  title: string;
  subtitle?: string;
  buckets: AgingBucket[];
  totalOverdue: number;
  formatCurrency?: (val: number) => string;
}

export const AgingBucketCard: React.FC<AgingBucketCardProps> = ({
  title,
  subtitle,
  buckets,
  totalOverdue,
  formatCurrency = (v) => `AED ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}) => {
  const totalAmount = Math.max(
    buckets.reduce((sum, b) => sum + b.amount, 0),
    1,
  );

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Clock size={16} />
            </span>
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Total Open:</span>
          <span className="text-sm font-black font-mono text-slate-900">
            {formatCurrency(totalOverdue)}
          </span>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5">
        {buckets.map((b, i) => {
          const pct = Math.max((b.amount / totalAmount) * 100, 0);
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: b.color,
              }}
              title={`${b.label}: ${formatCurrency(b.amount)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Grid of 4 Aging Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {buckets.map((b, idx) => {
          const pct = ((b.amount / totalAmount) * 100).toFixed(1);
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">
                  {b.label}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: b.badgeBg, color: b.color }}
                >
                  {b.daysRange}
                </span>
              </div>

              <div>
                <p className="text-base font-black font-mono text-slate-900">
                  {formatCurrency(b.amount)}
                </p>
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-0.5">
                  <span>{b.count} invoices</span>
                  <span className="font-bold">{pct}% of total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgingBucketCard;
