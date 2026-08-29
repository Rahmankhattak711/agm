"use client";

import GlobalCreateMenu from "@/components/GlobalCreateMenu";
import { SpinnerIcon } from "@/components/icons";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { getPageMeta } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, checkAuth, loading } = useAuth();
  const pathname = usePathname();
  const { eyebrow, title } = getPageMeta(pathname);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon
            className="w-8 h-8 animate-spin text-[#28633a]"
            strokeWidth={2.5}
          />
          <span className="text-xs font-semibold text-slate-500">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AG";

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
        <header className="relative z-50 flex-shrink-0 flex items-center justify-between gap-4 h-[72px] px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col justify-center">
            {eyebrow && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  {eyebrow}
                </span>
              </div>
            )}
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <GlobalCreateMenu />

            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white font-black text-xs flex items-center justify-center shadow-2xs border border-emerald-700/40 select-none">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                    {user.role ? user.role.replace("_", " ") : "Member"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
