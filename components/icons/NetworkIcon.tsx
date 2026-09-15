import React from "react";
import { IconProps } from "./types";

export function NetworkIcon({
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
      <circle cx="10" cy="6" r="3" />
      <circle cx="4" cy="14" r="2" />
      <circle cx="16" cy="14" r="2" />
      <path
        d="M7 8.5C5.5 9 4.5 11 6 12.5M13 8.5C14.5 9 15.5 11 14 12.5M10 9v2"
        strokeLinecap="round"
      />
    </svg>
  );
}
