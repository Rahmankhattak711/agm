"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Printer,
  Search,
  Download,
  DollarSign,
  CheckCircle2,
  Building2,
  Calendar,
  X,
} from "lucide-react";
import { useSalarySlips } from "@/lib/hooks/hr-hooks";
import { Button, Modal } from "@/components/ui";

export default function SalarySlipsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  const { data: slips = [], isLoading } = useSalarySlips({
    month: selectedMonth,
    year: selectedYear,
    search,
  });

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans print:p-0 print:bg-white">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Corporate Salary Slips & History
              </h1>
              <p className="text-xs text-slate-500">
                Official employee payslips with company TRN, earnings breakdown, overtime & PDF download
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none font-mono font-medium"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee name, code, department..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {slips.length} Slips Generated
        </span>
      </div>

      {/* Slips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading salary slips...
          </div>
        ) : slips.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No salary slips found for this period
          </div>
        ) : (
          slips.map((slip: any) => (
            <div
              key={slip.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{slip.employeeInfo.employeeName}</h3>
                  <p className="text-xs text-slate-500">
                    {slip.employeeInfo.designation} &bull; {slip.employeeInfo.department}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {slip.slipNumber}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {slip.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Earnings:</span>
                  <span className="font-mono font-medium text-slate-900">
                    AED {slip.earnings.grossSalary.toLocaleString()}
                  </span>
                </div>
                {slip.deductions.totalDeductions > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Deductions:</span>
                    <span className="font-mono font-medium">
                      -AED {slip.deductions.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200 pt-1">
                  <span>Net Payable:</span>
                  <span className="font-mono text-sm">
                    AED {slip.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSlip(slip)}
                className="w-full text-xs text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                View & Print Official Slip
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Official Printable Salary Slip Modal / Document View */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 print:shadow-none print:border-0 print:p-0">
            {/* Modal Top Actions (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="text-xs font-mono font-bold text-slate-500">
                Official Corporate Payslip Preview
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrintSlip}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print / Save as PDF
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corporate Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <Image src="/assets/logo.png" alt="AGM Logo" fill className="object-contain" priority />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedSlip.companyInfo.companyName}
                    </h2>
                    <p className="text-[11px] text-slate-600">{selectedSlip.companyInfo.address}</p>
                    <p className="text-[11px] font-mono text-slate-600">
                      TRN: <strong>{selectedSlip.companyInfo.trn}</strong> &bull; License: {selectedSlip.companyInfo.tradeLicense}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase tracking-wider block">
                    CONFIDENTIAL PAYSLIP
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block mt-1">
                    {selectedSlip.periodLabel}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {selectedSlip.slipNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Information Box */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-semibold">Employee Details</p>
                <p className="font-bold text-slate-900 text-sm">{selectedSlip.employeeInfo.employeeName}</p>
                <p className="text-slate-600">Emp Code: <strong className="font-mono">{selectedSlip.employeeInfo.employeeCode}</strong></p>
                <p className="text-slate-600">Designation: <strong>{selectedSlip.employeeInfo.designation}</strong></p>
                <p className="text-slate-600">Department: <strong>{selectedSlip.employeeInfo.department}</strong></p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-semibold">Payment Distribution</p>
                <p className="text-slate-700">Bank: <strong>{selectedSlip.employeeInfo.bankName || "WPS Electronic Transfer"}</strong></p>
                <p className="text-slate-700 font-mono">IBAN: {selectedSlip.employeeInfo.iban || "WPS Payroll Card"}</p>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-[11px]">
                  Earnings (AED)
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-600">Basic Salary:</span>
                    <span className="font-semibold text-slate-900">AED {selectedSlip.earnings.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-600">Housing Allowance:</span>
                    <span>AED {selectedSlip.earnings.housingAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-600">Transport Allowance:</span>
                    <span>AED {selectedSlip.earnings.transportAllowance.toLocaleString()}</span>
                  </div>
                  {selectedSlip.earnings.otherAllowances > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-600">Other Allowances:</span>
                      <span>AED {selectedSlip.earnings.otherAllowances.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedSlip.earnings.overtimeAmount > 0 && (
                    <div className="flex justify-between text-blue-700 font-semibold">
                      <span className="font-sans">Overtime ({selectedSlip.earnings.overtimeHours}h):</span>
                      <span>+AED {selectedSlip.earnings.overtimeAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 font-bold text-slate-900">
                    <span className="font-sans">Gross Salary:</span>
                    <span>AED {selectedSlip.earnings.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-[11px]">
                  Deductions (AED)
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Absences / Unpaid Days:</span>
                    <span>{selectedSlip.deductions.daysAbsent} days</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-sans">Absence Deductions:</span>
                    <span>{selectedSlip.deductions.absenceDeductions > 0 ? `-AED ${selectedSlip.deductions.absenceDeductions.toLocaleString()}` : "AED 0"}</span>
                  </div>
                  {selectedSlip.deductions.otherDeductions > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span className="font-sans">Other Deductions:</span>
                      <span>-AED {selectedSlip.deductions.otherDeductions.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 font-bold text-rose-700">
                    <span className="font-sans">Total Deductions:</span>
                    <span>-AED {selectedSlip.deductions.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Highlight Box */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">
                  Net Amount Transferred
                </span>
                <span className="text-xl font-bold font-mono text-emerald-950">
                  AED {selectedSlip.netSalary.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium italic text-emerald-900 block">
                  {selectedSlip.netSalaryInWords}
                </span>
              </div>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-slate-700">
              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="font-semibold">Employer / Authorized Finance Signatory</p>
                <p className="text-[10px] text-slate-400 mt-1">ARJT TRANSPORT LLC &bull; Official Stamp</p>
              </div>
              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="font-semibold">Employee Acknowledgment</p>
                <p className="text-[10px] text-slate-400 mt-1">Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
