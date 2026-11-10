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
    <div className="w-full min-h-full p-3 sm:p-5 space-y-3.5 bg-[#f8fafc] font-sans text-slate-800">
      {/* Compact Top Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/commercial/supplier-bills")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Purchase Bills"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            <Receipt className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 font-mono tracking-tight">
              {bill.billNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                isPaid
                  ? "bg-[#f0fdf4] text-[#166534] border border-[#86efac]"
                  : isPosted
                    ? "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]"
                    : "bg-[#fefce8] text-[#92400e] border border-[#fde047]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPaid ? "bg-emerald-500" : isPosted ? "bg-[#1d4ed8]" : "bg-amber-500"
                }`}
              />
              <span>{bill.status}</span>
            </span>
            {bill.journalEntry && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                GL: {bill.journalEntry.entryNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Voucher</span>
          </button>
          {bill.status === "DRAFT" && (
            <button
              type="button"
              onClick={handlePost}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              style={{ backgroundColor: "#1d4ed8" }}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Post to GL</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Compact Pastel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            Vendor / Supplier
          </span>
          <div className="font-medium text-slate-800 text-xs sm:text-[13px] truncate mt-0.5" title={bill.supplierName}>
            {bill.supplierName}
          </div>
          {bill.supplierTrn ? (
            <span className="text-[10.5px] text-slate-500 font-mono block mt-0.5">
              TRN: {bill.supplierTrn}
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-400 block mt-0.5">External Vendor</span>
          )}
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-amber-800/80 block">
            Bill &amp; Due Date
          </span>
          <span className="font-mono font-medium text-amber-900 text-xs sm:text-[13px] block mt-0.5">
            Date: {new Date(bill.billDate).toLocaleDateString("en-GB")}
          </span>
          <span className="text-[10.5px] text-amber-700/80 font-mono block mt-0.5">
            Due: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("en-GB") : "Immediate"}
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-blue-800/80 block">
            Total Amount
          </span>
          <span className="font-mono font-semibold text-sm sm:text-[15px] text-[#1d4ed8] block mt-0.5">
            AED {formatNumber(bill.totalAmount)}
          </span>
          <span className="text-[10.5px] text-blue-700/80 font-mono block mt-0.5">
            VAT (5%): AED {formatNumber(bill.vatAmount)}
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-rose-800/80 block">
            Outstanding Balance
          </span>
          <span
            className={`font-mono font-semibold text-sm sm:text-[15px] block mt-0.5 ${
              Number(bill.remainingBalance) > 0 ? "text-rose-900" : "text-emerald-900"
            }`}
          >
            AED {formatNumber(bill.remainingBalance)}
          </span>
          <span className="text-[10.5px] text-rose-700/80 block mt-0.5">
            Paid: AED {formatNumber(bill.paidAmount)}
          </span>
        </div>
      </div>

      {/* Procured Items Card */}
      <div
        className="bg-white rounded-xl shadow-2xs overflow-hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <h3 className="text-xs font-semibold text-slate-800">
            Procured Line Items
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {bill.items?.length || 0} {bill.items?.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-[10.5px] font-medium uppercase tracking-wider text-slate-500"
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <th className="px-3 py-2.5 w-10 text-center font-medium">#</th>
                <th className="px-3 py-2.5 min-w-[200px] font-medium">Product / Description</th>
                <th className="px-3 py-2.5 text-center w-24 font-medium">Quantity</th>
                <th className="px-3 py-2.5 text-center w-20 font-medium">Unit</th>
                <th className="px-3 py-2.5 text-right w-32 font-medium">Unit Cost (AED)</th>
                <th className="px-3 py-2.5 text-right w-36 font-medium">Total (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-normal">
              {bill.items && bill.items.length > 0 ? (
                bill.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.product?.name || item.description || "Material item"}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-medium text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500">
                      {item.unit || "PCS"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">
                      {formatNumber(item.unitCost)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-slate-800">
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
            <tfoot
              className="text-xs"
              style={{
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #cbd5e1",
              }}
            >
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right text-slate-600 font-normal">
                  Net Subtotal:
                </td>
                <td className="px-4 py-2 text-right font-mono font-medium text-slate-800">
                  AED {formatNumber(bill.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right text-slate-600 font-normal">
                  Input VAT (5%):
                </td>
                <td className="px-4 py-2 text-right font-mono font-medium text-slate-800">
                  AED {formatNumber(bill.vatAmount)}
                </td>
              </tr>
              <tr
                style={{
                  backgroundColor: "#eff6ff",
                  borderTop: "1px solid #bfdbfe",
                }}
              >
                <td colSpan={5} className="px-4 py-2.5 text-right font-medium text-slate-800">
                  Total Gross Amount:
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#1d4ed8]">
                  AED {formatNumber(bill.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
