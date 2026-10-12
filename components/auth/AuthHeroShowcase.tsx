"use client";

import AgmLogo from "@/components/AgmLogo";
import {
  BuildingIcon,
  CheckCircle2Icon,
  LandmarkIcon,
  PaintbrushIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "@/components/icons";

interface AuthHeroShowcaseProps {
  pageType?: "login" | "signup";
}

export default function AuthHeroShowcase({
  pageType = "login",
}: AuthHeroShowcaseProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-[#0d1b2a] p-10 xl:p-14 flex-col justify-between overflow-hidden select-none">
      {/* Background radial aura & mesh glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle architectural blueprint grid */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#dff7e6_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient decorative geometric arcs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 800"
          className="w-full h-full object-cover"
        >
          <circle
            cx="200"
            cy="200"
            r="300"
            stroke="#a3e6ba"
            strokeWidth="1"
            fill="none"
            strokeDasharray="6 6"
          />
          <circle
            cx="800"
            cy="600"
            r="400"
            stroke="#a3e6ba"
            strokeWidth="1"
            fill="none"
            strokeDasharray="8 8"
          />
          <line
            x1="50"
            y1="100"
            x2="950"
            y2="700"
            stroke="#a3e6ba"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Top Header: Logo + Live Compliance Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/30 inline-flex items-center">
          <AgmLogo size="md" theme="dark" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>UAE FTA VAT 5% Compliant</span>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 my-auto py-8 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-5 shadow-inner">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Aesthetic House Fitout &bull; Enterprise ERP</span>
        </div>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
          Precision Engineering. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
            Enterprise Intelligence.
          </span>
        </h1>

        <p className="mt-3.5 text-sm text-slate-300 leading-relaxed max-w-lg">
          The unified management suite for Dubai&apos;s leading fitout
          operations. Streamlining commercial sales, double-entry financial
          ledgers, procurement, and real-time project costing.
        </p>

        {/* Live Glass Feature Showcase Cards */}
        <div className="mt-8 space-y-3.5">
          {/* Card 1: Live Commercial & VAT Metric */}
          <div className="group p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <LandmarkIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Commercial &amp; General Ledger
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>Tax Invoices &bull; SOA Tracking</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      5% VAT Auto
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                  <TrendingUpIcon className="w-3.5 h-3.5" />
                  <span>Real-time</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Double-entry audit
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Fitout Project Cost Tracking */}
          <div className="group p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                  <BuildingIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Fitout Projects &amp; Site Costing
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Budget vs Actual Materials &amp; Joinery
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <PaintbrushIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Job Costing</span>
              </div>
            </div>
            {/* Visual Progress Bar */}
            <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-1.5 rounded-full w-[84%]" />
            </div>
          </div>

          {/* Quick Pillars Checklist */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs text-slate-200">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Multi-Warehouse Stock</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Emirates ID &amp; WPS Ready</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Purchase Order &amp; GRN</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Role-Based Permissions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Corporate Compliance */}
      <div className="relative z-10 text-xs text-slate-400 flex flex-wrap items-center justify-between border-t border-white/10 pt-5 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          <span>
            &copy; {new Date().getFullYear()} AGM Technical Services LLC
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Dubai, UAE</span>
          <span>&bull;</span>
          <span>FTA Registered</span>
          <span>&bull;</span>
          <span>256-Bit TLS</span>
        </div>
      </div>
    </div>
  );
}
