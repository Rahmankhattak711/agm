"use client";

import GlobalCreateMenu from "@/components/GlobalCreateMenu";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  BuildingIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  MailIcon,
} from "@/components/icons";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getPageMeta } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RingLoader, PulseLoader } from "react-spinners";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, checkAuth, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { eyebrow, title } = getPageMeta(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-agm-bg select-none">
        <div className="relative flex flex-col items-center bg-white/90 backdrop-blur-md border border-agm-box-border px-8 py-7 rounded-2xl shadow-sm space-y-4 max-w-xs w-full text-center">
          <div className="relative flex items-center justify-center w-14 h-14">
            <RingLoader color="#28633a" size={54} speedMultiplier={0.9} />
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-agm-green-2 via-agm-green to-agm-sidebar flex items-center justify-center shadow-xs">
              <span className="text-white font-black text-[11px] tracking-wider">
                AGM
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-agm-text">
              Verifying Session
            </div>
            <p className="text-[11px] text-agm-muted">
              Connecting to AGM workspace...
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center">
            <PulseLoader
              color="#28633a"
              size={4}
              margin={3}
              speedMultiplier={0.8}
            />
          </div>
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
    : "RK";

  const roleDisplay =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role
        ? user.role
            .replace("_", " ")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase())
        : "Administrator";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/commercial/sales-invoices?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden print:h-auto print:w-full print:!bg-white print:!bg-none print:p-0 print:m-0 print:overflow-visible"
      style={{
        background:
          "radial-gradient(circle at 88% 8%,rgba(87,121,97,0.11),transparent 22%), linear-gradient(145deg,#f8f7f2 0%,#f2f4ef 48%,#f7f5ef 100%)",
      }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible print:w-full print:!bg-white print:!bg-none print:p-0 print:m-0">
        <header className="relative z-30 flex-shrink-0 flex items-center justify-between gap-3 h-14 md:h-16 px-4 sm:px-6 border-b border-agm-box-border/80 bg-white shadow-2xs print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex h-8 w-8 p-0 shrink-0 items-center justify-center rounded-lg border border-agm-box-border bg-white text-agm-text hover:bg-agm-box-bg transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <MenuIcon size={16} />
            </Button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 min-w-0"
            >
              <span className="text-agm-muted font-medium text-xs sm:text-[13px] hover:text-agm-text transition select-none">
                {eyebrow || "Overview"}
              </span>
              <ChevronRightIcon
                size={12}
                className="text-agm-subtle shrink-0 select-none"
              />
              <span className="text-agm-text font-bold text-xs sm:text-[13px] truncate select-none">
                {title || "Executive Dashboard"}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <GlobalCreateMenu />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-agm-box-bg border border-transparent hover:border-agm-box-border transition cursor-pointer text-left"
                aria-expanded={userMenuOpen}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-agm-navy text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {userInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-agm-text leading-tight truncate max-w-[140px]">
                    {user?.fullName || "Rahman Khattak"}
                  </span>
                  <span className="text-[11px] text-agm-muted font-normal">
                    {roleDisplay}
                  </span>
                </div>
                <ChevronDownIcon
                  size={12}
                  className={`text-agm-subtle transition-transform duration-200 hidden sm:block ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-agm-box-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 bg-gradient-to-b from-slate-50/90 to-white border-b border-agm-box-border/60">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-agm-navy text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {userInitials}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user?.fullName || "Rahman Khattak"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MailIcon
                            size={11}
                            className="shrink-0 text-slate-400"
                          />
                          <span className="truncate">
                            {user?.email || "rahmankhattak796@gmail.com"}
                          </span>
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-agm-green border border-emerald-200/80">
                            <ShieldCheckIcon
                              size={11}
                              className="text-agm-green shrink-0"
                            />
                            <span>{roleDisplay}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-b border-agm-box-border/50 bg-slate-50/50 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <BuildingIcon size={12} className="text-slate-400" />{" "}
                        Company
                      </span>
                      <span className="font-semibold text-slate-800">
                        AGM Fitout LLC
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <CheckCircle2Icon
                          size={12}
                          className="text-emerald-500"
                        />{" "}
                        Status
                      </span>
                      <span className="font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded text-[10px]">
                        Active Session
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50/80 border-t border-agm-box-border/60">
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full justify-center"
                      icon={<LogoutIcon className="w-3.5 h-3.5" />}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8 print:p-0 print:m-0 print:!bg-white print:!bg-none print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
