import React from "react";
import { IconProps } from "./types";

export function PaintbrushIcon({
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
      <path d="m14 7 3 3m-3-3L8.5 12.5a2.121 2.121 0 0 0-.621 1.5V17H4v-3.879a2.12 2.12 0 0 1 .621-1.5L14 7Zm0 0 3.5-3.5a2.121 2.121 0 0 1 3 3L17 10m-3-3 3 3" />
      <path d="M4 17c0 2 1.5 3 3.5 3s3.5-1 3.5-3" />
    </svg>
  );
}
