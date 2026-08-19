import React from "react";
import { IconProps } from "./types";

export function EyeIcon({
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
