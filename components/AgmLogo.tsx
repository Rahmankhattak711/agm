"use client";

import Image from "next/image";

interface AgmLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  collapsed?: boolean;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

export default function AgmLogo({
  size = "md",
  collapsed = false,
  className = "",
  theme = "auto",
}: AgmLogoProps) {

  const dimensions = {
    sm: { height: 38, width: 110 },
    md: { height: 56, width: 165 },
    lg: { height: 75, width: 220 },
    xl: { height: 95, width: 280 },
  };

  const { height, width } = dimensions[size];

  if (collapsed) {
    return (
      <div className={`relative flex items-center justify-center p-1 rounded-xl bg-white/95 shadow-xs border border-white/20 ${className}`}>
        <Image
          src="/assets/logo.png"
          alt="AGM Aesthetic House Logo"
          width={32}
          height={32}
          priority
          className="object-contain h-7 w-7"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl transition-all ${
        theme === "dark"
          ? "bg-white/95 p-2 px-3 shadow-md border border-white/30"
          : theme === "light"
          ? "p-1"
          : "p-1"
      } ${className}`}
    >
      <Image
        src="/assets/logo.png"
        alt="AGM Aesthetic House Logo"
        width={width}
        height={height}
        priority
        className="object-contain w-auto max-h-full"
        style={{ height }}
      />
    </div>
  );
}
