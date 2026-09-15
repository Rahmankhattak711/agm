import React from "react";
import { IconProps } from "./types";

export function GridIcon({
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
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
