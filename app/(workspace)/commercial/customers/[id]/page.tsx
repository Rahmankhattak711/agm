"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomerStatement, useCustomers } from "@/lib/hooks/api-hooks";
import { StatementOfAccountReport } from "@/app/(workspace)/finance/reports/components/StatementOfAccountReport";
import {
  ArrowDownLeftIcon,
  BuildingIcon,
  ReceiptIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/commercial/customers"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownLeftIcon size={16} className="rotate-45" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Customer Profile &amp; Statement of Account
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live accounts receivable ledger, transactions history, and
              official corporate SOA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/finance/reports?tab=statement-of-account&customerId=${customerId}`}
          >
            <Button
              variant="outline"
              className="text-xs font-bold border-slate-200 bg-white"
            >
              Open in Financial Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Embedded Full Statement of Account */}
      <StatementOfAccountReport initialCustomerId={customerId} />
    </div>
  );
}
