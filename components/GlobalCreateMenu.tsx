"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  ChevronDown,
  FileText,
  Receipt,
  RotateCcw,
  ArrowDownLeft,
  ShoppingCart,
  CreditCard,
  BookOpen,
  RefreshCw,
  Scale,
  X,
} from "lucide-react";

interface ActionItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  priority: "primary" | "secondary" | "advanced";
  badge?: string;
}

interface ActionGroup {
  category: "SALES" | "PURCHASES" | "ACCOUNTING" | "OTHER";
  items: ActionItem[];
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    category: "SALES",
    items: [
      {
        id: "create-quotation",
        label: "Quotation",
        href: "/commercial/quotations",
        icon: <FileText size={15} className="text-emerald-700" />,
        priority: "primary",
        badge: "Fast",
      },
      {
        id: "create-invoice",
        label: "Sales Invoice",
        href: "/commercial/sales-invoices",
        icon: <FileText size={15} className="text-emerald-700" />,
        priority: "primary",
      },
      {
        id: "create-receipt",
        label: "Receipt",
        href: "/commercial/sales-invoices",
        icon: <ArrowDownLeft size={15} className="text-emerald-700" />,
        priority: "primary",
      },
      {
        id: "create-sales-return",
        label: "Sales Return",
        href: "/inventory/sales-returns",
        icon: <RotateCcw size={15} className="text-slate-500" />,
        priority: "secondary",
      },
    ],
  },
  {
    category: "PURCHASES",
    items: [
      {
        id: "create-purchase-bill",
        label: "Purchase Invoice",
        href: "/commercial/supplier-bills",
        icon: <Receipt size={15} className="text-amber-700" />,
        priority: "primary",
      },
      {
        id: "create-payment",
        label: "Payment",
        href: "/commercial/supplier-bills",
        icon: <CreditCard size={15} className="text-amber-700" />,
        priority: "primary",
      },
      {
        id: "create-po",
        label: "Purchase Order",
        href: "/inventory/purchase-orders",
        icon: <ShoppingCart size={15} className="text-slate-500" />,
        priority: "secondary",
      },
      {
        id: "create-purchase-return",
        label: "Purchase Return",
        href: "/inventory/purchase-returns",
        icon: <RotateCcw size={15} className="text-slate-500" />,
        priority: "secondary",
      },
    ],
  },
  {
    category: "ACCOUNTING",
    items: [
      {
        id: "create-expense",
        label: "Direct Expense",
        href: "/finance/expenses",
        icon: <Receipt size={15} className="text-blue-700" />,
        priority: "primary",
      },
      {
        id: "create-journal",
        label: "Journal Entry",
        href: "/finance/journal-entries",
        icon: <BookOpen size={15} className="text-blue-700" />,
        priority: "secondary",
      },
      {
        id: "create-transfer",
        label: "Account Transfer",
        href: "/finance/accounts",
        icon: <RefreshCw size={15} className="text-blue-700" />,
        priority: "secondary",
      },
      {
        id: "create-opening-balance",
        label: "Opening Balance",
        href: "/finance/journal-entries",
        icon: <Scale size={15} className="text-slate-400" />,
        priority: "advanced",
      },
    ],
  },
  {
    category: "OTHER",
    items: [
      {
        id: "create-credit-note",
        label: "Credit Note",
        href: "/commercial/credit-notes",
        icon: <FileText size={15} className="text-purple-700" />,
        priority: "advanced",
      },
      {
        id: "create-debit-note",
        label: "Debit Note",
        href: "/inventory/purchase-returns",
        icon: <Receipt size={15} className="text-purple-700" />,
        priority: "advanced",
      },
    ],
  },
];

export default function GlobalCreateMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isRestrictedViewer = user?.role === "VIEWER";
  if (isRestrictedViewer) return null;

  const leftGroups = ACTION_GROUPS.filter(
    (g) => g.category === "SALES" || g.category === "PURCHASES",
  );
  const rightGroups = ACTION_GROUPS.filter(
    (g) => g.category === "ACCOUNTING" || g.category === "OTHER",
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="global-create-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#28633a] hover:bg-[#1f4d2d] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[38px]"
        title="Create new financial document"
      >
        <Plus size={15} strokeWidth={2.5} />
        <span>Create</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="fixed md:absolute right-4 md:right-0 top-[70px] md:top-full mt-2 w-[92vw] sm:w-[480px] md:w-[500px] rounded-2xl border border-slate-200/90 p-4 animate-fade-in text-slate-800"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            zIndex: 99999,
            maxHeight: "calc(100vh - 90px)",
            overflowY: "auto",
            opacity: 1,
          }}
        >
          {/* Header */}
          <div className="pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Create Financial Document
              </span>
              <span className="text-[11px] text-slate-500">
                Select a document to create or record
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Column: Sales & Purchases */}
            <div className="space-y-4">
              {leftGroups.map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.category}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isPrimary = item.priority === "primary";
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          role="menuitem"
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition min-h-[36px] ${
                            isPrimary
                              ? "bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 font-bold text-slate-900 border border-slate-100"
                              : "hover:bg-slate-50 font-medium text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Accounting, Other */}
            <div className="space-y-4 sm:border-l sm:border-slate-100 sm:pl-4">
              {rightGroups.map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.category}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition min-h-[34px]"
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
