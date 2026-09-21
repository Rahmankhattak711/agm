"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  ShieldCheckIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";

export type ActionCategory =
  | "SALES"
  | "PURCHASES"
  | "COMPANY_DOCS"
  | "ACCOUNTING"
  | "MASTER_DATA";

export interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
  category: ActionCategory;
  badge?: string;
  badgeColor?: string;
  isPopular?: boolean;
}

export const CATEGORY_META: Record<
  ActionCategory,
  {
    title: string;
    accent: string;
    dot: string;
    iconBg: string;
    hover: string;
  }
> = {
  SALES: {
    title: "Sales & Revenue",
    accent: "text-agm-green",
    dot: "bg-agm-green",
    iconBg: "bg-agm-green-soft text-agm-green border-agm-box-border",
    hover: "hover:bg-agm-green-soft/40 hover:border-agm-green/40",
  },
  PURCHASES: {
    title: "Procurement & Payables",
    accent: "text-amber-800",
    dot: "bg-amber-600",
    iconBg: "bg-amber-50 text-amber-800 border-amber-200/80",
    hover: "hover:bg-amber-50/40 hover:border-amber-300",
  },
  COMPANY_DOCS: {
    title: "Company Documents",
    accent: "text-teal-800",
    dot: "bg-teal-600",
    iconBg: "bg-teal-50 text-teal-800 border-teal-200/80",
    hover: "hover:bg-teal-50/40 hover:border-teal-300",
  },
  ACCOUNTING: {
    title: "Accounting & General Ledger",
    accent: "text-agm-navy",
    dot: "bg-agm-navy",
    iconBg: "bg-blue-50 text-agm-navy border-blue-200/80",
    hover: "hover:bg-blue-50/40 hover:border-blue-300",
  },
  MASTER_DATA: {
    title: "Master Data & Registry",
    accent: "text-agm-text",
    dot: "bg-agm-muted",
    iconBg: "bg-agm-box-bg text-agm-text border-agm-box-border",
    hover: "hover:bg-agm-box-bg/80 hover:border-agm-box-border",
  },
};

export const CATEGORY_TABS: { key: "ALL" | ActionCategory; label: string }[] = [
  { key: "ALL", label: "All Actions" },
  { key: "SALES", label: "Sales & Revenue" },
  { key: "PURCHASES", label: "Purchases & Bills" },
  { key: "COMPANY_DOCS", label: "Company Documents" },
  { key: "ACCOUNTING", label: "Accounting" },
  { key: "MASTER_DATA", label: "Master Data" },
];

export const ACTION_ITEMS: ActionItem[] = [
  {
    id: "create-quotation",
    label: "Quotation",
    sublabel: "Create client price quote & BOQ",
    href: "/commercial/quotations",
    icon: <FileTextIcon size={16} className="text-agm-green" />,
    category: "SALES",
    badge: "Popular",
    badgeColor: "bg-agm-green-soft text-agm-green border-agm-green/30",
    isPopular: true,
  },
  {
    id: "create-sales-order",
    label: "Sales Order",
    sublabel: "Confirmed client contract/order",
    href: "/commercial/sales-orders",
    icon: <FileCheckIcon size={16} className="text-agm-green" />,
    category: "SALES",
  },
  {
    id: "create-sales-invoice",
    label: "Sales Invoice",
    sublabel: "Official UAE Tax invoice with 5% VAT",
    href: "/commercial/sales-invoices",
    icon: <ReceiptIcon size={16} className="text-agm-green" />,
    category: "SALES",
    badge: "Tax Inv",
    badgeColor: "bg-blue-50 text-agm-navy border-blue-200/70",
    isPopular: true,
  },
  {
    id: "create-receipt",
    label: "Customer Receipt",
    sublabel: "Record customer inbound payment",
    href: "/commercial/customer-payments",
    icon: <ArrowDownLeftIcon size={16} className="text-agm-green" />,
    category: "SALES",
  },
  {
    id: "create-credit-note",
    label: "Credit Note",
    sublabel: "Sales return or client scope deduction",
    href: "/commercial/credit-notes",
    icon: <RotateCcwIcon size={16} className="text-purple-600" />,
    category: "SALES",
  },

  {
    id: "create-agreement",
    label: "Company Agreement",
    sublabel: "Client & project legal contracts",
    href: "/commercial/agreements",
    icon: <FileCheckIcon size={16} className="text-teal-700" />,
    category: "COMPANY_DOCS",
    badge: "Legal",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200/70",
    isPopular: true,
  },
  {
    id: "create-salary-certificate",
    label: "Salary Certificate",
    sublabel: "Official salary proof & UAE bank letter",
    href: "/commercial/salary-certificates",
    icon: <FileTextIcon size={16} className="text-teal-700" />,
    category: "COMPANY_DOCS",
    badge: "Official",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    isPopular: true,
  },
  {
    id: "create-risk-assessment",
    label: "Risk Assessment",
    sublabel: "Site HSE hazards & risk matrix",
    href: "/commercial/risk-assessments",
    icon: <ShieldCheckIcon size={16} className="text-teal-700" />,
    category: "COMPANY_DOCS",
  },
  {
    id: "create-method-statement",
    label: "Method Statement",
    sublabel: "Technical work execution procedure",
    href: "/commercial/method-statements",
    icon: <FileTextIcon size={16} className="text-teal-700" />,
    category: "COMPANY_DOCS",
  },


  {
    id: "create-purchase-request",
    label: "Purchase Request",
    sublabel: "Site team material requisition",
    href: "/commercial/purchase-requests",
    icon: <ShoppingCartIcon size={16} className="text-amber-700" />,
    category: "PURCHASES",
  },
  {
    id: "create-po",
    label: "Purchase Order",
    sublabel: "Vendor order & pricing commitment",
    href: "/commercial/purchase-orders",
    icon: <ShoppingCartIcon size={16} className="text-amber-700" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-grn",
    label: "Goods Received (GRN)",
    sublabel: "Receive materials & update stock",
    href: "/commercial/goods-received",
    icon: <PackageIcon size={16} className="text-amber-700" />,
    category: "PURCHASES",
  },
  {
    id: "create-purchase-bill",
    label: "Supplier Bill",
    sublabel: "Vendor purchase invoice & Input VAT",
    href: "/commercial/supplier-bills",
    icon: <ReceiptIcon size={16} className="text-amber-700" />,
    category: "PURCHASES",
    isPopular: true,
  },
  {
    id: "create-supplier-payment",
    label: "Supplier Payment",
    sublabel: "Disburse vendor payment via bank/cheque",
    href: "/commercial/supplier-payments",
    icon: <ArrowUpRightIcon size={16} className="text-amber-700" />,
    category: "PURCHASES",
  },
  {
    id: "create-debit-note",
    label: "Debit Note",
    sublabel: "Purchase return / vendor deduction",
    href: "/commercial/debit-notes",
    icon: <RotateCcwIcon size={16} className="text-purple-600" />,
    category: "PURCHASES",
  },

  {
    id: "create-expense",
    label: "Direct Expense",
    sublabel: "Operational expense voucher",
    href: "/finance/expenses",
    icon: <CreditCardIcon size={16} className="text-agm-navy" />,
    category: "ACCOUNTING",
    isPopular: true,
  },
  {
    id: "create-journal",
    label: "Journal Entry",
    sublabel: "Manual double-entry GL adjustment",
    href: "/finance/journal-entries",
    icon: <BookOpenIcon size={16} className="text-agm-navy" />,
    category: "ACCOUNTING",
  },
  {
    id: "create-transfer",
    label: "Chart of Accounts",
    sublabel: "Manage general ledger accounts",
    href: "/finance/accounts",
    icon: <LayersIcon size={16} className="text-agm-navy" />,
    category: "ACCOUNTING",
  },

  {
    id: "create-customer",
    label: "New Customer",
    sublabel: "Add client profile & TRN number",
    href: "/commercial/customers",
    icon: <UserIcon size={16} className="text-teal-700" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-supplier",
    label: "New Supplier",
    sublabel: "Vendor directory & terms",
    href: "/inventory/suppliers",
    icon: <TruckIcon size={16} className="text-indigo-700" />,
    category: "MASTER_DATA",
  },
  {
    id: "create-product",
    label: "New Product / SKU",
    sublabel: "Add stock item, rates & categories",
    href: "/inventory/products",
    icon: <BoxesIcon size={16} className="text-slate-700" />,
    category: "MASTER_DATA",
  },
];

interface GlobalCreateTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const GlobalCreateTrigger: React.FC<GlobalCreateTriggerProps> = ({
  isOpen,
  onToggle,
}) => (
  <button
    type="button"
    id="global-create-button"
    aria-expanded={isOpen}
    aria-haspopup="true"
    onClick={onToggle}
    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-agm-green hover:bg-agm-green-2 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer min-h-[38px] border border-agm-green-2/40"
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
);

interface GlobalCreateHeaderProps {
  onClose: () => void;
}

export const GlobalCreateHeader: React.FC<GlobalCreateHeaderProps> = ({
  onClose,
}) => (
  <div className="flex-shrink-0 px-5 pt-4 pb-3.5 border-b border-agm-box-border/80 bg-agm-box-bg/70 flex items-center justify-between gap-3">
    <div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-agm-text">
          Quick Create
        </span>
      </div>
      <p className="text-[11px] text-agm-muted mt-0.5 font-normal">
        Select a voucher, order, or master entity
      </p>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="flex items-center justify-center w-7 h-7 rounded-lg text-agm-subtle hover:text-agm-text hover:bg-white transition-all cursor-pointer border border-transparent hover:border-agm-box-border"
    >
      <XIcon size={14} />
    </button>
  </div>
);

interface GlobalCreateSearchInputProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const GlobalCreateSearchInput: React.FC<
  GlobalCreateSearchInputProps
> = ({ searchQuery, onSearchChange, inputRef }) => (
  <div className="relative">
    <SearchIcon
      size={13}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-subtle"
    />
    <input
      ref={inputRef}
      type="text"
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search action (e.g., invoice, quotation, payment, bill)..."
      className="w-full pl-8.5 pr-8 py-2 text-xs bg-agm-box-bg/50 hover:bg-white focus:bg-white border border-agm-box-border focus:border-agm-green focus:ring-2 focus:ring-agm-green/10 rounded-xl outline-none font-normal transition placeholder:text-agm-subtle text-agm-text"
    />
    {searchQuery && (
      <button
        type="button"
        onClick={() => onSearchChange("")}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-agm-subtle hover:text-agm-text transition cursor-pointer"
      >
        <XIcon size={12} />
      </button>
    )}
  </div>
);

interface GlobalCreateCategoryPillsProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const GlobalCreateCategoryPills: React.FC<
  GlobalCreateCategoryPillsProps
> = ({ activeCategory, onSelectCategory }) => (
  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
    {CATEGORY_TABS.map((cat) => {
      const isActive = activeCategory === cat.key;
      return (
        <button
          key={cat.key}
          type="button"
          onClick={() => onSelectCategory(cat.key)}
          className={`px-3 py-1.5 rounded-xl text-[10.5px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
            isActive
              ? "bg-agm-green text-white border-agm-green shadow-xs"
              : "bg-agm-box-bg text-agm-muted border-agm-box-border hover:bg-white hover:text-agm-text"
          }`}
        >
          {cat.label}
        </button>
      );
    })}
  </div>
);

interface GlobalCreateActionCardProps {
  item: ActionItem;
  onSelect: () => void;
}

export const GlobalCreateActionCard: React.FC<GlobalCreateActionCardProps> = ({
  item,
  onSelect,
}) => {
  const meta = CATEGORY_META[item.category];

  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className={`group flex items-start gap-3 p-3 rounded-xl border border-agm-box-border/80 bg-white ${meta.hover} transition-all duration-150 relative shadow-2xs hover:shadow-xs`}
    >
      <div
        className={`w-8 h-8 rounded-xl ${meta.iconBg} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-agm-text group-hover:text-agm-green truncate">
            {item.label}
          </span>
          {item.badge && (
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border flex-shrink-0 ${item.badgeColor}`}
            >
              {item.badge}
            </span>
          )}
        </div>
        {item.sublabel && (
          <p className="text-[11px] text-agm-muted truncate mt-0.5">
            {item.sublabel}
          </p>
        )}
      </div>
    </Link>
  );
};

export const GlobalCreateEmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="w-10 h-10 rounded-2xl bg-agm-box-bg border border-agm-box-border flex items-center justify-center mx-auto mb-3">
      <SearchIcon size={18} className="text-agm-subtle" />
    </div>
    <p className="text-xs font-semibold text-agm-text">
      No matching action found
    </p>
    <p className="text-[11px] text-agm-muted mt-1">
      Try &quot;quotation&quot;, &quot;bill&quot;, or &quot;customer&quot;
    </p>
  </div>
);

export const GlobalCreateFooter: React.FC = () => (
  <div className="flex-shrink-0 px-5 py-2.5 border-t border-agm-box-border/80 bg-agm-box-bg/60 flex items-center justify-between text-[11px] text-agm-muted font-normal">
    <span className="flex items-center gap-1.5">
      Tip: Press{" "}
      <kbd className="px-1.5 py-0.5 rounded-md bg-white text-agm-text font-mono text-[9px] border border-agm-box-border shadow-2xs">
        Ctrl+K
      </kbd>{" "}
      to open anytime
    </span>
    <span className="text-agm-subtle text-[10px]">AGM Command Center</span>
  </div>
);

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
      <GlobalCreateTrigger
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div
          role="menu"
          className="fixed md:absolute right-4 md:right-0 top-[76px] md:top-full mt-2 w-[94vw] sm:w-[580px] md:w-[620px] rounded-2xl overflow-hidden border border-agm-box-border bg-white animate-in fade-in slide-in-from-top-2 duration-200 text-agm-text flex flex-col shadow-2xl shadow-slate-900/15"
          style={{
            zIndex: 99999,
            maxHeight: "calc(100vh - 95px)",
          }}
        >
          <GlobalCreateHeader onClose={() => setIsOpen(false)} />

          <div className="flex-shrink-0 px-5 py-3 space-y-2.5 border-b border-agm-box-border/80 bg-white">
            <GlobalCreateSearchInput
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              inputRef={searchInputRef}
            />

            <GlobalCreateCategoryPills
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-4 bg-white">
            {filteredItems.length === 0 ? (
              <GlobalCreateEmptyState />
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
                    <div className="flex items-center gap-2 px-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`}
                      />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${meta.accent}`}
                      >
                        {meta.title}
                      </span>
                      <span className="h-px flex-1 bg-agm-box-border/60" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {itemsInCat.map((item) => (
                        <GlobalCreateActionCard
                          key={item.id}
                          item={item}
                          onSelect={() => setIsOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <GlobalCreateFooter />
        </div>
      )}
    </div>
  );
}
