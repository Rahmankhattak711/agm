"use client";

import Link from "next/link";
import AgmLogo from "@/components/AgmLogo";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#f6f5f0] px-4 py-12 font-sans overflow-hidden">
      
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-slate-900/5 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center shadow-xl shadow-slate-900/5">
        
        <div className="flex justify-center mb-6">
          <AgmLogo size="md" collapsed={false} />
        </div>

        <div className="relative mx-auto mb-4 inline-flex items-center justify-center">
          <span className="font-mono text-7xl sm:text-8xl font-black tracking-tighter text-slate-900/10 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-8 ring-emerald-50/50 border border-emerald-200 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                className="h-6 w-6"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
          Page Not Found
        </p>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Lost in the Workspace?
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-sm mx-auto">
          The ERP module, financial statement, or page you requested could not be located or has been relocated.
        </p>

        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 transition group"
          >
            <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
              Main Dashboard
              <span className="text-slate-400 group-hover:text-emerald-700">→</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Overview & key metrics</p>
          </Link>

          <Link
            href="/finance/reports"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 transition group"
          >
            <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
              Quotations & Reports
              <span className="text-slate-400 group-hover:text-emerald-700">→</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Financial statements</p>
          </Link>

          <Link
            href="/operations/attendance"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 transition group"
          >
            <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
              Daily Attendance
              <span className="text-slate-400 group-hover:text-emerald-700">→</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Staff timesheets</p>
          </Link>

          <Link
            href="/inventory/products"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100 hover:border-emerald-200 transition group"
          >
            <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
              Product Catalog
              <span className="text-slate-400 group-hover:text-emerald-700">→</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Inventory & items</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
            >
              Return to Dashboard
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
