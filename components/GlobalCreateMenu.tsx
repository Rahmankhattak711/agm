"use client";

import { useAuth } from "@/context/AuthContext";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Box,
  ChevronDown,
  CreditCard,
  FileCheck,
  FileText,
  Layers,
  PackageCheck,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
  category: "SALES" | "PURCHASES" | "ACCOUNTING" | "MASTER_DATA";
  badge?: string;
  badgeColor?: string;
  isPopular?: boolean;
}

const ACTION_ITEMS: ActionItem[] = [
  {
    id: "create-quotation",
    label: "Quotation",
    sublabel: "Create client price quote & BOQ",
    href: "/commercial/quotations",
    icon: <FileText size={16} className="text-emerald-600" />,
    category: "SALES",
    badge: "Popular",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isPopular: true,
  },
  {
    id: "create-sales-order",
    label: "Sales Order",
    sublabel: "Confirmed client contract/order",
    href: "/commercial/sales-orders",
    icon: <FileCheck size={16} className="text-emerald-600" />,
    category: "SALES",
  },
  {
    id: "create-sales-invoice",
    label: "Sales Invoice",
    sublabel: "Official UAE Tax invoice with 5% VAT",
    href: "/commercial/sales-invoices",
    icon: <Receipt size={16} className="text-emerald-600" />,
    category: "SALES",
    badge: "Tax Inv",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isPopular: true,
  },
  {
    id: "create-receipt",
    label: "Customer Receipt",
    sublabel: "Record customer inbound payment",
    href: "/commercial/customer-payments",
    icon: <ArrowDownLeft size={16} className="text-emerald-600" />,
    category: "SALES",
  },
  {
    id: "create-credit-note",
    label: "Credit Note",
    sublabel: "Sales return or client scope deduction",
    href: "/commercial/credit-notes",
    icon: <RotateCcw size={16} className="text-purple-600" />,
    category: "SALES",
  },

  {
    id: "create-purchase-request",
    label: "Purchase Request",
    sublabel: "Site team material requisition",
    href: "/commercial/purchase-requests",
    icon: <ShoppingCart size={16} className="text-amber-600" />,
    category: "PURCHASES",
  },
  {
    id: "create-po",
    label: "Purchase Order",
    sublabel: "Vendor order & pricing commitment",
    href: "/commercial/purchase-orders",
    icon: <ShoppingCart size={16} className="text-amber-600" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-grn",
    label: "Goods Received (GRN)",
    sublabel: "Receive materials & update stock",
    href: "/commercial/goods-received",
    icon: <PackageCheck size={16} className="text-amber-600" />,
    category: "PURCHASES",
  },
  {
    id: "create-purchase-bill",
    label: "Supplier Bill",
    sublabel: "Vendor purchase invoice & Input VAT",
    href: "/commercial/supplier-bills",
    icon: <Receipt size={16} className="text-amber-600" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-supplier-payment",
    label: "Supplier Payment",
    sublabel: "Disburse vendor payment via bank/cheque",
    href: "/commercial/supplier-payments",
    icon: <ArrowUpRight size={16} className="text-amber-600" />,
    category: "PURCHASES",
  },
  {
    id: "create-debit-note",
    label: "Debit Note",
    sublabel: "Purchase return / vendor deduction",
    href: "/commercial/debit-notes",
    icon: <RotateCcw size={16} className="text-purple-600" />,
    category: "PURCHASES",
  },

  {
    id: "create-expense",
    label: "Direct Expense",
    sublabel: "Operational expense voucher",
    href: "/finance/expenses",
    icon: <CreditCard size={16} className="text-blue-600" />,
    category: "ACCOUNTING",
    isPopular: true,
  },
  {
    id: "create-journal",
    label: "Journal Entry",
    sublabel: "Manual double-entry GL adjustment",
    href: "/finance/journal-entries",
    icon: <BookOpen size={16} className="text-blue-600" />,
    category: "ACCOUNTING",
  },
  {
    id: "create-transfer",
    label: "Chart of Accounts",
    sublabel: "Manage general ledger accounts",
    href: "/finance/accounts",
    icon: <Layers size={16} className="text-blue-600" />,
    category: "ACCOUNTING",
  },

  {
    id: "create-customer",
    label: "New Customer",
    sublabel: "Add client profile & TRN number",
    href: "/commercial/customers",
    icon: <Users size={16} className="text-teal-600" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-supplier",
    label: "New Supplier",
    sublabel: "Vendor directory & terms",
    href: "/inventory/suppliers",
    icon: <Truck size={16} className="text-indigo-600" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-product",
    label: "New Product / SKU",
    sublabel: "Add stock item, rates & categories",
    href: "/inventory/products",
    icon: <Box size={16} className="text-slate-600" />,
    category: "MASTER_DATA",
  },
];

const CATEGORY_META = {
  SALES: {
    title: "Sales & Revenue",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50/70",
    borderColor: "border-emerald-100",
  },
  PURCHASES: {
    title: "Procurement & Payables",
    color: "text-amber-700",
    bgColor: "bg-amber-50/70",
    borderColor: "border-amber-100",
  },
  ACCOUNTING: {
    title: "Accounting & General Ledger",
    color: "text-blue-700",
    bgColor: "bg-blue-50/70",
    borderColor: "border-blue-100",
  },
  MASTER_DATA: {
    title: "Master Data & Registry",
    color: "text-slate-700",
    bgColor: "bg-slate-50/70",
    borderColor: "border-slate-100",
  },
};

export default function GlobalCreateMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setActiveCategory("ALL");
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    return ACTION_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const isRestrictedViewer = user?.role === "VIEWER";
  if (isRestrictedViewer) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {}
      <button
        type="button"
        id="global-create-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#28633a] to-[#1f4d2d] hover:from-[#215330] hover:to-[#173b22] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer min-h-[38px] border border-emerald-600/30"
        title="Create new document or record (Ctrl+K)"
      >
        <span className="w-5 h-5 rounded-lg bg-white/15 flex items-center justify-center">
          <Plus size={13} strokeWidth={2.5} />
        </span>
        <span className="tracking-wide">Create</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 opacity-80 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="fixed md:absolute right-4 md:right-0 top-[76px] md:top-full mt-2 w-[94vw] sm:w-[580px] md:w-[620px] rounded-2xl border border-slate-200/90 bg-white shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800 flex flex-col overflow-hidden"
          style={{
            zIndex: 99999,
            maxHeight: "calc(100vh - 95px)",
            boxShadow:
              "0 20px 45px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="flex-shrink-0 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Quick Create Command Center
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <Sparkles size={10} /> Fast Action
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5 font-medium">
                Select a financial voucher, commercial order, or master entity
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-shrink-0 py-2.5 space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action (e.g., invoice, quotation, payment, bill)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 focus:border-emerald-600 rounded-xl outline-none font-medium transition placeholder:text-slate-400 text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "ALL", label: "All Actions" },
                { key: "SALES", label: "Sales & Revenue" },
                { key: "PURCHASES", label: "Purchases & Bills" },
                { key: "ACCOUNTING", label: "Accounting" },
                { key: "MASTER_DATA", label: "Master Data" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-4 pt-1 pb-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs font-bold text-slate-700">
                  No matching action found
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try searching for &quot;quotation&quot;, &quot;bill&quot;, or
                  &quot;customer&quot;
                </p>
              </div>
            ) : (
              (
                Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]
              ).map((catKey) => {
                const itemsInCat = filteredItems.filter(
                  (it) => it.category === catKey,
                );
                if (itemsInCat.length === 0) return null;

                const meta = CATEGORY_META[catKey];

                return (
                  <div key={catKey} className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}
                      >
                        {meta.title}
                      </span>
                      <span className="h-[1px] flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {itemsInCat.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/40 transition-all duration-150 relative"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 group-hover:border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.sublabel && (
                              <p className="text-[10px] text-slate-500 group-hover:text-slate-600 truncate mt-0.5">
                                {item.sublabel}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex-shrink-0 pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400 font-medium px-1">
            <span>
              Tip: Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] border border-slate-200">
                Ctrl+K
              </kbd>{" "}
              to open anytime
            </span>
            <span className="text-slate-400">AGM Financial Command Center</span>
          </div>
        </div>
      )}
    </div>
  );
}
