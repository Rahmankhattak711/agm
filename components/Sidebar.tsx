"use client";

import { useAuth } from "@/context/AuthContext";
import { getSectionFromPath, SECTION_PATHS } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import AgmLogo from "./AgmLogo";
import {
  AccountsIcon,
  AttendanceIcon,
  BonusesIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  CloseIcon,
  CustomersIcon,
  DashboardIcon,
  EmployeesIcon,
  ExpensesIcon,
  FileCheckIcon,
  FixedAssetsIcon,
  JournalEntriesIcon,
  LeavesIcon,
  LogoutIcon,
  PayablesIcon,
  PurchaseOrdersIcon,
  PurchaseReturnsIcon,
  QuotationsIcon,
  ReceivablesIcon,
  ReportsIcon,
  SalesReturnsIcon,
  SalesVouchersIcon,
  SuppliersIcon,
  TaxVatIcon,
  UserAdminIcon,
  WarehousesIcon,
} from "./icons";

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: SubNavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Finance",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <DashboardIcon />,
        href: "/dashboard",
      },
      {
        id: "sales-group",
        label: "Sales",
        icon: <QuotationsIcon />,
        href: "/commercial/sales-invoices",
        children: [
          {
            id: "quotations",
            label: "Quotations",
            href: "/commercial/quotations",
          },
          {
            id: "sales-invoices",
            label: "Sales Invoices",
            href: "/commercial/sales-invoices",
          },
          {
            id: "sales-returns",
            label: "Sales Returns",
            href: "/inventory/sales-returns",
          },
          {
            id: "customers",
            label: "Customers",
            href: "/commercial/customers",
          },
        ],
      },
      {
        id: "purchases-group",
        label: "Purchases",
        icon: <PurchaseOrdersIcon />,
        href: "/commercial/supplier-bills",
        children: [
          {
            id: "purchase-orders",
            label: "Purchase Orders",
            href: "/inventory/purchase-orders",
          },
          {
            id: "supplier-bills",
            label: "Purchase Invoices",
            href: "/commercial/supplier-bills",
          },
          {
            id: "purchase-returns",
            label: "Purchase Returns",
            href: "/inventory/purchase-returns",
          },
          { id: "suppliers", label: "Suppliers", href: "/inventory/suppliers" },
        ],
      },
      {
        id: "accounts-group",
        label: "Accounts",
        icon: <AccountsIcon />,
        href: "/finance/accounts",
        children: [
          {
            id: "accounts",
            label: "Chart of Accounts",
            href: "/finance/accounts",
          },
          {
            id: "journals",
            label: "Journal Entries",
            href: "/finance/journal-entries",
          },
          {
            id: "expenses",
            label: "Purchase Expenses",
            href: "/finance/expenses",
          },
        ],
      },
      {
        id: "reports-group",
        label: "Reports",
        icon: <ReportsIcon />,
        href: "/finance/reports",
        children: [
          {
            id: "finance-reports",
            label: "Financial Statements",
            href: "/finance/reports",
          },
          {
            id: "report-sales",
            label: "Sales Reports",
            href: "/reports/sales",
          },
          {
            id: "report-purchases",
            label: "Purchase Reports",
            href: "/reports/purchases",
          },
          { id: "report-vat", label: "VAT & Tax Return", href: "/reports/vat" },
          {
            id: "report-management",
            label: "Executive Summary",
            href: "/reports/management",
          },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "operations-dashboard",
        label: "Operations Overview",
        icon: <DashboardIcon />,
        href: "/operations/dashboard",
      },
      {
        id: "hr-group",
        label: "Human Resources",
        icon: <EmployeesIcon />,
        href: "/operations/employees",
        children: [
          {
            id: "employees",
            label: "Employees Directory",
            href: "/operations/employees",
          },
          {
            id: "attendance",
            label: "Daily Attendance",
            href: "/operations/attendance",
          },
          {
            id: "leaves",
            label: "Leave Management",
            href: "/operations/leaves",
          },
          {
            id: "bonuses",
            label: "Bonuses & Payroll",
            href: "/operations/bonuses",
          },
        ],
      },
      {
        id: "assets-group",
        label: "Fixed Assets",
        icon: <FixedAssetsIcon />,
        href: "/operations/fixed-assets",
        children: [
          {
            id: "assets",
            label: "Asset Registry & Depreciation",
            href: "/operations/fixed-assets",
          },
        ],
      },
    ],
  },
  {
    label: "Company Documents",
    items: [
      {
        id: "company-agreements",
        label: "Company Agreements",
        icon: <FileCheckIcon />,
        href: "/commercial/agreements",
      },
      {
        id: "salary-certificates",
        label: "Salary Certificates",
        icon: <FileCheckIcon />,
        href: "/commercial/salary-certificates",
      },
      {
        id: "risk-assessments",
        label: "Risk Assessments",
        icon: <FileCheckIcon />,
        href: "/commercial/risk-assessments",
      },
      {
        id: "method-statements",
        label: "Method Statements",
        icon: <FileCheckIcon />,
        href: "/commercial/method-statements",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "admin",
        label: "User Management",
        icon: <UserAdminIcon />,
        href: "/administration/users",
      },
    ],
  },
];

export default function Sidebar({
  activeSection,
  onNavigate,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    Finance: true,
    Operations: true,
    "Company Documents": true,
    Administration: true,
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      "sales-group": true,
      "purchases-group": false,
      "accounts-group": false,
      "reports-group": false,
      "hr-group": false,
      "assets-group": false,
    },
  );


  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (w >= 768 && w < 1024) {
        setCollapsed(true);
      } else if (w >= 1024) {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const effectiveCollapsed = isMobile ? false : collapsed;

  useEffect(() => {
    navGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (item.children) {
          const hasMatchingChild = item.children.some(
            (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
          );
          if (hasMatchingChild) {
            setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [pathname]);

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel],
    }));
  };

  const toggleAllSections = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      next[g.label] = expand;
    });
    setExpandedSections(next);
  };


  const handleNavigateHref = (href: string) => {
    router.push(href);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  if (loading) {
    return (
      <aside
        className="hidden md:flex w-[240px] transition-all duration-300 flex-col h-screen sticky top-0 z-40 bg-gradient-to-b from-[#2c455a] via-[#233a4d] to-[#1d3345] border-r border-white/12 shadow-[4px_0_28px_rgba(38,59,77,0.18)] overflow-hidden"
        style={{
          width: effectiveCollapsed ? 74 : 240,
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
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`
          flex flex-col h-screen overflow-hidden border-r border-white/10
          bg-[radial-gradient(ellipse_at_top,_#2d4b63,_#1f3445_45%,_#172836_100%)]
          shadow-[6px_0_30px_rgba(15,23,42,0.18)] transition-all duration-300
          fixed inset-y-0 left-0 z-50 md:static md:sticky md:top-0 md:z-40 md:flex-shrink-0
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: isMobile ? 260 : effectiveCollapsed ? 74 : 240,
        }}
      >
        <div className="pointer-events-none absolute -top-4 right-[-30px] w-[220px] h-[340px] opacity-15 overflow-hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 240 720"
            className="h-full w-full"
          >
            <path
              d="M14 312V124L125 16l108 108v224M52 260V145L164 34v202"
              fill="none"
              stroke="#edf7ee"
              strokeWidth="1.1"
            />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between border-b border-white/8 px-3 min-h-[72px]">
          {!effectiveCollapsed ? (
            <div className="flex items-center">
              <AgmLogo size="sm" collapsed={false} theme="dark" />
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <AgmLogo size="sm" collapsed={true} />
            </div>
          )}

          <button
            id="sidebar-toggle"
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto hidden md:flex h-7 w-7 p-0 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white/70 hover:bg-white/15 hover:text-white transition-all cursor-pointer shadow-xs"
            title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeftIcon
              className={`h-[13px] w-[13px] transition-transform duration-300 ${
                effectiveCollapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden ml-auto flex h-8 w-8 p-0 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white/70 hover:bg-white/15 hover:text-white cursor-pointer"
              aria-label="Close menu"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
          {navGroups.map((group) => {
            const isSectionExpanded =
              expandedSections[group.label] !== false;

            return (
              <div key={group.label} className="mb-3">
                {!effectiveCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.label)}
                    className="w-full flex items-center justify-between px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8fb0c4]/75 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span>{group.label}</span>
                    <ChevronDownIcon
                      size={11}
                      className={`text-[#8fb0c4]/60 group-hover:text-white transition-transform duration-200 ${
                        isSectionExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>
                )}
                {effectiveCollapsed && <div className="h-1.5" />}

                {(isSectionExpanded || effectiveCollapsed) &&
                  group.items.map((item) => {

                const hasChildren = Boolean(
                  item.children && item.children.length > 0,
                );
                const isExpanded = Boolean(expandedGroups[item.id]);

                const isDirectActive = item.href
                  ? pathname === item.href
                  : false;
                const isChildActive = hasChildren
                  ? item.children!.some(
                      (c) =>
                        pathname === c.href ||
                        pathname.startsWith(`${c.href}/`),
                    )
                  : false;

                const active = isDirectActive || isChildActive;

                return (
                  <div key={item.id} className="mb-1">
                    <div
                      onClick={() => {
                        if (hasChildren && !effectiveCollapsed) {
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }));
                        } else if (item.href) {
                          handleNavigateHref(item.href);
                        }
                      }}
                      title={effectiveCollapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center rounded-xl transition-all duration-200 cursor-pointer ${
                        effectiveCollapsed
                          ? "justify-center px-0 py-2.5"
                          : "justify-start px-3 py-2.5"
                      } ${
                        isDirectActive
                          ? "bg-white/[0.12] border border-white/15 backdrop-blur-xs text-white shadow-[0_2px_12px_rgba(0,0,0,0.14)]"
                          : isChildActive
                            ? "bg-white/[0.08] border border-white/10 text-white"
                            : "border border-transparent text-slate-200/90 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      {isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[22px] bg-[#4ade80] rounded-r-full shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
                      )}
                      {isChildActive && !isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4ade80]/60 rounded-r-full" />
                      )}

                      <span
                        className={`flex shrink-0 items-center justify-center w-5 text-center transition-colors ${
                          isDirectActive || isChildActive
                            ? "text-white"
                            : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!effectiveCollapsed && (
                        <div className="flex items-center justify-between flex-1 ml-3 min-w-0">
                          <span
                            className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] tracking-tight ${
                              isDirectActive
                                ? "font-bold text-white"
                                : isChildActive
                                  ? "font-semibold text-white"
                                  : "font-medium text-slate-200/90 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>

                          {hasChildren && (
                            <span
                              onClick={(e) => toggleGroup(item.id, e)}
                              className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors ml-1"
                            >
                              <ChevronDownIcon
                                size={13}
                                className={`transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-0 text-white"
                                    : "-rotate-90 text-slate-400 group-hover:text-white"
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {hasChildren && isExpanded && !effectiveCollapsed && (
                      <div className="ml-5 pl-3.5 my-1.5 space-y-1 border-l border-white/15">
                        {item.children!.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleNavigateHref(child.href)}
                              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-all cursor-pointer ${
                                childActive
                                  ? "font-semibold text-white bg-white/[0.14] border border-white/15 shadow-xs"
                                  : "font-medium text-slate-200/85 hover:text-white hover:bg-white/[0.07]"
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {childActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80] shrink-0 ml-1.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>


        <div className="relative z-10 mx-2.5 h-px bg-white/8" />

        <div className="relative z-10 p-2.5">
          {!effectiveCollapsed ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] p-2.5 backdrop-blur-sm transition-all">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4ade80] to-[#166534] text-[11px] font-black text-white shadow-[0_2px_8px_rgba(22,101,52,0.4)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-white leading-snug">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-white/45 leading-relaxed">
                  {user?.role?.replace("_", " ") || "User"} ·{" "}
                  {user?.email || "admin@agm.ae"}
                </p>
              </div>
              <button
                id="nav-signout"
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex h-7 w-7 p-0 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20 hover:text-red-100 cursor-pointer"
              >
                <LogoutIcon className="h-[13px] w-[13px]" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={logout}
                title={`${user?.fullName || "Admin"} — Sign out`}
                className="flex h-9 w-9 p-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#4ade80] to-[#166534] text-[11px] font-black text-white shadow-[0_2px_8px_rgba(22,101,52,0.4)] cursor-pointer"
              >
                {initials}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
