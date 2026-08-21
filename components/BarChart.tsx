"use client";

interface BarChartItem {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartItem[];
  title: string;
  subtitle?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function BarChart({
  data = [],
  title,
  subtitle,
  height = 180,
  formatValue = (v) =>
    `AED ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
}: BarChartProps) {
  const safeData = (data || []).map((d) => ({
    ...d,
    value:
      typeof d.value === "number"
        ? isNaN(d.value)
          ? 0
          : d.value
        : Number(d.value || 0) || 0,
  }));
  const maxVal = Math.max(...safeData.map((d) => Math.abs(d.value)), 1);
  const isAllZero = safeData.length === 0 || safeData.every((d) => d.value === 0);

  return (
    <div className="flex flex-col justify-between h-full space-y-4">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isAllZero
            ? "bg-slate-50 text-slate-500 border-slate-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          {isAllZero ? "Baseline (Zero)" : "Live Feed"}
        </span>
      </div>

      <div
        className="relative flex items-end justify-around gap-3 pt-6 pb-2 px-2 bg-slate-50/60 rounded-2xl border border-slate-100"
        style={{ minHeight: height }}
      >

        <div className="absolute inset-x-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-300 w-full" />
          <div className="border-b border-dashed border-slate-300 w-full" />
          <div className="border-b border-slate-200 w-full" />
        </div>

        {safeData.map((item, idx) => {
          const absVal = Math.abs(item.value);
          const percentage = isAllZero ? 6 : Math.max((absVal / maxVal) * 85, 8);

          return (
            <div
              key={idx}
              className="relative z-10 flex-1 flex flex-col items-center max-w-[120px] group cursor-pointer"
            >

              <div className="mb-2 transition-transform duration-200 group-hover:-translate-y-1 text-center">
                <span className="inline-block px-2 py-0.5 rounded-md bg-white border border-slate-200/80 shadow-xs text-[10px] font-bold text-slate-800 font-mono">
                  {formatValue(item.value)}
                </span>
              </div>

              <div className="w-full h-32 flex items-end justify-center rounded-xl bg-slate-200/40 p-1">
                <div
                  className="w-full rounded-lg transition-all duration-500 shadow-xs group-hover:opacity-90"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              <span className="mt-2 text-[11px] font-bold text-slate-600 text-center tracking-tight truncate w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        {safeData.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-500 font-medium">{item.label}:</span>
            <span className="font-bold text-slate-800 font-mono">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
