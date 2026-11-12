"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Gift,
  AlertCircle,
} from "lucide-react";
import AttendanceRegisterPage from "../attendance/page";
import LeavesPage from "../leaves/page";
import BonusesPage from "../bonuses/page";

function WorkforceHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = (searchParams.get("tab") as "attendance" | "leaves" | "bonuses") || "attendance";

  const [activeTab, setActiveTab] = useState<"attendance" | "leaves" | "bonuses">(
    tabParam === "leaves" || tabParam === "bonuses" ? tabParam : "attendance"
  );

  useEffect(() => {
    const current = searchParams.get("tab");
    if (current === "leaves" || current === "bonuses" || current === "attendance") {
      setActiveTab(current);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "attendance" | "leaves" | "bonuses") => {
    setActiveTab(tab);
    router.replace(`/hr/workforce?tab=${tab}`);
  };

  return (
    <div className="space-y-4">
      {/* Unified Tab Switcher */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleTabChange("attendance")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "attendance"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Attendance & Timesheet</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("leaves")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "leaves"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Leave Requests</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("bonuses")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "bonuses"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-rose-600" />
            <span>Bonuses & Deductions</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>Synced with UAE MOHRE Labor Law & Payroll Engine</span>
        </div>
      </div>

      {/* Render selected view */}
      <div>
        {activeTab === "attendance" && <AttendanceRegisterPage />}
        {activeTab === "leaves" && <LeavesPage />}
        {activeTab === "bonuses" && <BonusesPage />}
      </div>
    </div>
  );
}

export default function WorkforceHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Workforce Operations...</div>}>
      <WorkforceHubContent />
    </Suspense>
  );
}
