import React from "react";

export type BadgeTone =
  | "emerald"
  | "sky"
  | "blue"
  | "amber"
  | "rose"
  | "purple"
  | "teal"
  | "slate";

export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  bordered?: boolean;
  uppercase?: boolean;
}

const TONE_CLASSES: Record<BadgeTone, { solid: string; border: string }> = {
  emerald: { solid: "bg-emerald-50 text-emerald-800", border: "border-emerald-200" },
  sky: { solid: "bg-sky-50 text-sky-800", border: "border-sky-200" },
  blue: { solid: "bg-blue-50 text-blue-800", border: "border-blue-200" },
  amber: { solid: "bg-amber-50 text-amber-800", border: "border-amber-200" },
  rose: { solid: "bg-rose-50 text-rose-800", border: "border-rose-200" },
  purple: { solid: "bg-purple-50 text-purple-800", border: "border-purple-200" },
  teal: { solid: "bg-teal-50 text-teal-800", border: "border-teal-200" },
  slate: { solid: "bg-slate-100 text-slate-700", border: "border-slate-200" },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[10.5px]",
};

export const Badge: React.FC<BadgeProps> = ({
  tone = "slate",
  size = "sm",
  bordered = true,
  uppercase = false,
  className = "",
  children,
  ...props
}) => {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ${SIZE_CLASSES[size]} ${t.solid} ${
        bordered ? `border ${t.border}` : ""
      } ${uppercase ? "uppercase tracking-wider" : ""} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
