import React from "react";
import { IconProps } from "./types";

export function CheckIcon({
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
