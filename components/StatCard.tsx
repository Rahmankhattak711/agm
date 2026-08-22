"use client";

interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  loading?: boolean;
  delay?: number;
  trend?: { label: string; up: boolean };
  sparkline?: number[];
}

export default function StatCard({
  id,
  title,
  value,
  subtitle,
  icon,
  gradient,
  loading = false,
  delay = 0,
  trend,
  sparkline,
}: StatCardProps) {
  const maxSpark = sparkline ? Math.max(...sparkline, 1) : 1;

  return (
    <div
      id={id}
      className={`${gradient} rounded-2xl relative overflow-hidden fade-up p-5 min-h-[140px] shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]`}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
          radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.22) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 85%, rgba(255,255,255,0.08) 0%, transparent 45%)
        `,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-6"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3.5">
          <div className="w-10.5 h-10.5 rounded-[13px] flex items-center justify-center bg-white/22 shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex-shrink-0">
            {icon}
          </div>
          {trend && !loading && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/22 text-white/95">
              {trend.up ? "↑" : "↓"} {trend.label}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-7 w-24 rounded-lg bg-white/20 animate-shimmer" />
            <div className="h-3 w-16 rounded bg-white/12 animate-shimmer" />
          </div>
        ) : (
          <>
            <p className="text-[1.2rem] font-black text-white leading-none tracking-tight">
              {value}
            </p>
            <p className="text-xs font-semibold text-white/65 mt-1 tracking-wide">
              {title}
            </p>
            {subtitle && (
              <p className="text-[10.5px] text-white/40 mt-0.5">{subtitle}</p>
            )}
          </>
        )}

        {sparkline && sparkline.length > 0 && !loading && (
          <div className="flex items-end gap-0.5 mt-3.5 h-7">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded"
                style={{
                  height: `${Math.max((v / maxSpark) * 100, 10)}%`,
                  background:
                    i === sparkline.length - 1
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.3)",
                  transition: `height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
