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
  ChevronsLeftIcon,
  CustomersIcon,
  DashboardIcon,
  EmployeesIcon,
  ExpensesIcon,
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
import {
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Landmark,
  DollarSign,
  Wallet,
} from "lucide-react";

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
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

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
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

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleNavigateHref = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <aside
        className="w-[240px] transition-all duration-300 flex flex-col h-screen sticky top-0 z-40 bg-gradient-to-b from-[#2c455a] via-[#233a4d] to-[#1d3345] border-r border-white/12 shadow-[4px_0_28px_rgba(38,59,77,0.18)] overflow-hidden"
        style={{
          width: collapsed ? 74 : 240,
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

      <div className="relative z-10 flex items-center gap-2 border-b border-white/8 px-3 min-h-[72px]">
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
          <ChevronsLeftIcon
            className={`h-[13px] w-[13px] transition-transform duration-300 ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-1.5" />}

            {group.items.map((item) => {
              const hasChildren = Boolean(
                item.children && item.children.length > 0,
              );
              const isExpanded = Boolean(expandedGroups[item.id]);

              const isDirectActive = item.href ? pathname === item.href : false;
              const isChildActive = hasChildren
                ? item.children!.some(
                    (c) =>
                      pathname === c.href || pathname.startsWith(`${c.href}/`),
                  )
                : false;

              const active = isDirectActive || isChildActive;

              return (
                <div key={item.id} className="mb-1">
                  <div
                    onClick={() => {
                      if (hasChildren && !collapsed) {
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }));
                      } else if (item.href) {
                        handleNavigateHref(item.href);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center rounded-[12px] border-none text-left transition-all duration-200 cursor-pointer ${
                      collapsed ? "justify-center" : "justify-start"
                    } ${
                      active && (!hasChildren || collapsed)
                        ? "bg-gradient-to-r from-white/16 to-white/6 text-white shadow-[inset_0_0_0_1px_rgba(233,242,234,0.16)]"
                        : active && hasChildren
                          ? "text-white font-bold bg-white/6"
                          : "text-white/65 hover:bg-white/6 hover:text-white"
                    }`}
                    style={{ padding: collapsed ? "10px 0" : "7px 10px" }}
                  >
                    {active && (!hasChildren || collapsed) && (
                      <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#dff7e6] to-[#9ec7a7]" />
                    )}

                    <span className="flex shrink-0 items-center justify-center w-5 text-center">
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 ml-2.5 min-w-0">
                        <span
                          className={`overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] ${
                            active ? "font-bold text-white" : "font-medium"
                          }`}
                        >
                          {item.label}
                        </span>

                        {hasChildren && (
                          <span
                            onClick={(e) => toggleGroup(item.id, e)}
                            className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          >
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {hasChildren && isExpanded && !collapsed && (
                    <div className="ml-6 pl-2 mt-0.5 border-l border-white/10 space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleNavigateHref(child.href)}
                            className={`flex items-center w-full px-2.5 py-1.5 rounded-lg text-[11.5px] text-left transition-colors cursor-pointer ${
                              childActive
                                ? "font-bold text-emerald-300 bg-white/10"
                                : "font-medium text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className="truncate">{child.label}</span>
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
              <LogoutIcon className="h-[13px] w-[13px]" strokeWidth={2} />
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
