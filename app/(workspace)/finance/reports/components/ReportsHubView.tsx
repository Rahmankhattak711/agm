"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SearchIcon,
  TrendingUpIcon,
  FileSpreadsheetIcon,
  RotateCcwIcon,
  FileCheck2Icon,
  UserIcon,
  ClockIcon,
  ShoppingCartIcon,
  BuildingIcon,
  WalletIcon,
  ActivityIcon,
  ArrowRightIcon,
  PercentIcon,
  ScaleIcon,
  BookOpenIcon,
  FileTextIcon,
} from "@/components/icons";
import { Input } from "@/components/ui";
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
        icon: FileTextIcon,
        openHref: "/reports/finance",
        openTab: "profit-loss",
        items: [
          {
            id: "profit-loss",
            name: "Profit & Loss Statement",
            targetHref: "/reports/finance",
            targetTab: "profit-loss",
            icon: TrendingUpIcon,
            iconColor: "#8b5cf6",
            iconBg: "#f3e8ff",
          },
          {
            id: "balance-sheet",
            name: "Balance Sheet",
            targetHref: "/reports/finance",
            targetTab: "balance-sheet",
            icon: FileSpreadsheetIcon,
            iconColor: "#0ea5e9",
            iconBg: "#e0f2fe",
          },
          {
            id: "trial-balance",
            name: "Trial Balance",
            targetHref: "/reports/finance",
            targetTab: "trial-balance",
            icon: ScaleIcon,
            iconColor: "#f43f5e",
            iconBg: "#ffe4e6",
          },
          {
            id: "general-ledger",
            name: "General Ledger",
            targetTab: "ledger",
            icon: BookOpenIcon,
            iconColor: "#10b981",
            iconBg: "#d1fae5",
          },
          {
            id: "executive-summary",
            name: "Executive Summary",
            targetHref: "/reports/management",
            targetTab: "summary",
            icon: RotateCcwIcon,
            iconColor: "#f97316",
            iconBg: "#ffedd5",
          },
        ],
      },
      {
        id: "sales-receivables",
        title: "Sales & Receivables Reports",
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
            iconColor: "#16a34a",
            iconBg: "#dcfce7",
          },
          {
            id: "customer-soa",
            name: "Customer Statement of Account (SOA)",
            targetHref: "/reports/customers",
            targetTab: "statement-of-account",
            icon: UserIcon,
            iconColor: "#3b82f6",
            iconBg: "#dbeafe",
          },
        ],
      },
      {
        id: "purchases-payables",
        title: "Purchases & Payables Reports",
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
            iconColor: "#ef4444",
            iconBg: "#fee2e2",
          },
          {
            id: "supplier-soa",
            name: "Supplier Statement of Account",
            targetHref: "/reports/suppliers",
            icon: BuildingIcon,
            iconColor: "#6366f1",
            iconBg: "#e0e7ff",
          },
          {
            id: "expense-reports",
            name: "Expense Reports & Breakdown",
            targetHref: "/reports/expenses",
            icon: WalletIcon,
            iconColor: "#a855f7",
            iconBg: "#f3e8ff",
          },
        ],
      },
      {
        id: "vat-tax",
        title: "VAT & Tax Reports",
        icon: PercentIcon,
        openHref: "/reports/vat",
        openTab: "vat-summary",
        items: [
          {
            id: "vat-return-201",
            name: "UAE VAT Return & Tax Summary (FTA 201)",
            targetHref: "/reports/vat",
            targetTab: "vat-summary",
            icon: PercentIcon,
            iconColor: "#0284c7",
            iconBg: "#e0f2fe",
          },
        ],
      },
      {
        id: "management-performance",
        title: "Management & Performance",
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
            iconColor: "#10b981",
            iconBg: "#d1fae5",
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reports Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial statements, commercial sales, payables, and VAT returns.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            leftIcon={<SearchIcon size={14} className="text-slate-400" />}
            className="text-xs py-1.5 bg-white border-slate-200"
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          No reports found matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GroupIcon size={15} className="text-slate-500 shrink-0" />
                    <h2 className="text-[13px] font-bold text-slate-900 truncate">
                      {group.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGroupOpen(group)}
                    className="shrink-0 text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRightIcon size={12} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleReportClick(item)}
                        className="px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: item.iconBg,
                            color: item.iconColor,
                          }}
                        >
                          <ItemIcon size={16} />
                        </div>

                        <span className="text-xs font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
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
