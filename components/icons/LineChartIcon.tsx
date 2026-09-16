import React from "react";
import { IconProps } from "./types";

export function LineChartIcon({
  size = 18,
  className = "w-[18px] h-[18px]",
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <path
        d="M4 14l4-4 3 3 5-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
