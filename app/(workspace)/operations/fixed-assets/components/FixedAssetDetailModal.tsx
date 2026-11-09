"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { FixedAsset } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import {
  ArrowUpRight,
  BookOpen,
  Printer as PrintIcon,
  Laptop,
  Printer,
  Truck,
  Wrench,
  Armchair,
  Home,
  Building2,
  User,
  CheckCircle2,
  FileText,
  Download,
} from "lucide-react";

export interface FixedAssetDetailModalProps {
  asset: FixedAsset | null;
  onClose: () => void;
}

function getCategoryMeta(category: string) {
  switch (category) {
    case "COMPUTER_HARDWARE":
      return { label: "Computer Hardware", icon: Laptop, color: "text-blue-600 bg-blue-50 border-blue-200/70" };
    case "COMPANY_VEHICLE":
      return { label: "Company Vehicle", icon: Truck, color: "text-amber-600 bg-amber-50 border-amber-200/70" };
    case "OFFICE_EQUIPMENT":
      return { label: "Office Equipment", icon: Printer, color: "text-indigo-600 bg-indigo-50 border-indigo-200/70" };
    case "MACHINERY_EQUIPMENT":
      return { label: "Machinery & Equipment", icon: Wrench, color: "text-teal-600 bg-teal-50 border-teal-200/70" };
    case "FURNITURE_FIXTURES":
      return { label: "Furniture & Fixtures", icon: Armchair, color: "text-purple-600 bg-purple-50 border-purple-200/70" };
    case "LEASEHOLD_IMPROVEMENT":
      return { label: "Leasehold Improvement", icon: Home, color: "text-rose-600 bg-rose-50 border-rose-200/70" };
    default:
      return { label: category?.replace(/_/g, " ") || "General Asset", icon: Building2, color: "text-slate-600 bg-slate-50 border-slate-200/70" };
  }
}

export const FixedAssetDetailModal: React.FC<FixedAssetDetailModalProps> = ({
  asset,
  onClose,
}) => {
  const router = useRouter();

  if (!asset) return null;

  const cost = Number(asset.cost || 0);
  const salvage = Number(asset.salvageValue || 0);
  const deprRate = Number(asset.depreciationRate || 20);
  const annualDepr = Math.round(((cost - salvage) * (deprRate / 100)) * 100) / 100;

  const purchaseYear = new Date(asset.purchaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsActive = Math.max(0, currentYear - purchaseYear);
  const accumDeprEstimate = Math.min(cost - salvage, annualDepr * yearsActive);
  const netBookValue = Math.max(salvage, cost - accumDeprEstimate);
  const remainingPct = cost > 0 ? Math.round((netBookValue / cost) * 100) : 100;

  const meta = getCategoryMeta(asset.category);
  const CatIcon = meta.icon;

  const handleOpenLedger = () => {
    onClose();
    if (asset.assetAccountId) {
      router.push(`/finance/general-ledger?accountId=${asset.assetAccountId}`);
    } else {
      router.push(`/finance/general-ledger`);
    }
  };

  return (
    <Modal
      isOpen={!!asset}
      onClose={onClose}
      title={`Fixed Asset Details • ${asset.assetCode}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs font-sans text-slate-700">
        {/* Header Summary */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}>
              <CatIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                  {asset.assetCode}
                </span>
                <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mt-1">
                {asset.assetName}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-wider">
              Historical Cost
            </span>
            <span className="text-base font-semibold text-slate-900 font-mono">
              {formatAed(cost)}
            </span>
          </div>
        </div>

        {/* Valuation & Depreciation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fafc] p-3 rounded-xl border border-slate-200/70">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Acquisition Date
            </span>
            <span className="font-mono font-medium text-slate-800 text-xs block">
              {new Date(asset.purchaseDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[10px] text-slate-400">
              {yearsActive === 0 ? "Current Fiscal Year" : `${yearsActive} yr(s) in service`}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Depr. Method
            </span>
            <span className="font-mono font-medium text-slate-800 text-xs block">
              {deprRate}% / year
            </span>
            <span className="text-[10px] text-slate-400">Straight-line</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Annual Depr.
            </span>
            <span className="font-mono font-medium text-amber-700 text-xs block">
              {formatAed(annualDepr)}
            </span>
            <span className="text-[10px] text-amber-600/80">Per 12-month period</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Net Book Value
            </span>
            <span className="font-mono font-semibold text-emerald-700 text-xs block">
              {formatAed(netBookValue)}
            </span>
            <span className="text-[10px] text-emerald-600">{remainingPct}% Value Preserved</span>
          </div>
        </div>

        {/* Assignment & Ledger Mapping Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-slate-200/70 rounded-xl p-3 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Custodian &amp; Identification</span>
            </div>
            <div className="text-slate-800 font-medium text-xs pt-0.5">
              {asset.assignedTo || "Unassigned / General Operations"}
            </div>
            {asset.registrationNumber && (
              <div className="text-[11px] text-slate-500 font-mono">
                Serial / Reg: <span className="text-slate-700">{asset.registrationNumber}</span>
              </div>
            )}
            {asset.notes && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
                {asset.notes}
              </div>
            )}
          </div>

          <div className="border border-slate-200/70 rounded-xl p-3 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>General Ledger Mapping</span>
            </div>
            <div className="text-slate-800 font-medium text-xs pt-0.5">
              Account: <span className="font-mono text-[#1d4ed8]">12xx/15xx Property &amp; Equipment</span>
            </div>
            <div className="text-[11px] text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>100% Capitalized on Balance Sheet</span>
            </div>
          </div>
        </div>

        {/* Uploaded Image / File Preview */}
        {asset.imageUrl && (
          <div className="border border-slate-200/70 rounded-xl p-3 bg-[#f8fafc] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600">
                <FileText className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <span>{asset.fileName || "Attached Asset Image / Document"}</span>
                {asset.fileType && (
                  <span className="text-[10px] text-slate-400 uppercase">({asset.fileType})</span>
                )}
              </div>
              <a
                href={asset.imageUrl}
                download={asset.fileName || `${asset.assetCode}-file`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1d4ed8] hover:underline"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
            {asset.imageUrl.startsWith("data:image") && (
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-56 flex items-center justify-center p-2">
                <img
                  src={asset.imageUrl}
                  alt={asset.assetName}
                  className="max-h-52 w-auto object-contain rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleOpenLedger}
            className="text-xs text-[#1d4ed8] hover:text-[#1e40af] bg-[#eff6ff] hover:bg-blue-100/70 border border-blue-200/70 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View in General Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              <span>Print Asset Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FixedAssetDetailModal;
