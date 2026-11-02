"use client";

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
  UserAdminIcon,
  ReportsIcon,
} from "@/components/icons";
import Sidebar from "@/components/Sidebar";
import { Button, GlobalLoading } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getPageMeta } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
    return <GlobalLoading fullScreen={true} />;
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
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-agm-box-bg border border-transparent hover:border-agm-box-border transition-all cursor-pointer text-left group"
                aria-expanded={userMenuOpen}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-agm-sidebar text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-agm-box-border/60 group-hover:ring-agm-box-border transition-all">
                    {userInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-agm-green ring-2 ring-white" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-agm-text leading-tight truncate max-w-[130px]">
                    {user?.fullName || "Rahman Khattak"}
                  </span>
                  <span className="text-[10.5px] text-agm-muted font-medium">
                    {roleDisplay}
                  </span>
                </div>
                <ChevronDownIcon
                  size={12}
                  className={`text-agm-subtle transition-transform duration-200 hidden sm:block ${
                    userMenuOpen ? "rotate-180 text-agm-text" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-agm-card border border-agm-box-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 bg-agm-box-bg/80 border-b border-agm-box-border/80 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-agm-sidebar text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {userInitials}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-agm-green ring-2 ring-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-agm-text truncate">
                          {user?.fullName || "Rahman Khattak"}
                        </h4>
                        <span className="text-[10px] font-bold text-agm-green-dark bg-agm-green-soft border border-agm-green/20 px-1.5 py-0.2 rounded-full shrink-0">
                          {roleDisplay}
                        </span>
                      </div>
                      <p className="text-[11px] text-agm-muted truncate mt-0.5">
                        {user?.email || "rahmankhattak796@gmail.com"}
                      </p>
                      <div className="text-[10.5px] text-agm-subtle mt-1 flex items-center gap-1 font-medium">
                        <BuildingIcon
                          size={11}
                          className="text-agm-subtle shrink-0"
                        />
                        <span className="truncate">AGM Fitout LLC</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/administration");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-agm-text hover:bg-agm-box-bg transition-colors cursor-pointer text-left"
                    >
                      <UserAdminIcon size={14} className="text-agm-subtle" />
                      <span>Manage Users</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/finance/reports");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-agm-text hover:bg-agm-box-bg transition-colors cursor-pointer text-left"
                    >
                      <ReportsIcon size={14} className="text-agm-subtle" />
                      <span>Reports Hub</span>
                    </button>
                  </div>

                  <div className="p-1.5 border-t border-agm-box-border/80 bg-agm-box-bg/40">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogoutIcon className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 min-w-0 ${
            pathname.startsWith("/finance") ||
            pathname.startsWith("/reports") ||
            pathname.startsWith("/commercial") ||
            pathname.startsWith("/inventory") ||
            pathname.startsWith("/administration")
              ? "p-0 overflow-y-auto bg-white"
              : "overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8"
          } print:p-0 print:m-0 print:!bg-white print:!bg-none print:overflow-visible`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
