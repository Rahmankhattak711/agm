"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  Printer,
  FileCheck2,
  Banknote,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "@/lib/toast";

export default function SupplierBillViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [bill, setBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/commercial/supplier-bills/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load purchase bill");
      }
      const data = await res.json();
      setBill(data);
    } catch (err: any) {
      setError(err.message || "Error loading bill");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBill();
    }
  }, [id]);

  const handlePost = async () => {
    try {
      const res = await fetch(`/api/commercial/supplier-bills/${id}/post`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post bill");
      }
      toast.success("Bill posted to General Ledger successfully!");
      fetchBill();
    } catch (err: any) {
      toast.error(err.message || "Failed to post bill");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading purchase bill details...</span>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="w-full min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4">
          <p className="text-rose-600 text-sm font-semibold">{error || "Bill not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/commercial/supplier-bills")}>
            Back to Purchase Bills
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = bill.status === "PAID";
  const isPosted = bill.status === "POSTED";

  return (
    <div className="w-full min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Top Header */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/commercial/supplier-bills")}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Back to Purchase Bills"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5] shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                  {bill.billNumber}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isPosted
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPaid ? "bg-emerald-500" : isPosted ? "bg-sky-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{bill.status}</span>
                </span>
                {bill.journalEntry && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    GL: {bill.journalEntry.entryNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor invoice & accounts payable details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="cursor-pointer text-xs"
            >
              Print Voucher
            </Button>
            {bill.status === "DRAFT" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePost}
                icon={<FileCheck2 className="w-3.5 h-3.5" />}
                className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold text-xs cursor-pointer"
              >
                Post to GL
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Vendor / Supplier
            </span>
            <div className="font-bold text-slate-900 text-sm truncate" title={bill.supplierName}>
              {bill.supplierName}
            </div>
            {bill.supplierTrn && (
              <div className="text-[11px] text-slate-500 font-mono">
                TRN: {bill.supplierTrn}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bill Date & Due Date
            </span>
            <div className="font-bold text-slate-900 text-xs font-mono">
              Date: {new Date(bill.billDate).toLocaleDateString("en-GB")}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Due: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("en-GB") : "Immediate"}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <div className="font-mono font-bold text-base text-slate-900">
              AED {formatNumber(bill.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              VAT (5%): AED {formatNumber(bill.vatAmount)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <div
              className={`font-mono font-bold text-base ${
                Number(bill.remainingBalance) > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              AED {formatNumber(bill.remainingBalance)}
            </div>
            <div className="text-[11px] text-slate-500">
              Paid: AED {formatNumber(bill.paidAmount)}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Procured Line Items
            </h3>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {bill.items?.length || 0} Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                  <th className="px-4 py-3 w-10 text-center text-slate-400">#</th>
                  <th className="px-4 py-3 min-w-[200px]">Product / Description</th>
                  <th className="px-4 py-3 text-center w-24">Quantity</th>
                  <th className="px-4 py-3 text-center w-20">Unit</th>
                  <th className="px-4 py-3 text-right w-32">Unit Cost (AED)</th>
                  <th className="px-4 py-3 text-right w-36">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bill.items && bill.items.length > 0 ? (
                  bill.items.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {item.product?.name || item.description || "Material item"}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {item.unit || "PCS"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                        {formatNumber(item.unitCost)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(item.totalAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No item lines recorded.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-semibold">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-slate-600">
                    Net Subtotal:
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">
                    AED {formatNumber(bill.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-slate-600">
                    Input VAT (5%):
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">
                    AED {formatNumber(bill.vatAmount)}
                  </td>
                </tr>
                <tr className="border-t border-slate-200 text-sm font-bold text-slate-900">
                  <td colSpan={5} className="px-4 py-3 text-right">
                    Total Gross Amount:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-700">
                    AED {formatNumber(bill.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
