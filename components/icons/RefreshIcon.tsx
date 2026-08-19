import React from "react";
import { IconProps } from "./types";

export function RefreshIcon({
  size = 18,
  className = "w-[18px] h-[18px]",
  strokeWidth = 2,
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
      <path d="M20 11a8 8 0 1 0 2 5.4" />
      <polyline points="20 4 20 11 13 11" />
    </svg>
  );
}
