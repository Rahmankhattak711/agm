"use client";

import Link from "next/link";
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
  aliases?: string[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  groupAliases?: string[];
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
        href: "/inventory/purchase-orders",
        groupAliases: [
          "/commercial/purchase-requests",
          "/commercial/goods-received",
          "/commercial/supplier-payments",
          "/inventory/products",
          "/commercial/products",
          "/inventory/purchase-returns",
          "/commercial/purchase-returns",
        ],
        children: [
          {
            id: "purchase-orders",
            label: "Purchase Orders",
            href: "/inventory/purchase-orders",
            aliases: ["/commercial/purchase-orders"],
          },
          {
            id: "supplier-bills",
            label: "Purchase Bills",
            href: "/commercial/supplier-bills",
            aliases: ["/inventory/supplier-bills"],
          },
          {
            id: "suppliers",
            label: "Vendors",
            href: "/inventory/suppliers",
            aliases: ["/commercial/suppliers"],
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
            id: "general-ledger",
            label: "General Ledger",
            href: "/finance/general-ledger",
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
    label: "Human Resources",
    items: [
      {
        id: "hr-group",
        label: "HR & Payroll",
        icon: <EmployeesIcon />,
        href: "/hr",
        children: [
          {
            id: "hr-overview",
            label: "HR Overview",
            href: "/hr",
          },
          {
            id: "employees",
            label: "Employees Directory",
            href: "/hr/employees",
            aliases: ["/hr/departments", "/hr/workers", "/hr/documents"],
          },
          {
            id: "workforce-ops",
            label: "Attendance & Leaves",
            href: "/hr/workforce",
            aliases: ["/hr/attendance", "/hr/leaves", "/hr/bonuses"],
          },
          {
            id: "payroll-engine",
            label: "Monthly Payroll & GL",
            href: "/hr/payroll",
            aliases: ["/hr/salary-slips", "/hr/salary-structures"],
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
        label: "Users & Access",
        icon: <UserAdminIcon />,
        children: [
          {
            id: "admin-users",
            label: "Users",
            href: "/administration/users",
          },
          {
            id: "admin-roles",
            label: "Roles",
            href: "/administration/roles",
          },
          {
            id: "admin-permissions",
            label: "Permissions",
            href: "/administration/permissions",
          },
        ],
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
  const pathname = usePathname();
  const router = useRouter();

  // Helper to test if a path matches a sub-item (by href or aliases)
  const isSubItemActive = (item: SubNavItem, currentPath: string): boolean => {
    if (currentPath === item.href || currentPath.startsWith(`${item.href}/`)) {
      return true;
    }
    if (item.aliases) {
      return item.aliases.some(
        (a) => currentPath === a || currentPath.startsWith(`${a}/`),
      );
    }
    return false;
  };

  // Helper to find which parent group contains the current active pathname
  const getActiveGroupId = (currentPath: string): string | null => {
    for (const g of navGroups) {
      for (const item of g.items) {
        if (item.children) {
          const hasMatchingChild = item.children.some((c) =>
            isSubItemActive(c, currentPath),
          );
          if (hasMatchingChild) {
            return item.id;
          }
          if (item.groupAliases) {
            const matchesGroupAlias = item.groupAliases.some(
              (a) => currentPath === a || currentPath.startsWith(`${a}/`),
            );
            if (matchesGroupAlias) {
              return item.id;
            }
          }
        }
      }
    }
    return null;
  };

  // Accordion state: only one menu group open at a time
  const [openGroupId, setOpenGroupId] = useState<string | null>(() =>
    getActiveGroupId(pathname),
  );

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

  // Auto-sync open accordion when route changes
  useEffect(() => {
    const activeId = getActiveGroupId(pathname);
    setOpenGroupId(activeId);
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
        className={`fixed inset-0 z-40 bg-agm-charcoal/70 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`
          flex flex-col h-screen overflow-hidden border-r border-[#263e54]/80
          bg-gradient-to-b from-[#1b3145] via-[#16293a] to-[#12202e]
          shadow-xl transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50 md:static md:sticky md:top-0 md:z-40 md:flex-shrink-0
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: isMobile ? 260 : effectiveCollapsed ? 74 : 248,
        }}
      >
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-3.5 h-[68px] min-h-[68px]">
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
            className="ml-auto hidden md:flex h-7 w-7 p-0 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all cursor-pointer shadow-2xs"
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
              className="md:hidden ml-auto flex h-8 w-8 p-0 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
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
                  className={`${effectiveCollapsed ? "my-2.5 mx-auto w-6" : "my-2.5 mx-1.5"} h-px bg-white/[0.08]`}
                />
              )}

              {!effectiveCollapsed && (
                <div className="px-3 pt-3 pb-1 select-none">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300/70">
                    {group.label}
                  </span>
                </div>
              )}

              {group.items.map((item) => {
                const hasChildren = Boolean(
                  item.children && item.children.length > 0,
                );
                const isExpanded = openGroupId === item.id;

                const isDirectActive = item.href
                  ? pathname === item.href
                  : false;
                const isChildActive = hasChildren
                  ? item.children!.some((c) => isSubItemActive(c, pathname)) ||
                    Boolean(
                      item.groupAliases &&
                        item.groupAliases.some(
                          (a) =>
                            pathname === a || pathname.startsWith(`${a}/`),
                        ),
                    )
                  : false;

                return (
                  <div key={item.id} className="mb-0.5">
                    <div
                      onClick={() => {
                        if (hasChildren && !effectiveCollapsed) {
                          setOpenGroupId((current) =>
                            current === item.id ? null : item.id,
                          );
                        } else if (item.href) {
                          handleNavigateHref(item.href);
                        }
                      }}
                      onMouseEnter={() => {
                        if (item.href) router.prefetch(item.href);
                      }}
                      title={effectiveCollapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center rounded-lg transition-all duration-150 cursor-pointer ${
                        effectiveCollapsed
                          ? "justify-center px-0 py-2.5"
                          : "justify-start px-3 py-2"
                      } ${
                        isDirectActive
                          ? "bg-white/[0.14] text-white font-medium shadow-xs border border-white/[0.10]"
                          : isChildActive
                            ? "bg-white/[0.08] text-white font-medium"
                            : isExpanded
                              ? "bg-white/[0.05] text-white"
                              : "text-slate-200/90 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      {isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-sm" />
                      )}
                      {isChildActive && !isDirectActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-400/80 rounded-r-sm" />
                      )}

                      <span
                        className={`flex shrink-0 items-center justify-center w-5 text-center transition-colors ${
                          isDirectActive
                            ? "text-emerald-400"
                            : isChildActive
                              ? "text-slate-100"
                              : isExpanded
                                ? "text-slate-200"
                                : "text-slate-300/80 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!effectiveCollapsed && (
                        <div className="flex items-center justify-between flex-1 ml-3 min-w-0">
                          <span
                            className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13px] tracking-tight ${
                              isDirectActive || isChildActive
                                ? "font-semibold text-white"
                                : isExpanded
                                  ? "font-medium text-white"
                                  : "font-medium text-slate-200 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>

                          {hasChildren && (
                            <div className="flex items-center ml-auto pl-2">
                              <ChevronDownIcon
                                size={13}
                                className={`shrink-0 transition-transform duration-300 ease-in-out ${
                                  isExpanded
                                    ? "rotate-0 text-slate-200"
                                    : "-rotate-90 text-slate-400 group-hover:text-slate-200"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {hasChildren && !effectiveCollapsed && (
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isExpanded
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-4 pl-3 py-1 space-y-0.5 border-l border-white/[0.12]">
                            {item.children!.map((child) => {
                              const childActive = isSubItemActive(child, pathname);
                              return (
                                <Link
                                  key={child.id}
                                  href={child.href}
                                  prefetch={true}
                                  onClick={() => {
                                    if (onCloseMobile) onCloseMobile();
                                  }}
                                  className={`group/sub flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all duration-150 cursor-pointer ${
                                    childActive
                                      ? "font-semibold text-white bg-white/[0.15] shadow-xs"
                                      : "font-normal text-slate-300/85 hover:text-white hover:bg-white/[0.08]"
                                  }`}
                                >
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
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
