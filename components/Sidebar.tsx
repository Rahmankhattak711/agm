"use client";

import { useAuth } from "@/context/AuthContext";
import { getSectionFromPath, SECTION_PATHS } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AgmLogo from "./AgmLogo";

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Finance & Accounts",
    items: [
      {
        id: "accounts",
        label: "Chart of Accounts",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10M6 10h10M6 14h6" />
          </svg>
        ),
      },
      {
        id: "journals",
        label: "Journal Entries",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        id: "petty-cash",
        label: "Petty Cash",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        ),
      },
      {
        id: "reports",
        label: "Financial Reports",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Operations & Assets",
    items: [
      {
        id: "employees",
        label: "Employees & Payroll",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        id: "assets",
        label: "Fixed Assets",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "admin",
        label: "User Management",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const currentSection = activeSection ?? getSectionFromPath(pathname);
  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
      return;
    }
    router.push(SECTION_PATHS[section] ?? "/dashboard");
  };

  const groups = navGroups;

  if (loading) {
    return (
      <aside
        className="w-[240px] transition-all duration-300 flex flex-col h-screen sticky top-0 z-40 bg-gradient-to-b from-[#2c455a] via-[#233a4d] to-[#1d3345] border-r border-white/12 shadow-[4px_0_28px_rgba(38,59,77,0.18)] overflow-hidden"
        style={{
          width: collapsed ? 68 : 240,
        }}
      >
        <div className="p-4 text-white/60">Loading...</div>
      </aside>
    );
  }

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-screen sticky top-0 z-40 overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] shadow-[6px_0_30px_rgba(15,23,42,0.18)] transition-[width] duration-300"
      style={{
        width: collapsed ? 74 : 240,
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 right-[-90px] w-[260px] opacity-20">
        <svg aria-hidden="true" viewBox="0 0 240 720" className="h-full w-full">
          <path
            d="M14 312V124L125 16l108 108v224M52 260V145L164 34v202"
            fill="none"
            stroke="#edf7ee"
            strokeWidth="1.1"
          />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-2 border-b border-white/8 px-3 min-h-[78px]">
        {!collapsed ? (
          <div className="w-full flex items-center">
            <AgmLogo size="sm" collapsed={false} theme="dark" />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <AgmLogo size="sm" collapsed={true} />
          </div>
        )}

        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`h-[13px] w-[13px] transition-transform duration-300 ${collapsed ? "rotate-180" : "rotate-0"}`}
          >
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-1.5" />}

            {group.items.map((item) => {
              const active = currentSection === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavigation(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative mb-1 flex w-full items-center rounded-[12px] border-none text-left transition-all duration-200 cursor-pointer ${
                    collapsed ? "justify-center" : "justify-start"
                  } ${
                    active
                      ? "bg-gradient-to-r from-white/16 to-white/6 text-white shadow-[inset_0_0_0_1px_rgba(233,242,234,0.16)]"
                      : "text-white/65 hover:bg-white/6 hover:text-white"
                  }`}
                  style={{ padding: collapsed ? "10px 0" : "8px 10px" }}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#dff7e6] to-[#9ec7a7]" />
                  )}

                  <span className="flex shrink-0 items-center justify-center">
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span
                      className={`ml-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] ${
                        active ? "font-bold text-white" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="relative z-10 mx-2.5 h-px bg-white/8" />

      <div className="relative z-10 p-2.5">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/6 p-2.5 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#59a06d] to-[#214d39] text-[11px] font-black text-white shadow-[0_4px_12px_rgba(28,82,58,0.3)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-white leading-snug">
                {user?.fullName || "Admin User"}
              </p>
              <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-white/35 leading-relaxed">
                {user?.role?.replace("_", " ") || "User"} ·{" "}
                {user?.email || "admin@agm.ae"}
              </p>
            </div>
            <button
              id="nav-signout"
              onClick={logout}
              title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/8 text-red-200 transition-all hover:bg-red-500/15 hover:text-red-100 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-[13px] w-[13px]"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={logout}
              title={`${user?.fullName || "Admin"} — Sign out`}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-gradient-to-br from-[#59a06d] to-[#214d39] text-[11px] font-black text-white shadow-[0_4px_12px_rgba(28,82,58,0.3)] cursor-pointer"
            >
              {initials}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
