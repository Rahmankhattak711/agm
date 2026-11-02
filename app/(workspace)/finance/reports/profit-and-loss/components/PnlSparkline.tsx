"use client";

import React from "react";

interface PnlSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function PnlSparkline({
  values = [],
  width = 64,
  height = 20,
  color = "#6366f1", // Indigo
}: PnlSparklineProps) {
  if (!values || values.length === 0) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = values.length === 1 ? width / 2 : (idx / (values.length - 1)) * (width - 4) + 2;
    const y = height - 3 - ((val - min) / range) * (height - 6);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.length > 0 && (
          <circle
            cx={points[points.length - 1].split(",")[0]}
            cy={points[points.length - 1].split(",")[1]}
            r="2"
            fill={color}
          />
        )}
      </svg>
    </div>
  );
}
