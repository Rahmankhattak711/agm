"use client";

import { getSectionFromPath, SECTION_PATHS } from "@/lib/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import AgmLogo from "./AgmLogo";
import {
  AccountsIcon,
  AttendanceIcon,
  BonusesIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  CloseIcon,
  CustomersIcon,
  DashboardIcon,
  EmployeesIcon,
  ExpensesIcon,
  FileCheckIcon,
  FileTextIcon,
  FixedAssetsIcon,
  JournalEntriesIcon,
  LayersIcon,
  LeavesIcon,
  LineChartIcon,
  PayablesIcon,
  PurchaseOrdersIcon,
  PurchaseReturnsIcon,
  QuotationsIcon,
  ReceivablesIcon,
  ReportsIcon,
  SalesReturnsIcon,
  SalesVouchersIcon,
  ShieldCheckIcon,
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
        id: "reports",
        label: "Reports",
        icon: <ReportsIcon />,
        href: "/finance/reports",
      },
    ],
  },
  {
    label: "Projects",
    items: [
      {
        id: "projects",
        label: "Projects",
        icon: <BuildingIcon />,
        href: "/operations/projects",
      },
      {
        id: "cost-tracking",
        label: "Cost Tracking",
        icon: <LineChartIcon />,
        href: "/operations/cost-tracking",
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
        icon: <BriefcaseIcon />,
        href: "/commercial/agreements",
      },
      {
        id: "salary-certificates",
        label: "Salary Certificates",
        icon: <FileCheckIcon />,
        href: "/commercial/salary-certificates",
      },
      {
        id: "custom-letters",
        label: "Custom Letters & Certs",
        icon: <FileTextIcon />,
        href: "/commercial/custom-letters",
      },
      {
        id: "risk-assessments",
        label: "Risk Assessments",
        icon: <ShieldCheckIcon />,
        href: "/commercial/risk-assessments",
      },
      {
        id: "method-statements",
        label: "Method Statements",
        icon: <LayersIcon />,
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      "sales-group": false,
      "purchases-group": false,
      "accounts-group": false,
      "hr-group": false,
      "assets-group": false,
    },
  );

  const pathname = usePathname();
  const router = useRouter();

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

  const handleNavigateHref = (href: string) => {
    router.push(href);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

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

        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 custom-scrollbar space-y-0.5">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label}>
              {groupIdx > 0 && (
                <div
                  className={`${effectiveCollapsed ? "my-2 mx-auto w-6" : "my-2 mx-1"} h-px bg-white/8`}
                />
              )}

              {!effectiveCollapsed && (
                <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 select-none">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {
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
                  <div key={item.id} className="mb-0.5">
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
                          : "justify-start px-3 py-2"
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
                          active
                            ? "text-[#4ade80]"
                            : "text-slate-400 group-hover:text-white"
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
                                  : "font-medium text-slate-300 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>

                          {hasChildren && (
                            <ChevronDownIcon
                              size={12}
                              className={`shrink-0 ml-1 transition-transform duration-200 ${
                                isExpanded
                                  ? "rotate-0 text-white/60"
                                  : "-rotate-90 text-slate-500 group-hover:text-white/60"
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {hasChildren && isExpanded && !effectiveCollapsed && (
                      <div className="ml-5 pl-3 mt-0.5 mb-1 space-y-0.5 border-l border-white/10">
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
                                  ? "font-semibold text-white bg-white/[0.12] border border-white/15"
                                  : "font-medium text-slate-400 hover:text-white hover:bg-white/[0.06]"
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
          ))}
        </nav>
      </aside>
    </>
  );
}
