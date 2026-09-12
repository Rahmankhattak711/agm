"use client";

import { useAuth } from "@/context/AuthContext";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BoxesIcon,
  ChevronDownIcon,
  CreditCardIcon,
  FileCheckIcon,
  FileTextIcon,
  LayersIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  RotateCcwIcon,
  SearchIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";
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
    icon: <FileTextIcon size={16} className="text-emerald-500" />,
    category: "SALES",
    badge: "Popular",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    isPopular: true,
  },
  {
    id: "create-sales-order",
    label: "Sales Order",
    sublabel: "Confirmed client contract/order",
    href: "/commercial/sales-orders",
    icon: <FileCheckIcon size={16} className="text-emerald-500" />,
    category: "SALES",
  },
  {
    id: "create-sales-invoice",
    label: "Sales Invoice",
    sublabel: "Official UAE Tax invoice with 5% VAT",
    href: "/commercial/sales-invoices",
    icon: <ReceiptIcon size={16} className="text-emerald-500" />,
    category: "SALES",
    badge: "Tax Inv",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    isPopular: true,
  },
  {
    id: "create-receipt",
    label: "Customer Receipt",
    sublabel: "Record customer inbound payment",
    href: "/commercial/customer-payments",
    icon: <ArrowDownLeftIcon size={16} className="text-emerald-500" />,
    category: "SALES",
  },
  {
    id: "create-credit-note",
    label: "Credit Note",
    sublabel: "Sales return or client scope deduction",
    href: "/commercial/credit-notes",
    icon: <RotateCcwIcon size={16} className="text-purple-400" />,
    category: "SALES",
  },

  {
    id: "create-purchase-request",
    label: "Purchase Request",
    sublabel: "Site team material requisition",
    href: "/commercial/purchase-requests",
    icon: <ShoppingCartIcon size={16} className="text-amber-400" />,
    category: "PURCHASES",
  },
  {
    id: "create-po",
    label: "Purchase Order",
    sublabel: "Vendor order & pricing commitment",
    href: "/commercial/purchase-orders",
    icon: <ShoppingCartIcon size={16} className="text-amber-400" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-grn",
    label: "Goods Received (GRN)",
    sublabel: "Receive materials & update stock",
    href: "/commercial/goods-received",
    icon: <PackageIcon size={16} className="text-amber-400" />,
    category: "PURCHASES",
  },
  {
    id: "create-purchase-bill",
    label: "Supplier Bill",
    sublabel: "Vendor purchase invoice & Input VAT",
    href: "/commercial/supplier-bills",
    icon: <ReceiptIcon size={16} className="text-amber-400" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-supplier-payment",
    label: "Supplier Payment",
    sublabel: "Disburse vendor payment via bank/cheque",
    href: "/commercial/supplier-payments",
    icon: <ArrowUpRightIcon size={16} className="text-amber-400" />,
    category: "PURCHASES",
  },
  {
    id: "create-debit-note",
    label: "Debit Note",
    sublabel: "Purchase return / vendor deduction",
    href: "/commercial/debit-notes",
    icon: <RotateCcwIcon size={16} className="text-purple-400" />,
    category: "PURCHASES",
  },

  {
    id: "create-expense",
    label: "Direct Expense",
    sublabel: "Operational expense voucher",
    href: "/finance/expenses",
    icon: <CreditCardIcon size={16} className="text-blue-400" />,
    category: "ACCOUNTING",
    isPopular: true,
  },
  {
    id: "create-journal",
    label: "Journal Entry",
    sublabel: "Manual double-entry GL adjustment",
    href: "/finance/journal-entries",
    icon: <BookOpenIcon size={16} className="text-blue-400" />,
    category: "ACCOUNTING",
  },
  {
    id: "create-transfer",
    label: "Chart of Accounts",
    sublabel: "Manage general ledger accounts",
    href: "/finance/accounts",
    icon: <LayersIcon size={16} className="text-blue-400" />,
    category: "ACCOUNTING",
  },

  {
    id: "create-customer",
    label: "New Customer",
    sublabel: "Add client profile & TRN number",
    href: "/commercial/customers",
    icon: <UserIcon size={16} className="text-teal-400" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-supplier",
    label: "New Supplier",
    sublabel: "Vendor directory & terms",
    href: "/inventory/suppliers",
    icon: <TruckIcon size={16} className="text-indigo-400" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-product",
    label: "New Product / SKU",
    sublabel: "Add stock item, rates & categories",
    href: "/inventory/products",
    icon: <BoxesIcon size={16} className="text-slate-400" />,
    category: "MASTER_DATA",
  },
];

const CATEGORY_META = {
  SALES: {
    title: "Sales & Revenue",
    accent: "text-emerald-400",
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    hover: "hover:bg-emerald-500/8 hover:border-emerald-500/25",
  },
  PURCHASES: {
    title: "Procurement & Payables",
    accent: "text-amber-400",
    dot: "bg-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    hover: "hover:bg-amber-500/8 hover:border-amber-500/25",
  },
  ACCOUNTING: {
    title: "Accounting & General Ledger",
    accent: "text-blue-400",
    dot: "bg-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    hover: "hover:bg-blue-500/8 hover:border-blue-500/25",
  },
  MASTER_DATA: {
    title: "Master Data & Registry",
    accent: "text-slate-400",
    dot: "bg-slate-500",
    iconBg: "bg-slate-500/10 border-slate-500/20",
    hover: "hover:bg-slate-500/8 hover:border-slate-500/25",
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
      {/* Trigger Button */}
      <button
        type="button"
        id="global-create-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 hover:shadow-emerald-700/40 active:scale-95 cursor-pointer min-h-[38px] border border-emerald-400/20"
        title="Create new document or record (Ctrl+K)"
      >
        <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
          <PlusIcon size={12} strokeWidth={2.5} />
        </span>
        <span className="tracking-wide">Create</span>
        <ChevronDownIcon
          size={13}
          className={`transition-transform duration-200 opacity-80 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Modal Panel */}
      {isOpen && (
        <div
          role="menu"
          className="fixed md:absolute right-4 md:right-0 top-[76px] md:top-full mt-2 w-[94vw] sm:w-[580px] md:w-[620px] rounded-2xl overflow-hidden border border-white/12 animate-in fade-in slide-in-from-top-2 duration-200 text-white flex flex-col"
          style={{
            zIndex: 99999,
            maxHeight: "calc(100vh - 95px)",
            background: "linear-gradient(180deg, #2c455a 0%, #233a4d 45%, #1d3345 100%)",
            boxShadow: "4px 0 28px rgba(38,59,77,0.35), 0 32px 64px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-4 pb-3.5 border-b border-white/10 flex items-center justify-between gap-3" style={{ background: "linear-gradient(135deg, #3f5d72 0%, #2c4a5c 100%)" }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-white">
                  Quick Create
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/25">
                  <SparklesIcon size={9} />
                  Command Center
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Select a voucher, order, or master entity
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-7 h-7 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Search + Category Filters */}
          <div className="flex-shrink-0 px-5 py-3 space-y-2.5 border-b border-white/10">
            {/* Search */}
            <div className="relative">
              <SearchIcon
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action (e.g., invoice, quotation, payment, bill)..."
                className="w-full pl-8.5 pr-8 py-2 text-xs bg-white/8 hover:bg-white/12 focus:bg-white/15 border border-white/15 focus:border-emerald-300/50 rounded-xl outline-none font-medium transition placeholder:text-white/30 text-white [color-scheme:dark]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                  className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    activeCategory === cat.key
                      ? "bg-white/20 text-white border-white/30 shadow-sm"
                      : "bg-white/6 text-white/50 border-white/10 hover:bg-white/12 hover:text-white/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Items Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <SearchIcon size={18} className="text-slate-600" />
                </div>
                <p className="text-xs font-bold text-slate-400">
                  No matching action found
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Try &quot;quotation&quot;, &quot;bill&quot;, or &quot;customer&quot;
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
                  <div key={catKey} className="space-y-2">
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${meta.accent}`}>
                        {meta.title}
                      </span>
                      <span className="h-px flex-1 bg-white/6" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {itemsInCat.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`group flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/6 ${meta.hover} transition-all duration-150 relative`}
                        >
                          <div className={`w-8 h-8 rounded-xl ${meta.iconBg} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${item.badgeColor}`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.sublabel && (
                              <p className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate mt-0.5">
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

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30 font-medium" style={{ background: "rgba(29,51,69,0.8)" }}>
            <span className="flex items-center gap-1.5">
              Tip: Press{" "}
              <kbd className="px-1.5 py-0.5 rounded-lg bg-white/10 text-white/60 font-mono text-[9px] border border-white/15">
                Ctrl+K
              </kbd>{" "}
              to open anytime
            </span>
            <span className="text-white/25">AGM Command Center</span>
          </div>
        </div>
      )}
    </div>
  );
}
