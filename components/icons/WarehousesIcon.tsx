import React from "react";
import { IconProps } from "./types";

export function WarehousesIcon({
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
      <path d="M3 20h18" />
      <path d="M3 7l9-4 9 4v13H3V7z" />
      <path d="M9 20V10h6v10" />
    </svg>
  );
}
