import React from "react";
import { IconProps } from "./types";

export function FileClockIcon({
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
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="8" cy="16" r="6" />
      <polyline points="8 13 8 16 10 17" />
    </svg>
  );
}
