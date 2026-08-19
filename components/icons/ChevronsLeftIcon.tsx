import React from "react";
import { IconProps } from "./types";

export function ChevronsLeftIcon({
  size = 18,
  className = "w-4 h-4",
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
      <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
    </svg>
  );
}
