import React from "react";
import { Project } from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui";
import {
  EditIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  FileSpreadsheetIcon,
  LineChartIcon,
  ArrowRightIcon,
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

  const bud = Number(p.contractValue || p.budget || p.quotation?.totalAmount || 0);
  const totalCostFromItems = p.costs?.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );
  const ac = Number(
    p.actualCost || (totalCostFromItems !== undefined && totalCostFromItems > 0 ? totalCostFromItems : 0),
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

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-agm-green/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-agm-green via-emerald-600 to-agm-navy opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-agm-navy bg-agm-box-bg border border-agm-box-border px-2 py-0.5 rounded-md shrink-0">
              {p.projectCode}
            </span>
            <StatusBadge status={p.status} />
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {canModify && (
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-agm-navy hover:bg-slate-100 transition cursor-pointer"
                title="Edit Project"
              >
                <EditIcon size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Delete Project"
              >
                <TrashIcon size={14} />
              </button>
            )}
          </div>
        </div>

        <div>
          <h3
            className="font-bold text-slate-900 text-base leading-snug group-hover:text-agm-green transition-colors truncate"
            title={cleanTitle}
          >
            {cleanTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 truncate">
            {p.customer?.name && (
              <span className="font-medium text-slate-700 truncate">
                {p.customer.name}
              </span>
            )}
            {p.customer?.name && p.location && (
              <span className="text-slate-300">·</span>
            )}
            {p.location && (
              <span className="flex items-center gap-1 text-slate-500 truncate">
                <MapPinIcon size={12} className="text-agm-muted shrink-0" />
                <span className="truncate">{p.location}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${priCfg?.color || "text-slate-600 bg-slate-50 border-slate-200"}`}
          >
            {priCfg?.label || p.priority}
          </span>
          {p.deadline && (
            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md shrink-0">
              <CalendarIcon size={11} className="text-slate-400 shrink-0" />
              <span>{p.deadline.split("T")[0]}</span>
            </span>
          )}
          {quoteNo && (
            <span
              className="inline-flex items-center gap-1 text-agm-green bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-md font-semibold shrink-0"
              title={`Quotation ${quoteNo}`}
            >
              <FileSpreadsheetIcon size={11} className="shrink-0" />
              <span className="truncate max-w-[130px]">
                {quoteNo}
              </span>
            </span>
          )}
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-2.5">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                Project Value
              </span>
              <span
                className="font-mono font-bold text-sm text-slate-900 block truncate"
                title={`AED ${fmt(bud)}`}
              >
                AED {fmt(bud)}
              </span>
            </div>
            <div className="min-w-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 truncate">
                Actual Spent
              </span>
              <span
                className={`font-mono font-bold text-sm block truncate ${isOver ? "text-rose-600 font-extrabold" : "text-slate-900"}`}
                title={`AED ${fmt(ac)}`}
              >
                AED {fmt(ac)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOver
                    ? "bg-rose-500"
                    : usedPct > 80
                      ? "bg-amber-500"
                      : "bg-agm-green"
                }`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
              <span
                className={`font-medium truncate ${isOver ? "text-rose-600 font-bold" : ""}`}
              >
                {isOver
                  ? `Over by AED ${fmt(ac - bud)}`
                  : `${usedPct}% utilized`}
              </span>
              <span className="text-slate-500 shrink-0 ml-2">
                Balance:{" "}
                <strong
                  className={`font-mono font-bold ${remaining >= 0 ? "text-agm-green" : "text-rose-600"}`}
                >
                  AED {fmt(remaining)}
                </strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500">Site Execution</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-agm-green rounded-full transition-all"
                  style={{ width: `${p.progressPct || 0}%` }}
                />
              </div>
              <span className="font-mono font-bold text-xs text-slate-700">
                {p.progressPct || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-1">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() =>
            router.push(`/operations/cost-tracking?project=${p.id}`)
          }
          className="w-full justify-between shadow-xs hover:shadow"
        >
          <span className="flex items-center gap-1.5 truncate">
            <LineChartIcon size={14} className="text-white/80 shrink-0" />
            <span className="truncate">View Cost Tracking</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/20 text-white shrink-0">
            {p._count?.costs ?? p.costs?.length ?? 0} records
            <ArrowRightIcon size={11} />
          </span>
        </Button>
      </div>
    </div>
  );
}
