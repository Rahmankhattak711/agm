"use client";

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { getPageMeta } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { checkAuth, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { eyebrow, title } = getPageMeta(pathname);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#28633a"
            strokeWidth={2.5}
            className="w-8 h-8 animate-spin"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-1.39-7" />
          </svg>
          <span className="text-xs font-semibold text-slate-500">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 88% 8%,rgba(87,121,97,0.11),transparent 22%), linear-gradient(145deg,#f8f7f2 0%,#f2f4ef 48%,#f7f5ef 100%)",
      }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between gap-5 min-h-[78px] px-7 border-b border-slate-900/10 bg-white/84 backdrop-blur-[18px] shadow-[0_10px_28px_rgba(38,59,77,0.045)]">
          <div>
            <p className="m-0 text-[#28633a] text-[10px] font-black uppercase tracking-widest">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-[#263b4d] text-2xl font-black -tracking-tighter">
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="flex items-center gap-1.75 px-3 py-2.25 rounded-xl border border-slate-900/14 bg-white/76 text-slate-700 cursor-pointer text-xs font-bold hover:bg-white transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              className="w-3.5 h-3.5"
            >
              <path d="M20 11a8 8 0 1 0 2 5.4" />
              <polyline points="20 4 20 11 13 11" />
            </svg>
            Refresh
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
