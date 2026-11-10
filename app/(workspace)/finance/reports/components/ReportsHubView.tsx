"use client";

import {
  ActivityIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BuildingIcon,
  ClockIcon,
  FileCheck2Icon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PercentIcon,
  RotateCcwIcon,
  ScaleIcon,
  SearchIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { ReportTab } from "./types";

export interface HubReportItem {
  id: string;
  name: string;
  targetTab?: ReportTab;
  targetHref?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
}

export interface HubCategoryGroup {
  id: string;
  title: string;
  headerBg: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  openHref?: string;
  openTab?: ReportTab;
  items: HubReportItem[];
}

export interface ReportsHubViewProps {
  onSelectReport: (tab: ReportTab) => void;
}

export function ReportsHubView({ onSelectReport }: ReportsHubViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const categoryGroups: HubCategoryGroup[] = useMemo(
    () => [
      {
        id: "financial-statements",
        title: "Accounting & Financial Statements",
        headerBg: "#f0f7ff",
        icon: FileTextIcon,
        openHref: "/finance/reports/profit-and-loss",
        openTab: "profit-loss",
        items: [
          {
            id: "profit-loss",
            name: "Profit & Loss Statement",
            targetHref: "/finance/reports/profit-and-loss",
            targetTab: "profit-loss",
            icon: TrendingUpIcon,
            iconColor: "#1d4ed8",
            iconBg: "#eff6ff",
          },
          {
            id: "balance-sheet",
            name: "Balance Sheet",
            targetHref: "/finance/reports/balance-sheet",
            targetTab: "balance-sheet",
            icon: FileSpreadsheetIcon,
            iconColor: "#0284c7",
            iconBg: "#e0f2fe",
          },
          {
            id: "trial-balance",
            name: "Trial Balance",
            targetHref: "/finance/reports/trial-balance",
            targetTab: "trial-balance",
            icon: ScaleIcon,
            iconColor: "#b45309",
            iconBg: "#fefce8",
          },
          {
            id: "general-ledger",
            name: "General Ledger",
            targetHref: "/finance/general-ledger",
            targetTab: "ledger",
            icon: BookOpenIcon,
            iconColor: "#059669",
            iconBg: "#f0fdf4",
          },
          {
            id: "executive-summary",
            name: "Cash Flow Statement",
            targetHref: "/finance/reports/cash-flow",
            targetTab: "summary",
            icon: RotateCcwIcon,
            iconColor: "#be123c",
            iconBg: "#fff1f2",
          },
        ],
      },
      {
        id: "sales-receivables",
        title: "Sales & Receivables Reports",
        headerBg: "#f0fdf4",
        icon: TrendingUpIcon,
        openHref: "/reports/sales",
        openTab: "tax-invoices",
        items: [
          {
            id: "tax-invoices",
            name: "Tax Invoices & Sales Register",
            targetHref: "/reports/sales",
            targetTab: "tax-invoices",
            icon: FileCheck2Icon,
            iconColor: "#059669",
            iconBg: "#f0fdf4",
          },
          {
            id: "customer-soa",
            name: "Customer Statement of Account (SOA)",
            targetHref: "/reports/customers",
            targetTab: "statement-of-account",
            icon: UserIcon,
            iconColor: "#1d4ed8",
            iconBg: "#eff6ff",
          },
        ],
      },
      {
        id: "purchases-payables",
        title: "Purchases & Payables Reports",
        headerBg: "#fffbeb",
        icon: ShoppingCartIcon,
        openHref: "/reports/purchases",
        openTab: "payables",
        items: [
          {
            id: "accounts-payable",
            name: "Accounts Payable (A/P) & Ageing",
            targetHref: "/reports/purchases",
            targetTab: "payables",
            icon: ClockIcon,
            iconColor: "#be123c",
            iconBg: "#fff1f2",
          },
          {
            id: "supplier-soa",
            name: "Supplier Statement of Account",
            targetHref: "/reports/suppliers",
            icon: BuildingIcon,
            iconColor: "#1d4ed8",
            iconBg: "#eff6ff",
          },
          {
            id: "expense-reports",
            name: "Expense Reports & Breakdown",
            targetHref: "/reports/expenses",
            icon: WalletIcon,
            iconColor: "#b45309",
            iconBg: "#fefce8",
          },
        ],
      },
      {
        id: "vat-tax",
        title: "VAT & Tax Reports",
        headerBg: "#fff1f2",
        icon: PercentIcon,
        openHref: "/finance/reports/vat",
        openTab: "vat-summary",
        items: [
          {
            id: "vat-return-201",
            name: "UAE VAT Return & Tax Summary (FTA 201)",
            targetHref: "/finance/reports/vat",
            targetTab: "vat-summary",
            icon: PercentIcon,
            iconColor: "#1d4ed8",
            iconBg: "#eff6ff",
          },
        ],
      },
      {
        id: "management-performance",
        title: "Management & Performance",
        headerBg: "#f4f7fb",
        icon: ActivityIcon,
        openHref: "/reports/management",
        openTab: "summary",
        items: [
          {
            id: "management-overview",
            name: "Management Performance Overview",
            targetHref: "/reports/management",
            targetTab: "summary",
            icon: ActivityIcon,
            iconColor: "#059669",
            iconBg: "#f0fdf4",
          },
        ],
      },
    ],
    [],
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryGroups;
    }
    const q = searchQuery.toLowerCase();
    return categoryGroups
      .map((group) => {
        const groupMatch = group.title.toLowerCase().includes(q);
        const matchedItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(q),
        );

        if (groupMatch) return group;
        if (matchedItems.length > 0) {
          return { ...group, items: matchedItems };
        }
        return null;
      })
      .filter((g): g is HubCategoryGroup => g !== null);
  }, [categoryGroups, searchQuery]);

  const handleReportClick = (item: HubReportItem) => {
    if (item.targetHref) {
      router.push(item.targetHref);
    } else if (item.targetTab) {
      onSelectReport(item.targetTab);
    }
  };

  const handleGroupOpen = (group: HubCategoryGroup) => {
    if (group.openHref) {
      router.push(group.openHref);
    } else if (group.openTab) {
      onSelectReport(group.openTab);
    }
  };

  return (
    <div className="space-y-5 pb-12 text-slate-800">
      <div
        className="p-3.5 rounded-xl border border-[#cbd5e1] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ backgroundColor: "#f4f7fb", border: "1px solid #cbd5e1" }}
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Reports Directory</h2>
          <p className="text-xs text-slate-500 font-normal">
            Financial statements, commercial sales, payables, and VAT returns.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#cbd5e1] rounded-lg outline-none focus:border-[#1d4ed8]"
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div
          className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-[#cbd5e1]"
          style={{ border: "1px solid #cbd5e1" }}
        >
          No reports found matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-[#cbd5e1] shadow-2xs overflow-hidden"
                style={{ border: "1px solid #cbd5e1" }}
              >
                <div
                  className="px-4 py-3 border-b border-[#cbd5e1] flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: group.headerBg,
                    borderBottom: "1px solid #cbd5e1",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GroupIcon size={15} className="text-[#1d4ed8] shrink-0" />
                    <h2 className="text-xs font-semibold text-slate-900 truncate">
                      {group.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGroupOpen(group)}
                    className="shrink-0 text-[11px] font-medium text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRightIcon size={12} />
                  </button>
                </div>

                <div className="divide-y divide-slate-200/70">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleReportClick(item)}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                      >
                        <div
                          className="w-7 h-7 rounded-lg border border-slate-200/80 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: item.iconBg,
                            color: item.iconColor,
                          }}
                        >
                          <ItemIcon size={14} />
                        </div>

                        <span className="text-xs font-normal text-slate-700 group-hover:text-[#1d4ed8] transition-colors">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReportsHubView;
