import React from "react";
import { ProjectCostType } from "@/lib/hooks/api-hooks";
import {
  EmployeesIcon,
  DoorIcon,
  GridIcon,
  PaintbrushIcon,
  ZapIcon,
  WrenchIcon,
  TruckIcon,
  ReceiptIcon,
} from "@/components/icons";

export function fmt(amount: number | string | null | undefined): string {
  return Number(amount || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONTH_MAP: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Sept: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export function dpToISO(dp: string): string {
  if (!dp) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dp)) return dp;
  const parts = dp.trim().split(" ");
  if (parts.length < 3) return "";
  const [day, mon, year] = parts;
  const m = MONTH_MAP[mon];
  if (!m) return "";
  return `${year}-${m}-${day.padStart(2, "0")}`;
}

export function isoToDP(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export interface CategoryDef {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  costType: ProjectCostType;
  description: string;
  defaultDesc: string;
  color: string;
  bgLight: string;
  activeBorder: string;
  activeBg: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: "labor",
    name: "Labor",
    icon: EmployeesIcon,
    costType: "LABOR",
    description:
      "Carpenters, masons, painters, electricians & site helpers wages",
    defaultDesc: "Site labor & technician wages",
    color: "text-blue-600",
    bgLight: "bg-blue-50 text-blue-600 border-blue-200/60",
    activeBorder: "border-blue-500 ring-2 ring-blue-500/20 shadow-xs",
    activeBg: "bg-blue-50/70",
  },
  {
    key: "doors",
    name: "Door Materials & Hardware",
    icon: DoorIcon,
    costType: "MATERIAL",
    description:
      "Solid flush doors, hardwood frames, architraves, locks & handles",
    defaultDesc: "Flush doors & ironmongery accessories",
    color: "text-amber-700",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200/60",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/20 shadow-xs",
    activeBg: "bg-amber-50/70",
  },
  {
    key: "flooring",
    name: "Flooring & Tiling",
    icon: GridIcon,
    costType: "MATERIAL",
    description:
      "Porcelain tiles, skirting, screeding, polymer adhesive & grout",
    defaultDesc: "Tiles, adhesive & screed materials",
    color: "text-emerald-700",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs",
    activeBg: "bg-emerald-50/70",
  },
  {
    key: "painting",
    name: "Painting & Finishes",
    icon: PaintbrushIcon,
    costType: "MATERIAL",
    description: "Wall primers, gypsum putty, emulsion paint & masking",
    defaultDesc: "Wall putty, primer & washable emulsion paint",
    color: "text-purple-600",
    bgLight: "bg-purple-50 text-purple-600 border-purple-200/60",
    activeBorder: "border-purple-500 ring-2 ring-purple-500/20 shadow-xs",
    activeBg: "bg-purple-50/70",
  },
  {
    key: "electrical",
    name: "Electrical & MEP",
    icon: ZapIcon,
    costType: "MATERIAL",
    description:
      "LED lighting fixtures, wires, PVC conduits, switches & sockets",
    defaultDesc: "LED panels, cables & electrical conduits",
    color: "text-amber-600",
    bgLight: "bg-amber-50 text-amber-600 border-amber-200/60",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/20 shadow-xs",
    activeBg: "bg-amber-50/70",
  },
  {
    key: "equipment",
    name: "Equipment & Tools Rental",
    icon: WrenchIcon,
    costType: "EQUIPMENT",
    description: "Mobile aluminum scaffolding towers & specialized power tools",
    defaultDesc: "Scaffolding tower & tool rental",
    color: "text-slate-700",
    bgLight: "bg-slate-100 text-slate-700 border-slate-200/60",
    activeBorder: "border-slate-500 ring-2 ring-slate-500/20 shadow-xs",
    activeBg: "bg-slate-100/70",
  },
  {
    key: "waste",
    name: "Waste Skip & Logistics",
    icon: TruckIcon,
    costType: "TRANSPORT",
    description:
      "Debris waste skip container haulage & site material deliveries",
    defaultDesc: "Debris waste skip container haulage",
    color: "text-sky-600",
    bgLight: "bg-sky-50 text-sky-600 border-sky-200/60",
    activeBorder: "border-sky-500 ring-2 ring-sky-500/20 shadow-xs",
    activeBg: "bg-sky-50/70",
  },
  {
    key: "other",
    name: "Overheads & Other",
    icon: ReceiptIcon,
    costType: "OTHER",
    description:
      "Mall NOC fees, municipality permits, site protection & utilities",
    defaultDesc: "Site NOC approvals & miscellaneous expenses",
    color: "text-rose-600",
    bgLight: "bg-rose-50 text-rose-600 border-rose-200/60",
    activeBorder: "border-rose-500 ring-2 ring-rose-500/20 shadow-xs",
    activeBg: "bg-rose-50/70",
  },
];
