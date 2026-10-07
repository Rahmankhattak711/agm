import React from "react";
import { Project } from "@/lib/hooks/api-hooks";
import {
  EditIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  LineChartIcon,
  ArrowRightIcon,
  UserIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";
import { fmt, PRIORITY_CFG } from "../types";

interface ProjectCardProps {
  project: Project;
  canModify: boolean;
  canDelete: boolean;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

export function ProjectCard({
  project: p,
  canModify,
  canDelete,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const router = useRouter();

  const bud = Number(
    p.contractValue || p.budget || p.quotation?.totalAmount || 0,
  );
  const totalCostFromItems = p.costs?.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );
  const ac = Number(
    p.actualCost ||
      (totalCostFromItems !== undefined && totalCostFromItems > 0
        ? totalCostFromItems
        : 0),
  );
  const remaining = bud - ac;
  const isOver = ac > bud && bud > 0;
  const usedPct = bud > 0 ? Math.min(Math.round((ac / bud) * 100), 100) : 0;
  const priCfg = PRIORITY_CFG[p.priority || "MEDIUM"];

  const quoteMatch =
    p.name?.match(/\((AGM-QTN-[^)]+|QTN-[^)]+)\)/i) ||
    p.description?.match(/(AGM-QTN-[\w-]+|QTN-[\w-]+)/i);
  const quoteNo =
    p.quotation?.quotationNo || (quoteMatch ? quoteMatch[1] : null);

  const cleanTitle =
    p.name?.replace(/\s*\((AGM-QTN-[^)]+|QTN-[^)]+)\)\s*/i, "").trim() ||
    p.name;

  const hasVat =
    (p.vatRate !== undefined && p.vatRate !== null && Number(p.vatRate) > 0) ||
    Number(p.vatAmount || 0) > 0 ||
    (p.quotation?.vatPct !== undefined && Number(p.quotation.vatPct) > 0) ||
    (p.quotation?.vatAmount !== undefined && Number(p.quotation.vatAmount) > 0);

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-4 sm:p-5 gap-3.5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {p.projectCode}
            </span>
            <StatusBadge status={p.status} />
          </div>

          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {canModify && (
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit Project"
              >
                <EditIcon size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Project"
              >
                <TrashIcon size={14} />
              </button>
            )}
          </div>
        </div>

        <div>
          <h3
            className="font-bold text-slate-900 text-base leading-snug truncate"
            title={cleanTitle}
          >
            {cleanTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 truncate">
            {p.customer?.name && (
              <span className="font-medium text-slate-600 flex items-center gap-1 truncate">
                <UserIcon size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{p.customer.name}</span>
              </span>
            )}
            {p.customer?.name && p.location && (
              <span className="text-slate-300">·</span>
            )}
            {p.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPinIcon size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{p.location}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priCfg?.color || "text-slate-600 bg-slate-50 border-slate-200"}`}
          >
            {priCfg?.label || p.priority}
          </span>
          {p.deadline && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
              <CalendarIcon size={11} className="text-slate-400" />
              <span>{p.deadline.split("T")[0]}</span>
            </span>
          )}
          {quoteNo && (
            <span
              className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-semibold"
              title={`Quotation ${quoteNo}`}
            >
              <FileSpreadsheetIcon size={11} />
              <span className="font-mono">{quoteNo}</span>
            </span>
          )}
          {(quoteNo ||
            p.quotation ||
            p.invoiceNumber ||
            p.vatRate !== undefined) && (
            <span
              className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                hasVat
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}
            >
              {hasVat ? "5% VAT" : "Non-VAT"}
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Project Value
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                AED {fmt(bud)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Actual Spent
              </span>
              <span
                className={`font-mono text-base font-bold ${
                  isOver ? "text-rose-600" : "text-slate-900"
                }`}
              >
                AED {fmt(ac)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOver
                    ? "bg-rose-500"
                    : usedPct > 80
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {isOver
                  ? `Over by AED ${fmt(ac - bud)}`
                  : `${usedPct}% utilized`}
              </span>
              <span className="font-mono">
                Balance:{" "}
                <span
                  className={`font-semibold ${remaining >= 0 ? "text-slate-700" : "text-rose-600"}`}
                >
                  AED {fmt(remaining)}
                </span>
              </span>
            </div>
          </div>

          {p.progressPct !== undefined && p.progressPct > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Site Execution</span>
              <span className="font-mono font-semibold text-slate-800">
                {p.progressPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() =>
            router.push(`/operations/cost-tracking?project=${p.id}`)
          }
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <LineChartIcon size={14} className="text-emerald-700" />
            <span>View Cost Tracking</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700">
            <span>{p._count?.costs ?? p.costs?.length ?? 0} records</span>
            <ArrowRightIcon size={12} />
          </span>
        </button>
      </div>
    </div>
  );
}
