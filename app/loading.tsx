"use client";

import { SpinnerIcon } from "@/components/icons";

export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shadow-md animate-pulse">
          <span className="text-white font-black text-sm tracking-wider">
            AGM
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <SpinnerIcon
            className="w-5 h-5 animate-spin text-emerald-800"
            strokeWidth={2.5}
          />
          <span className="text-xs font-bold text-slate-600 tracking-wide">
            Loading AGM...
          </span>
        </div>
      </div>
    </div>
  );
}
