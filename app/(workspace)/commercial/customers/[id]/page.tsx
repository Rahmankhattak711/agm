"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { StatementOfAccountReport } from "@/app/(workspace)/finance/reports/components/StatementOfAccountReport";
import { ArrowLeft, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  return (
    <div className="space-y-4">
      {/* ══════════ EXECUTIVE COMPACT HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/commercial/customers");
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Go back to Customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Users className="w-4 h-4" style={{ color: "#1d4ed8" }} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Customer Statement of Account
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Live accounts receivable ledger, transactions history, and official corporate SOA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/finance/reports?tab=statement-of-account&customerId=${customerId}`}
            className="px-3.5 py-1.5 rounded-lg border text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            style={{ borderColor: "#cbd5e1" }}
          >
            <span>Open in Financial Reports</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>
      </div>

      <StatementOfAccountReport initialCustomerId={customerId} />
    </div>
  );
}
