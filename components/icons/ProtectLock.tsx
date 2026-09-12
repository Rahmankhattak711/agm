import React from "react";
import { IconProps } from "./types";

export const ProtectedIcon: React.FC<IconProps> = ({
  size = 18,
  className = "w-[18px] h-[18px]",
  strokeWidth = 1.8,
  ...props
}: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Protected"
      className={className}
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />

      <path
        d="M12 16.7V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
