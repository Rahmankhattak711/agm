"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  PurchaseOrdersIcon,
  PurchaseReturnsIcon,
  QuotationsIcon,
  ReportsIcon,
  SalesReturnsIcon,
  ShieldCheckIcon,
  SuppliersIcon,
  UserAdminIcon,
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
          {
            id: "suppliers",
            label: "Suppliers",
            href: "/inventory/suppliers",
          },
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
        id: "projects-group",
        label: "Projects",
        icon: <BuildingIcon />,
        href: "/operations/projects",
        children: [
          {
            id: "projects-list",
            label: "Projects Directory",
            href: "/operations/projects",
          },
          {
            id: "cost-tracking",
            label: "Cost Tracking",
            href: "/operations/cost-tracking",
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
        id: "documents-group",
        label: "Company Documents",
        icon: <BriefcaseIcon />,
        href: "/commercial/agreements",
        children: [
          {
            id: "company-agreements",
            label: "Company Agreements",
            href: "/commercial/agreements",
          },
          {
            id: "salary-certificates",
            label: "Salary Certificates",
            href: "/commercial/salary-certificates",
          },
          {
            id: "custom-letters",
            label: "Custom Letters & Certs",
            href: "/commercial/custom-letters",
          },
          {
            id: "risk-assessments",
            label: "Risk Assessments",
            href: "/commercial/risk-assessments",
          },
          {
            id: "method-statements",
            label: "Method Statements",
            href: "/commercial/method-statements",
          },
        ],
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
      "documents-group": false,
      "projects-group": false,
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
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`
          flex flex-col h-screen overflow-hidden border-r border-slate-800/80
          bg-[linear-gradient(180deg,#0c1322_0%,#09101d_40%,#070d18_100%)]
          shadow-[4px_0_24px_rgba(2,6,23,0.35)] transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50 md:static md:sticky md:top-0 md:z-40 md:flex-shrink-0
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: isMobile ? 260 : effectiveCollapsed ? 74 : 248,
        }}
      >
        <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-teal-500/8 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 px-3.5 h-[68px] min-h-[68px]">
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
            className="ml-auto hidden md:flex h-7 w-7 p-0 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer shadow-2xs"
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
              className="md:hidden ml-auto flex h-8 w-8 p-0 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-300 hover:bg-slate-700/70 hover:text-white cursor-pointer"
              aria-label="Close menu"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 custom-scrollbar space-y-1">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label}>
              {groupIdx > 0 && (
                <div
                  className={`${effectiveCollapsed ? "my-2.5 mx-auto w-6" : "my-2.5 mx-1.5"} h-px bg-slate-800/70`}
                />
              )}

              {!effectiveCollapsed && (
                <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 select-none">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300/80">
                    {group.label}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
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
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-white shadow-[0_2px_14px_rgba(16,185,129,0.16)] backdrop-blur-xs"
                          : isChildActive
                            ? "bg-slate-800/70 border border-slate-700/60 text-white"
                            : "border border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      {isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-[0_0_10px_#34d399]" />
                      )}
                      {isChildActive && !isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-400/70 rounded-r-full" />
                      )}

                      <span
                        className={`flex shrink-0 items-center justify-center w-5 text-center transition-colors ${
                          active
                            ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
                            : "text-slate-400 group-hover:text-slate-200"
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
                            <div className="flex items-center gap-1.5 ml-auto pl-1">
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md transition-colors ${
                                  active
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-slate-800/90 text-slate-400 border border-slate-700/60 group-hover:text-slate-200 group-hover:border-slate-600"
                                }`}
                              >
                                {item.children!.length}
                              </span>
                              <ChevronDownIcon
                                size={12}
                                className={`shrink-0 transition-transform duration-250 ease-out ${
                                  isExpanded
                                    ? "rotate-0 text-emerald-400"
                                    : "-rotate-90 text-slate-400 group-hover:text-slate-200"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {hasChildren && isExpanded && !effectiveCollapsed && (
                      <div className="ml-5 pl-2.5 my-1 space-y-0.5 border-l-2 border-slate-800/90">
                        {item.children!.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleNavigateHref(child.href)}
                              className={`group/sub flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-all cursor-pointer ${
                                childActive
                                  ? "font-semibold text-emerald-200 bg-emerald-500/15 border border-emerald-500/25 shadow-xs"
                                  : "font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {childActive ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0 ml-1.5" />
                              ) : (
                                <span className="w-1 h-1 rounded-full bg-slate-600 group-hover/sub:bg-slate-400 shrink-0 ml-1.5 transition-colors" />
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
