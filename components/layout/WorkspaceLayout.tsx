"use client";

import GlobalCreateMenu from "@/components/GlobalCreateMenu";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
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

          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl mx-4 hidden md:block"
          >
            <div className="relative flex items-center">
              <SearchIcon
                size={14}
                className="absolute left-3 text-agm-subtle pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything... (e.g. invoice, customer, account)"
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-agm-box-border bg-agm-box-bg/50 hover:bg-white focus:bg-white text-xs text-agm-text placeholder:text-agm-subtle focus:outline-none focus:border-agm-green focus:ring-2 focus:ring-agm-green/10 transition-all shadow-2xs"
              />
            </div>
          </form>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <GlobalCreateMenu />

            <button
              type="button"
              title="Help & Support"
              onClick={() => router.push("/finance/reports")}
              className="w-8 h-8 rounded-full border border-agm-box-border flex items-center justify-center text-agm-muted hover:text-agm-text hover:bg-agm-box-bg transition cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-1.5 py-1 rounded-xl hover:bg-agm-box-bg transition cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-full bg-agm-navy text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-agm-text leading-tight">
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
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-agm-box-border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-agm-box-border/60">
                    <p className="text-xs font-bold text-agm-text truncate">
                      {user?.fullName || "Rahman Khattak"}
                    </p>
                    <p className="text-[11px] text-agm-muted truncate">
                      {user?.email || "admin@agm.ae"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                  >
                    <LogoutIcon className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
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
