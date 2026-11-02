"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/lib/hooks/api-hooks";
import { useProjects } from "@/lib/hooks/projects-hooks";
import { JournalEntryGrid, JournalGridRow } from "../components/JournalEntryGrid";
import { JournalSummaryCard } from "../components/JournalSummaryCard";
import { QuickCreateModal } from "../components/QuickCreateModal";
import { AccountSlideOverDrawer } from "../../accounts/components/AccountSlideOverDrawer";
import { toast } from "@/lib/toast";
import { ChevronLeft, ArrowLeft } from "lucide-react";

export default function CreateJournalPage() {
  const router = useRouter();
  const { data: accounts = [], refetch: refetchAccounts } = useAccounts();
  const { data: projects = [], refetch: refetchProjects } = useProjects();

  // Form Header State
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [taxInclusive, setTaxInclusive] = useState<string>("exclusive");
  const [saving, setSaving] = useState<boolean>(false);

  // Quick Create Modals State
  const [quickCreateType, setQuickCreateType] = useState<"project" | null>(null);
  const [activeRowIdx, setActiveRowIdx] = useState<number>(0);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState<boolean>(false);

  // Initial Rows (Default 4 rows)
  const [rows, setRows] = useState<JournalGridRow[]>([
    {
      id: "row-1",
      description: "",
      accountId: "",
      currency: "AED",
      fxRate: 1,
      debit: "",
      credit: "",
      debitAed: 0,
      creditAed: 0,
      taxType: "OUT_OF_SCOPE",
      taxRate: 0,
      taxAmount: 0,
      projectId: "",
      branch: "",
      costCenter: "",
    },
    {
      id: "row-2",
      description: "",
      accountId: "",
      currency: "AED",
      fxRate: 1,
      debit: "",
      credit: "",
      debitAed: 0,
      creditAed: 0,
      taxType: "OUT_OF_SCOPE",
      taxRate: 0,
      taxAmount: 0,
      projectId: "",
      branch: "",
      costCenter: "",
    },
    {
      id: "row-3",
      description: "",
      accountId: "",
      currency: "AED",
      fxRate: 1,
      debit: "",
      credit: "",
      debitAed: 0,
      creditAed: 0,
      taxType: "OUT_OF_SCOPE",
      taxRate: 0,
      taxAmount: 0,
      projectId: "",
      branch: "",
      costCenter: "",
    },
    {
      id: "row-4",
      description: "",
      accountId: "",
      currency: "AED",
      fxRate: 1,
      debit: "",
      credit: "",
      debitAed: 0,
      creditAed: 0,
      taxType: "OUT_OF_SCOPE",
      taxRate: 0,
      taxAmount: 0,
      projectId: "",
      branch: "",
      costCenter: "",
    },
  ]);

  // Real-time Math Summary calculation
  const mathSummary = useMemo(() => {
    let subtotalDebit = 0;
    let subtotalCredit = 0;
    let taxDebit = 0;
    let taxCredit = 0;

    for (const r of rows) {
      const fx = Number(r.fxRate) || 1;
      const deb = Number(r.debit) || 0;
      const cre = Number(r.credit) || 0;
      const tax = Number(r.taxAmount) || 0;

      if (deb > 0) {
        subtotalDebit += deb * fx;
        taxDebit += tax * fx;
      }
      if (cre > 0) {
        subtotalCredit += cre * fx;
        taxCredit += tax * fx;
      }
    }

    const totalDebitAed = Math.round((subtotalDebit + taxDebit) * 100) / 100;
    const totalCreditAed = Math.round((subtotalCredit + taxCredit) * 100) / 100;
    const difference = Math.round(Math.abs(totalDebitAed - totalCreditAed) * 100) / 100;
    const isBalanced = difference === 0 && (totalDebitAed > 0 || totalCreditAed > 0);

    return {
      subtotalDebit: Math.round(subtotalDebit * 100) / 100,
      subtotalCredit: Math.round(subtotalCredit * 100) / 100,
      taxDebit: Math.round(taxDebit * 100) / 100,
      taxCredit: Math.round(taxCredit * 100) / 100,
      totalDebitAed,
      totalCreditAed,
      difference,
      isBalanced,
    };
  }, [rows]);

  const handleSave = async (isPosted: boolean) => {
    const activeLines = rows.filter(
      (r) => r.accountId && (Number(r.debit) > 0 || Number(r.credit) > 0)
    );

    if (activeLines.length < 2) {
      toast.error("A journal entry requires at least 2 lines with accounts and amounts");
      return;
    }

    if (isPosted && !mathSummary.isBalanced) {
      toast.error(
        `Debits and Credits must be equal to Post. Current Difference: AED ${mathSummary.difference.toFixed(2)}`
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        entryDate,
        reference: reference.trim() || undefined,
        description: notes.trim() || undefined,
        isPosted,
        lines: activeLines.map((r) => ({
          accountId: r.accountId,
          description: r.description.trim() || undefined,
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
          currency: r.currency || "AED",
          fxRate: Number(r.fxRate) || 1,
          taxRate: r.taxRate || 0,
          taxType: r.taxType,
          taxAmount: r.taxAmount || 0,
          projectId: r.projectId || null,
          branch: r.branch || null,
          costCenter: r.costCenter || null,
        })),
      };

      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save journal entry");
      }

      const created = await res.json();
      toast.success(
        isPosted
          ? `Journal ${created.entryNumber} posted successfully!`
          : `Journal draft ${created.entryNumber} saved!`
      );
      router.push("/finance/journal-entries");
    } catch (err: any) {
      toast.error(err.message || "Failed to save journal entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col">
      {/* Sleek Top Bar matching Chart of Accounts */}
      <div className="w-full bg-white px-6 pt-4 pb-3 border-b border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries")}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Back to manual journals"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Accounting</span>
              <span className="text-slate-400">&gt;</span>
              <span className="text-slate-500">Manual Journals</span>
              <span className="text-slate-400">&gt;</span>
              <span className="text-slate-900 font-bold tracking-tight">New Entry</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Create Journal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !mathSummary.isBalanced}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              mathSummary.isBalanced
                ? "bg-[#5046e5] hover:bg-[#4338ca] text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {saving ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 bg-slate-50/30 p-6 space-y-6">
        {/* Top Header Card: Inputs + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Inputs Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reference</label>
                <input
                  type="text"
                  placeholder="e.g. 000234 or INV-REF"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Amounts are</label>
                <select
                  value={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none cursor-pointer"
                >
                  <option value="exclusive">Tax Exclusive</option>
                  <option value="inclusive">Tax Inclusive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Journal Notes</label>
              <textarea
                rows={2}
                placeholder="Solid notes describing reason for this manual journal entry..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none resize-none"
              />
            </div>
          </div>

          {/* Right Real-time Math Summary Card */}
          <div className="lg:col-span-4 flex justify-end">
            <JournalSummaryCard
              subtotalDebit={mathSummary.subtotalDebit}
              subtotalCredit={mathSummary.subtotalCredit}
              taxDebit={mathSummary.taxDebit}
              taxCredit={mathSummary.taxCredit}
              totalDebitAed={mathSummary.totalDebitAed}
              totalCreditAed={mathSummary.totalCreditAed}
              difference={mathSummary.difference}
              isBalanced={mathSummary.isBalanced}
            />
          </div>
        </div>

        {/* Spreadsheet Table with Smart Auto-Balancing */}
        <JournalEntryGrid
          rows={rows}
          onChange={setRows}
          accounts={accounts}
          projects={projects}
          onOpenCreateAccount={() => setIsAccountDrawerOpen(true)}
          onOpenCreateProject={(rowIndex) => {
            setActiveRowIdx(rowIndex);
            setQuickCreateType("project");
          }}
        />
      </div>

      {/* Quick Create Project Modal */}
      {quickCreateType && (
        <QuickCreateModal
          isOpen={true}
          type={quickCreateType}
          onClose={() => setQuickCreateType(null)}
          onCreated={(newItem) => {
            refetchProjects();
            const updated = [...rows];
            updated[activeRowIdx] = {
              ...updated[activeRowIdx],
              projectId: newItem.id,
              projectName: newItem.name,
            };
            setRows(updated);
          }}
        />
      )}

      {/* Account Slide-Over Drawer for quick inline COA creation */}
      {isAccountDrawerOpen && (
        <AccountSlideOverDrawer
          isOpen={true}
          mode="CREATE"
          onClose={() => {
            setIsAccountDrawerOpen(false);
            refetchAccounts();
          }}
          onSave={async () => {
            setIsAccountDrawerOpen(false);
            await refetchAccounts();
          }}
          allAccounts={accounts}
        />
      )}
    </div>
  );
}
