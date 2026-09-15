"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface OperationsAttendanceChartProps {
  labels: string[];
  presentData: number[];
  absentData: number[];
}

export default function OperationsAttendanceChart({
  labels,
  presentData,
  absentData,
}: OperationsAttendanceChartProps) {
  const chartData: ChartData<"bar"> = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: "Present",
          data: presentData,
          backgroundColor: "#28633a",
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 18,
          barPercentage: 0.8,
          categoryPercentage: 0.6,
        },
        {
          label: "Absent / Leave",
          data: absentData,
          backgroundColor: "#b91c1c",
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 18,
          barPercentage: 0.8,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [labels, presentData, absentData]);

  const chartOptions: ChartOptions<"bar"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: false,
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          },
        },
        tooltip: {
          backgroundColor: "#263b4d",
          padding: 8,
          cornerRadius: 6,
          titleFont: { family: "'Inter', sans-serif", size: 11, weight: 500 },
          bodyFont: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw || 0);
              return ` ${ctx.dataset.label}: ${val} staff`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 11, weight: 400 },
          },
          border: { display: false },
        },
        y: {
          grid: { color: "#dbe2db" },
          ticks: {
            color: "#657484",
            font: { family: "'Inter', sans-serif", size: 10, weight: 400 },
            stepSize: 1,
          },
          border: { display: false },
        },
      },
    };
  }, []);

  return (
    <div className="p-5 bg-[#ffffff] border border-agm-box-border rounded-[12px] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-agm-text">
          Attendance trends & log
        </h3>
      </div>
      <div className="h-[260px] w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
