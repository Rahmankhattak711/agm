"use client";

import GlobalCreateMenu from "@/components/GlobalCreateMenu";
import { MenuIcon, SpinnerIcon } from "@/components/icons";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getPageMeta } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, checkAuth, loading } = useAuth();
  const pathname = usePathname();
  const { eyebrow, title } = getPageMeta(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      className="flex h-screen w-screen overflow-hidden print:h-auto print:w-full print:!bg-white print:!bg-none print:p-0 print:m-0 print:overflow-visible"
      style={{
        background:
          "radial-gradient(circle at 88% 8%,rgba(87,121,97,0.11),transparent 22%), linear-gradient(145deg,#f8f7f2 0%,#f2f4ef 48%,#f7f5ef 100%)",
      }}
    >
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible print:w-full print:!bg-white print:!bg-none print:p-0 print:m-0">
        <header className="relative z-30 flex-shrink-0 flex items-center justify-between gap-3 h-16 md:h-[72px] px-3.5 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs print:hidden">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex h-9 w-9 p-0 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
              aria-label="Open navigation menu"
            >
              <MenuIcon size={18} />
            </Button>

            <div className="flex flex-col justify-center min-w-0">
              {eyebrow && (
                <div className="hidden sm:flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                    {eyebrow}
                  </span>
                </div>
              )}
              <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <GlobalCreateMenu />

            {user && (
              <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
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

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8 print:p-0 print:m-0 print:!bg-white print:!bg-none print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
