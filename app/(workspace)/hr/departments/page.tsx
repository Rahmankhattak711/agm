"use client";

import React from "react";
import { OrganizationStructureSection } from "@/app/(workspace)/hr/employees/components";

export default function DepartmentsPage() {
  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans">
      <OrganizationStructureSection />
    </div>
  );
}
