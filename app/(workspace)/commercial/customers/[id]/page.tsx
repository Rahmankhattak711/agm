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
import { Button, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  return (
    <div className="space-y-6">
      <PageHeader
        backButton={
          <Link
            href="/commercial/customers"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownLeftIcon size={16} className="rotate-45" />
          </Link>
        }
        title="Customer Profile & Statement of Account"
        description="Live accounts receivable ledger, transactions history, and official corporate SOA."
        actions={
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
        }
      />

      <StatementOfAccountReport initialCustomerId={customerId} />
    </div>
  );
}
