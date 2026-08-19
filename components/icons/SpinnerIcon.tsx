import React from "react";
import { IconProps } from "./types";

export function SpinnerIcon({
  size = 14,
  className = "w-3.5 h-3.5 animate-spin",
  strokeWidth = 2.5,
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
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-1.39-7" />
    </svg>
  );
}
