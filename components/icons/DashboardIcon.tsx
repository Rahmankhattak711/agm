import React from "react";
import { IconProps } from "./types";

export function DashboardIcon({
  size = 18,
  className = "w-[18px] h-[18px]",
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" />
    </svg>
  );
}
