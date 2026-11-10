"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FilePlus,
  ShoppingCart,
  PackageCheck,
  Receipt,
  Banknote,
  Users,
  Boxes,
  RotateCcw,
} from "lucide-react";

interface QuickNavItem {
  id: string;
  label: string;
  href: string;
  aliases?: string[];
  icon: React.ComponentType<{ className?: string }>;
  step?: string;
}

const PROCUREMENT_STEPS: QuickNavItem[] = [
  {
    id: "requests",
    label: "Purchase Requests",
    href: "/commercial/purchase-requests",
    icon: FilePlus,
    step: "1",
  },
  {
    id: "orders",
    label: "Purchase Orders",
    href: "/inventory/purchase-orders",
    aliases: ["/commercial/purchase-orders"],
    icon: ShoppingCart,
    step: "2",
  },
  {
    id: "grn",
    label: "Goods Received (GRN)",
    href: "/commercial/goods-received",
    icon: PackageCheck,
    step: "3",
  },
  {
    id: "bills",
    label: "Purchase Bills",
    href: "/commercial/supplier-bills",
    aliases: ["/inventory/supplier-bills"],
    icon: Receipt,
    step: "4",
  },
  {
    id: "payments",
    label: "Supplier Payments",
    href: "/commercial/supplier-payments",
    icon: Banknote,
    step: "5",
  },
];

const PROCUREMENT_MASTERS: QuickNavItem[] = [
  {
    id: "vendors",
    label: "Vendors",
    href: "/inventory/suppliers",
    aliases: ["/commercial/suppliers"],
    icon: Users,
  },
  {
    id: "products",
    label: "Shop Products & SKU",
    href: "/inventory/products",
    aliases: ["/commercial/products"],
    icon: Boxes,
  },
  {
    id: "returns",
    label: "Purchase Returns",
    href: "/inventory/purchase-returns",
    aliases: ["/commercial/purchase-returns"],
    icon: RotateCcw,
  },
];

export default function ProcurementQuickNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isItemActive = (item: QuickNavItem) => {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return true;
    }
    if (item.aliases) {
      return item.aliases.some(
        (a) => pathname === a || pathname.startsWith(`${a}/`),
      );
    }
    return false;
  };

  return (
    <div
      className="rounded-xl p-2 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs select-none print:hidden"
      style={{ border: "1px solid #cbd5e1" }}
    >
      {/* Left: 5 Procurement Lifecycle Steps */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-400 mr-1 pl-1">
          Procurement Cycle:
        </span>
        {PROCUREMENT_STEPS.map((item) => {
          const active = isItemActive(item);
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !active && router.push(item.href)}
              style={
                active
                  ? {
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }
              }
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                active
                  ? "font-medium cursor-default shadow-2xs"
                  : "font-normal hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${active ? "text-[#1d4ed8]" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Master Data & Returns */}
      <div className="flex items-center gap-1.5 flex-wrap border-t md:border-t-0 pt-1.5 md:pt-0 border-slate-100">
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-400 mr-1 pl-1 hidden lg:inline">
          Related:
        </span>
        {PROCUREMENT_MASTERS.map((item) => {
          const active = isItemActive(item);
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !active && router.push(item.href)}
              style={
                active
                  ? {
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }
              }
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                active
                  ? "font-medium cursor-default shadow-2xs"
                  : "font-normal hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${active ? "text-[#1d4ed8]" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

