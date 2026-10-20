import { ProjectStatus, ProjectPriority } from "@/lib/hooks/api-hooks";

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

export const STATUS_CFG: Record<
  ProjectStatus,
  { label: string; dot: string; ring: string; text: string }
> = {
  PLANNING: {
    label: "Planning",
    dot: "bg-agm-subtle",
    ring: "ring-agm-box-border",
    text: "text-agm-muted",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dot: "bg-agm-green",
    ring: "ring-agm-green/20",
    text: "text-agm-green-dark",
  },
  ON_HOLD: {
    label: "On Hold",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    text: "text-amber-700",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-agm-green",
    ring: "ring-agm-green/30",
    text: "text-agm-green-dark",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
    text: "text-rose-700",
  },
};

export const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  LOW: {
    label: "Low",
    color: "text-agm-muted bg-agm-box-bg border-agm-box-border",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-agm-navy bg-agm-card border-agm-box-border",
  },
  HIGH: {
    label: "High",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  URGENT: {
    label: "Urgent",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
};
