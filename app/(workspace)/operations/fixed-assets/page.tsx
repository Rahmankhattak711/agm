"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAssets, FixedAsset } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingDown,
  Plus,
  Search,
  RefreshCw,
  Eye,
  MoreVertical,
  BookOpen,
  Printer as PrintIcon,
  Download,
  X,
  Image as ImageIcon,
} from "lucide-react";
import FixedAssetDetailModal from "./components/FixedAssetDetailModal";

const ASSET_CATEGORIES = [
  { value: "ALL", label: "All asset classes" },
  { value: "COMPUTER_HARDWARE", label: "IT & Hardware" },
  { value: "COMPANY_VEHICLE", label: "Company Vehicles" },
  { value: "OFFICE_EQUIPMENT", label: "Office Equipment" },
  { value: "MACHINERY_EQUIPMENT", label: "Machinery & Tools" },
  { value: "FURNITURE_FIXTURES", label: "Furniture & Fixtures" },
  { value: "LEASEHOLD_IMPROVEMENT", label: "Leasehold Improvements" },
];

function getCategoryBadgeStyle(category: string): {
  label: string;
  style: React.CSSProperties;
} {
  switch (category) {
    case "COMPUTER_HARDWARE":
      return {
        label: "IT & HARDWARE",
        style: {
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          border: "1px solid #bae6fd",
        },
      };
    case "COMPANY_VEHICLE":
      return {
        label: "COMPANY VEHICLE",
        style: {
          backgroundColor: "#fef3c7",
          color: "#b45309",
          border: "1px solid #fde68a",
        },
      };
    case "OFFICE_EQUIPMENT":
      return {
        label: "OFFICE EQUIPMENT",
        style: {
          backgroundColor: "#ffedd5",
          color: "#c2410c",
          border: "1px solid #fed7aa",
        },
      };
    case "MACHINERY_EQUIPMENT":
      return {
        label: "MACHINERY & TOOLS",
        style: {
          backgroundColor: "#fce7f3",
          color: "#be185d",
          border: "1px solid #fbcfe8",
        },
      };
    case "FURNITURE_FIXTURES":
      return {
        label: "FURNITURE",
        style: {
          backgroundColor: "#f3e8ff",
          color: "#7e22ce",
          border: "1px solid #e9d5ff",
        },
      };
    case "LEASEHOLD_IMPROVEMENT":
      return {
        label: "LEASEHOLD",
        style: {
          backgroundColor: "#dcfce7",
          color: "#15803d",
          border: "1px solid #bbf7d0",
        },
      };
    default:
      return {
        label: category?.replace(/_/g, " ") || "ACTIVE ASSET",
        style: {
          backgroundColor: "#fef3c7",
          color: "#b45309",
          border: "1px solid #fde68a",
        },
      };
  }
}

export default function FixedAssetsPage() {
  const router = useRouter();
  const { data: assets = [], isLoading, error, refetch, isFetching } = useAssets();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    asset: FixedAsset;
    top: number;
    right: number;
    openUpwards?: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", () => setActiveMenu(null), true);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", () => setActiveMenu(null), true);
    };
  }, [activeMenu]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, asset: FixedAsset) => {
    e.stopPropagation();
    if (activeMenu?.id === asset.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 180;
    const top = openUpwards ? rect.top : rect.bottom + 6;
    setActiveMenu({ id: asset.id, asset, top, right, openUpwards });
  };

  // Financial aggregates
  const metrics = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let totalCost = 0;
    let totalNetBook = 0;
    let totalAccumDepr = 0;
    let totalAnnualDepr = 0;

    (assets || []).forEach((a) => {
      const c = Number(a.cost || 0);
      const s = Number(a.salvageValue || 0);
      const r = Number(a.depreciationRate || 20) / 100;
      const annualDepr = Math.max(0, (c - s) * r);
      const purchaseYear = new Date(a.purchaseDate).getFullYear();
      const yearsElapsed = Math.max(0, currentYear - purchaseYear);
      const accum = Math.min(c - s, annualDepr * yearsElapsed);
      const netBook = Math.max(s, c - accum);

      totalCost += c;
      totalNetBook += netBook;
      totalAccumDepr += Math.max(0, c - netBook);
      totalAnnualDepr += annualDepr;
    });

    return {
      totalCost,
      totalNetBook,
      totalAccumDepr,
      totalAnnualDepr,
      totalCount: assets.length,
    };
  }, [assets]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return (assets || []).filter((a) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.assetCode.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q) ||
        (a.assignedTo && a.assignedTo.toLowerCase().includes(q)) ||
        (a.registrationNumber && a.registrationNumber.toLowerCase().includes(q));
      const matchesCat =
        selectedCategory === "ALL" || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [assets, search, selectedCategory]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredAssets.length) return;
    const currentYear = new Date().getFullYear();
    const rows = [
      [
        "Asset Code",
        "Asset Name",
        "Category",
        "Acquisition Date",
        "Historical Cost (AED)",
        "Depreciation Rate",
        "Net Book Value (AED)",
        "Custodian",
      ],
      ...filteredAssets.map((a) => {
        const c = Number(a.cost || 0);
        const s = Number(a.salvageValue || 0);
        const r = Number(a.depreciationRate || 20) / 100;
        const annualDepr = Math.max(0, (c - s) * r);
        const purchaseYear = new Date(a.purchaseDate).getFullYear();
        const yearsElapsed = Math.max(0, currentYear - purchaseYear);
        const accum = Math.min(c - s, annualDepr * yearsElapsed);
        const netBook = Math.max(s, c - accum);
        return [
          a.assetCode,
          `"${a.assetName.replace(/"/g, '""')}"`,
          a.category,
          new Date(a.purchaseDate).toISOString().split("T")[0],
          c,
          `${a.depreciationRate}%`,
          netBook,
          `"${(a.assignedTo || "").replace(/"/g, '""')}"`,
        ];
      }),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fixed_assets_register_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div>
          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            Fixed Assets
          </h1>
          <p className="text-[11.5px] font-normal text-slate-500 mt-0.5">
            Register, manage, and track capital assets and straight-line depreciation schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!filteredAssets.length}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/operations/fixed-assets/new")}
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH & FILTER BOX
          ========================================================================= */}
      <div
        className="rounded-xl p-3 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2.5">
          {/* Search Input */}
          <div className="flex-1">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search asset title, code, or custodian..."
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Class Filter */}
          <div className="w-full md:w-56">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              ASSET CLASS
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search & Refresh Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                refetch();
              }}
              disabled={isFetching}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
              title="Reset & Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS (LIGHT COLOR + CLEAR BORDERS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Soft Slate-Blue Tint */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL ASSETS
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
              {metrics.totalCount}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              {formatAed(metrics.totalCost)}
            </span>
          </div>
        </div>

        {/* Card 2: Soft Warm Yellow/Amber Tint */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#fef9c3",
              color: "#a16207",
              border: "1px solid #fde047",
            }}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              HISTORICAL COST
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(metrics.totalCost)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Gross acquisition cost
            </span>
          </div>
        </div>

        {/* Card 3: Soft Mint/Green Tint */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              NET BOOK VALUE
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(metrics.totalNetBook)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              100% Capitalized
            </span>
          </div>
        </div>

        {/* Card 4: Soft Rose/Pink Tint */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffe4e6",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
          >
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              ACCUMULATED DEPR.
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(metrics.totalAccumDepr)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block whitespace-nowrap">
              Annual: {formatAed(metrics.totalAnnualDepr)}/yr
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. ASSET RECORDS TABLE WITH LIGHT-BLUE HEADER BAR
          ========================================================================= */}
      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50/60 rounded-xl border border-rose-200">
          Error loading fixed assets: {(error as any).message}
        </div>
      ) : (
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: "1px solid #cbd5e1" }}
        >
          {/* Soft Light-Blue Top Bar */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{
              backgroundColor: "#f4f7fb",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <h3 className="text-xs font-semibold text-slate-800">
              Asset records
            </h3>
            <span className="text-[11px] text-slate-500 font-normal">
              {filteredAssets.length} {filteredAssets.length === 1 ? "record" : "records"}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <th className="py-2.5 px-4 whitespace-nowrap">ASSET / DATE</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">CUSTODIAN</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">SERIAL / REG NO.</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">COST / DEPR / NBV</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">CLASS / FILE</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap print:hidden">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs font-normal">Loading asset records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1 max-w-sm mx-auto">
                        <h4 className="font-medium text-slate-700 text-xs">
                          No asset records found
                        </h4>
                        <p className="text-[11px] font-normal text-slate-400">
                          {search.trim() || selectedCategory !== "ALL"
                            ? "No assets matched your search criteria."
                            : "Click '+ Register Asset' to add your first capital asset."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const costNum = Number(asset.cost || 0);
                    const salvageNum = Number(asset.salvageValue || 0);
                    const deprNum = Number(asset.depreciationRate || 20) / 100;
                    const annualDepr = (costNum - salvageNum) * deprNum;
                    const currentYear = new Date().getFullYear();
                    const purchaseYear = new Date(asset.purchaseDate).getFullYear();
                    const years = Math.max(0, currentYear - purchaseYear);
                    const accum = Math.min(costNum - salvageNum, annualDepr * years);
                    const netBook = Math.max(salvageNum, costNum - accum);
                    const badge = getCategoryBadgeStyle(asset.category);

                    const formattedDate = new Date(asset.purchaseDate)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(/ /g, "-");

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {/* ASSET / DATE */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {asset.imageUrl && asset.imageUrl.startsWith("data:image") && (
                              <img
                                src={asset.imageUrl}
                                alt={asset.assetName}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <div>
                              <div
                                className="font-medium text-xs uppercase"
                                style={{ color: "#1d4ed8" }}
                              >
                                {asset.assetName}
                              </div>
                              <div className="text-slate-500 text-[11px] font-normal">
                                {asset.assetCode}
                              </div>
                              <div className="text-slate-400 text-[10.5px] font-normal">
                                {formattedDate}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CUSTODIAN */}
                        <td className="py-2.5 px-4">
                          <div className="font-normal text-slate-800 text-xs">
                            {asset.assignedTo || "General Operations"}
                          </div>
                          <div className="text-[9.5px] font-normal uppercase tracking-wide text-slate-400 mt-0.5">
                            ASSET CUSTODIAN
                          </div>
                        </td>

                        {/* SERIAL / REG NO */}
                        <td className="py-2.5 px-4 text-slate-600 font-normal">
                          <div className="text-xs">{asset.registrationNumber || "-"}</div>
                          <div className="text-slate-400 text-[10.5px]">
                            {asset.plateNumber || asset.chassisNumber || "-"}
                          </div>
                        </td>

                        {/* COST / DEPR / NBV */}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-xs">
                            {formatAed(netBook)}
                          </div>
                          <div className="text-[10.5px] font-normal text-slate-500">
                            Cost: {formatAed(costNum)}
                          </div>
                          <div className="text-[10.5px] font-normal text-slate-500">
                            Depr: {Number(asset.depreciationRate)}%/yr
                          </div>
                        </td>

                        {/* CLASS / FILE */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div>
                            <span
                              style={badge.style}
                              className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide"
                            >
                              {badge.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAsset(asset);
                            }}
                            style={{ color: "#1d4ed8" }}
                            className="text-[11px] font-medium hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            {asset.imageUrl ? (
                              <>
                                <ImageIcon className="w-3 h-3" />
                                <span>View file</span>
                              </>
                            ) : (
                              <span>View schedule</span>
                            )}
                          </button>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-2.5 px-4 text-right print:hidden whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedAsset(asset)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (asset.assetAccountId) {
                                  router.push(
                                    `/finance/general-ledger?accountId=${asset.assetAccountId}`
                                  );
                                } else {
                                  router.push(`/finance/general-ledger`);
                                }
                              }}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View in General Ledger"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenMenu(e, asset)}
                              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                activeMenu?.id === asset.id
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title="More actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating 3-Dots Portal Dropdown */}
      {activeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: activeMenu.openUpwards ? undefined : `${activeMenu.top}px`,
              bottom: activeMenu.openUpwards
                ? `${window.innerHeight - activeMenu.top}px`
                : undefined,
              right: `${activeMenu.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] rounded-xl bg-white border border-slate-200/90 shadow-lg p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
          >
            <button
              type="button"
              onClick={() => {
                const asset = activeMenu.asset;
                setActiveMenu(null);
                setSelectedAsset(asset);
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">View Asset Details</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const asset = activeMenu.asset;
                setActiveMenu(null);
                if (asset.assetAccountId) {
                  router.push(`/finance/general-ledger?accountId=${asset.assetAccountId}`);
                } else {
                  router.push(`/finance/general-ledger`);
                }
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg font-normal text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">View in General Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                window.print();
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg font-normal text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <PrintIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Print Asset Voucher</span>
            </button>
          </div>,
          document.body
        )}

      {/* Asset Details Modal */}
      <FixedAssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
