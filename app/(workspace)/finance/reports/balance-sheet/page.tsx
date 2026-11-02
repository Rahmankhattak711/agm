"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { FileSpreadsheetIcon, ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export default function BalanceSheetReportPage() {
  const router = useRouter();
  const [asAtDate, setAsAtDate] = useState("2026-10-31");
  const [depthLevel, setDepthLevel] = useState<number>(4);

  const { data: bs, isLoading } = useQuery({
    queryKey: ["balance-sheet", asAtDate],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/balance-sheet?asAt=${asAtDate}`);
      if (!res.ok) throw new Error("Failed to load Balance Sheet");
      return await res.json();
    },
  });

  const handleDrillDown = (accountId: string) => {
    router.push(`/finance/general-ledger?accountId=${accountId}`);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Top Header matching Wafeq Screenshot 4 & 5 */}
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
              Reports &gt; <span className="text-foreground font-medium">Financial Statements</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Balance Sheet
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Depth Toggles [ 1 | 2 | 3 | 4 ] */}
          <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-muted/30">
            {[1, 2, 3, 4].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDepthLevel(lvl)}
                className={`w-7 h-7 text-xs flex items-center justify-center rounded font-semibold transition-all ${
                  depthLevel === lvl
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={asAtDate}
            onChange={(e) => setAsAtDate(e.target.value)}
            className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-9 gap-1.5"
          >
            <FileSpreadsheetIcon className="w-4 h-4 text-emerald-600" />
            Print / Export
          </Button>
        </div>
      </div>

      {/* Wafeq-Identical 4-Tier Tree View */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden p-6 space-y-6">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            Calculating Balance Sheet...
          </div>
        ) : (
          <>
            {/* 1 - ASSETS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center font-bold text-sm text-foreground pb-2 border-b border-border">
                <span>1 Assets</span>
                <span className="font-mono">{formatAed(bs?.assets.total || 0)}</span>
              </div>
              <div className="space-y-1 pl-4">
                {bs?.assets.accounts
                  .filter((a: any) => (a.level || 4) <= depthLevel)
                  .map((acc: any) => (
                    <div
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id)}
                      className="flex justify-between items-center py-1.5 px-3 rounded hover:bg-muted/40 cursor-pointer text-xs group transition-colors"
                    >
                      <span className="text-foreground/90 group-hover:text-primary font-medium">
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-mono text-muted-foreground group-hover:text-foreground">
                        {acc.balance.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between items-center font-bold text-xs pt-2 border-t border-border/80">
                <span>Total Assets</span>
                <span className="font-mono text-primary">{formatAed(bs?.assets.total || 0)}</span>
              </div>
            </div>

            {/* 2 - LIABILITIES */}
            <div className="space-y-3 pt-4 border-t-2 border-border/60">
              <div className="flex justify-between items-center font-bold text-sm text-foreground pb-2 border-b border-border">
                <span>2 Liabilities</span>
                <span className="font-mono">{formatAed(bs?.liabilities.total || 0)}</span>
              </div>
              <div className="space-y-1 pl-4">
                {bs?.liabilities.accounts
                  .filter((a: any) => (a.level || 4) <= depthLevel)
                  .map((acc: any) => (
                    <div
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id)}
                      className="flex justify-between items-center py-1.5 px-3 rounded hover:bg-muted/40 cursor-pointer text-xs group transition-colors"
                    >
                      <span className="text-foreground/90 group-hover:text-primary font-medium">
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-mono text-muted-foreground group-hover:text-foreground">
                        {acc.balance.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between items-center font-bold text-xs pt-2 border-t border-border/80">
                <span>Total Liabilities</span>
                <span className="font-mono text-foreground">
                  {formatAed(bs?.liabilities.total || 0)}
                </span>
              </div>
            </div>

            {/* 3 - EQUITY */}
            <div className="space-y-3 pt-4 border-t-2 border-border/60">
              <div className="flex justify-between items-center font-bold text-sm text-foreground pb-2 border-b border-border">
                <span>3 Equity</span>
                <span className="font-mono">{formatAed(bs?.equity.total || 0)}</span>
              </div>
              <div className="space-y-1 pl-4">
                {bs?.equity.accounts
                  .filter((a: any) => (a.level || 4) <= depthLevel)
                  .map((acc: any) => (
                    <div
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id)}
                      className="flex justify-between items-center py-1.5 px-3 rounded hover:bg-muted/40 cursor-pointer text-xs group transition-colors"
                    >
                      <span className="text-foreground/90 group-hover:text-primary font-medium">
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-mono text-muted-foreground group-hover:text-foreground">
                        {acc.balance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                {/* Current Year Net Profit Transfer */}
                <div className="flex justify-between items-center py-1.5 px-3 rounded bg-primary/5 text-xs font-semibold">
                  <span>Current Year P&L Transfer (Retained Earnings)</span>
                  <span className="font-mono text-primary">
                    {formatAed(bs?.equity.currentYearNetProfit || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-bold text-xs pt-2 border-t border-border/80">
                <span>Total Equity</span>
                <span className="font-mono text-foreground">
                  {formatAed(bs?.equity.total || 0)}
                </span>
              </div>
            </div>

            {/* GOLDEN EQUATION CHECK: Total Liabilities + Total Equity */}
            <div className="pt-4 border-t-4 border-double border-border flex justify-between items-center font-extrabold text-sm bg-muted/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span>Total Liabilities + Equity</span>
                {bs?.isBalanced ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
                    ✓ BALANCED (A = L + E)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 font-bold">
                    UNBALANCED
                  </span>
                )}
              </div>
              <span className="font-mono text-foreground font-black">
                {formatAed(bs?.totalLiabilitiesAndEquity || 0)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
