"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import { ChevronLeftIcon, RotateCcwIcon, ProtectedIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export default function YearEndClosingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const { data, isLoading } = useQuery({
    queryKey: ["fiscal-year-closing", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/year-end-closing?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load fiscal closing data");
      return await res.json();
    },
  });

  const summary = data?.currentYear;
  const history = data?.history || [];

  const closeMutation = useMutation({
    mutationFn: async (year: number) => {
      const res = await fetch("/api/finance/reports/year-end-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close year");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["fiscal-year-closing"] });
      queryClient.invalidateQueries({ queryKey: ["profit-and-loss"] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to close fiscal year");
    },
  });

  const handleRunClosing = () => {
    if (confirm(`Are you sure you want to close Fiscal Year ${selectedYear}? This will zero-out all Revenue and Expense accounts and transfer AED ${summary?.netProfitLoss.toFixed(2)} to 331 - Retained Earnings.`)) {
      closeMutation.mutate(selectedYear);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/finance/reports")}
            className="h-8 w-8 p-0"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Accounting &gt; <span className="text-foreground font-medium">Fiscal Year-End Closing</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Automated Annual Year-End Closing
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={2025}>FY 2025</option>
            <option value={2026}>FY 2026</option>
            <option value={2027}>FY 2027</option>
          </select>
        </div>
      </div>

      {/* Main Closing Summary Card */}
      <div className="border border-border rounded-xl bg-card shadow-sm p-6 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Financial Year {selectedYear} Closeout Preview
            </h2>
            <p className="text-xs text-muted-foreground">
              Period: {selectedYear}-01-01 &rarr; {selectedYear}-12-31
            </p>
          </div>

          <div>
            {summary?.isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <ProtectedIcon className="w-3.5 h-3.5" />
                YEAR CLOSED &amp; LOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                PENDING CLOSING
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Calculating fiscal year summary...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Total Revenue (4xxx)</span>
                <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                  {formatAed(summary?.totalRevenue || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Total Expenses (5xxx)</span>
                <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                  {formatAed(summary?.totalExpense || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <span className="text-xs text-muted-foreground font-medium">Net Profit / (Loss)</span>
                <div className="text-lg font-extrabold font-mono text-primary mt-1">
                  {formatAed(summary?.netProfitLoss || 0)}
                </div>
              </div>
            </div>

            {/* Mechanics Explanation */}
            <div className="bg-muted/10 border border-border rounded-lg p-4 text-xs space-y-2 text-muted-foreground">
              <span className="font-bold text-foreground">⚙️ How the Automated Closing Engine Works:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>All <strong>Revenue (4xxx)</strong> and <strong>Expense (5xxx)</strong> account balances are zeroed out to <code className="text-foreground">0.00 AED</code> on 31-Dec.</li>
                <li>The Net Profit of <strong className="text-foreground">{formatAed(summary?.netProfitLoss || 0)}</strong> is transferred directly into <code className="text-foreground">331 - Retained Earnings</code> (Equity).</li>
                <li>All Balance Sheet closing balances (Assets, Liabilities, Capital) automatically become the <strong>January 1st Opening Balances</strong> for the next year.</li>
              </ul>
            </div>

            {/* Trigger Button */}
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleRunClosing}
                disabled={summary?.isClosed || closeMutation.isPending}
                className={`text-xs font-bold gap-2 ${
                  summary?.isClosed
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <RotateCcwIcon className="w-4 h-4" />
                {closeMutation.isPending
                  ? "Processing Year-End Close..."
                  : summary?.isClosed
                  ? "Fiscal Year Already Closed"
                  : `Close Fiscal Year ${selectedYear}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Historical Closings Log */}
      <div className="border border-border rounded-xl bg-card shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">
          Fiscal Closings &amp; Roll-Forward History
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No fiscal years have been formally closed yet.
          </p>
        ) : (
          <div className="divide-y divide-border text-xs">
            {history.map((h: any) => (
              <div key={h.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground">FY {h.year}</span>
                  <span className="text-muted-foreground ml-2">
                    Closed on {new Date(h.closedAt).toLocaleDateString()} by {h.closedBy?.fullName || "Accountant"}
                  </span>
                </div>
                <div className="font-mono font-bold text-primary">
                  Transferred {formatAed(Number(h.retainedEarningsTransfer))} to Retained Earnings
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
