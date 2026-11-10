"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/lib/hooks/api-hooks";
import { useProjects } from "@/lib/hooks/projects-hooks";
import { useCustomers } from "@/lib/hooks/commercial-hooks";
import { useSuppliers } from "@/lib/hooks/inventory-hooks";
import { JournalEntryGrid, JournalGridRow } from "../components/JournalEntryGrid";
import { JournalSummaryCard } from "../components/JournalSummaryCard";
import { QuickCreateModal } from "../components/QuickCreateModal";
import { AccountSlideOverDrawer } from "../../accounts/components/AccountSlideOverDrawer";
import { toast } from "@/lib/toast";
import { ArrowLeft, BookOpen, Send, CheckCircle2, AlertTriangle, Calendar, FileText } from "lucide-react";

export default function CreateJournalPage() {
  const router = useRouter();
  const { data: accounts = [], refetch: refetchAccounts } = useAccounts();
  const { data: projects = [], refetch: refetchProjects } = useProjects();
  const { data: customers = [] } = useCustomers();
  const { data: suppliers = [] } = useSuppliers();

  // Unified contacts list
  const contacts = useMemo(() => {
    const list: Array<{ id: string; name: string; type: "Customer" | "Supplier" }> = [];
    customers.forEach((c) => {
      list.push({ id: c.id, name: c.name, type: "Customer" });
    });
    suppliers.forEach((s) => {
      list.push({ id: s.id, name: s.name, type: "Supplier" });
    });
    return list;
  }, [customers, suppliers]);

  // Form Header State
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [taxInclusive, setTaxInclusive] = useState<"exclusive" | "inclusive" | "no_tax">("exclusive");
  const [saving, setSaving] = useState<boolean>(false);

  // Quick Create Modals State
  const [quickCreateType, setQuickCreateType] = useState<"project" | null>(null);
  const [activeRowIdx, setActiveRowIdx] = useState<number>(0);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState<boolean>(false);

  // Initial Rows (4 rows)
  const [rows, setRows] = useState<JournalGridRow[]>([
    {
      id: "row-1",
      invoiceNumber: "",
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
      corporateTaxTreatment: "TAXABLE_9",
    },
    {
      id: "row-2",
      invoiceNumber: "",
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
      corporateTaxTreatment: "TAXABLE_9",
    },
    {
      id: "row-3",
      invoiceNumber: "",
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
      corporateTaxTreatment: "TAXABLE_9",
    },
    {
      id: "row-4",
      invoiceNumber: "",
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
      corporateTaxTreatment: "TAXABLE_9",
    },
  ]);

  // Real-time Math Summary calculation strictly based on posted line values
  const mathSummary = useMemo(() => {
    let subtotalDebit = 0;
    let subtotalCredit = 0;
    let taxDebit = 0;
    let taxCredit = 0;

    for (const r of rows) {
      const fx = Number(r.fxRate) > 0 ? Number(r.fxRate) : 1;
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

    const totalDebitAed = Math.round(subtotalDebit * 100) / 100;
    const totalCreditAed = Math.round(subtotalCredit * 100) / 100;
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
      hasUnpostedTax: (taxDebit > 0 || taxCredit > 0),
    };
  }, [rows]);

  // Auto-Balance Helper: fills the difference in the last row or adds a new balancing row
  const handleAutoBalance = () => {
    const diff = mathSummary.totalDebitAed - mathSummary.totalCreditAed;
    if (Math.abs(diff) < 0.01) {
      toast.info("Journal entry is already balanced!");
      return;
    }

    const updated = [...rows];
    const absDiff = Math.abs(diff);

    // Find template row to inherit invoice, project, branch, tax
    const template = updated.find((r) => r.invoiceNumber || r.projectId || r.branch);

    // Look for an unfilled row first
    const emptyRowIdx = updated.findIndex((r) => !r.accountId && !r.debit && !r.credit);

    if (emptyRowIdx >= 0) {
      const target = updated[emptyRowIdx];
      updated[emptyRowIdx] = {
        ...target,
        invoiceNumber: target.invoiceNumber || template?.invoiceNumber || "",
        projectId: target.projectId || template?.projectId || "",
        projectName: target.projectName || template?.projectName || "",
        branch: target.branch || template?.branch || "",
        taxType: target.taxType && target.taxType !== "OUT_OF_SCOPE" ? target.taxType : (template?.taxType || "OUT_OF_SCOPE"),
        corporateTaxTreatment: target.corporateTaxTreatment || template?.corporateTaxTreatment || "TAXABLE_9",
        credit: diff > 0 ? absDiff : "",
        creditAed: diff > 0 ? absDiff : 0,
        debit: diff < 0 ? absDiff : "",
        debitAed: diff < 0 ? absDiff : 0,
      };
    } else {
      // Append a new row with the difference
      updated.push({
        id: `row-autobalance-${Date.now()}`,
        invoiceNumber: template?.invoiceNumber || "",
        description: "Balancing Entry",
        accountId: "",
        currency: "AED",
        fxRate: 1,
        debit: diff < 0 ? absDiff : "",
        credit: diff > 0 ? absDiff : "",
        debitAed: diff < 0 ? absDiff : 0,
        creditAed: diff > 0 ? absDiff : 0,
        taxType: template?.taxType || "OUT_OF_SCOPE",
        taxRate: 0,
        taxAmount: 0,
        projectId: template?.projectId || "",
        projectName: template?.projectName || "",
        branch: template?.branch || "",
        corporateTaxTreatment: template?.corporateTaxTreatment || "TAXABLE_9",
      });
    }

    setRows(updated);
    toast.success(`Auto-balanced with AED ${absDiff.toFixed(2)}`);
  };

  // Auto-Add VAT Line Helper
  const handleAddVatLine = () => {
    const vatDeb = mathSummary.taxDebit;
    const vatCre = mathSummary.taxCredit;
    const netVat = Math.round(Math.abs(vatDeb - vatCre) * 100) / 100;

    if (netVat <= 0) {
      toast.info("No tax amount detected to add.");
      return;
    }

    // Try finding VAT Input (2200) or VAT Output (2210)
    let vatAcc = accounts.find((a: any) =>
      vatDeb > vatCre
        ? a.accountCode === "2200" || a.accountName.toLowerCase().includes("input tax")
        : a.accountCode === "2210" || a.accountName.toLowerCase().includes("output tax")
    );

    if (!vatAcc) {
      vatAcc = accounts.find((a: any) => a.accountName.toLowerCase().includes("vat"));
    }

    const template = rows.find((r) => r.invoiceNumber || r.projectId || r.branch);
    const updated = [...rows];
    updated.push({
      id: `row-vat-${Date.now()}`,
      invoiceNumber: template?.invoiceNumber || "",
      description: vatDeb > vatCre ? "5% Input VAT Claimable" : "5% Output VAT Payable",
      accountId: vatAcc ? vatAcc.id : "",
      accountName: vatAcc?.accountName,
      accountCode: vatAcc?.accountCode,
      currency: "AED",
      fxRate: 1,
      debit: vatDeb > vatCre ? netVat : "",
      credit: vatCre >= vatDeb ? netVat : "",
      debitAed: vatDeb > vatCre ? netVat : 0,
      creditAed: vatCre >= vatDeb ? netVat : 0,
      taxType: "OUT_OF_SCOPE",
      taxRate: 0,
      taxAmount: 0,
      projectId: template?.projectId || "",
      projectName: template?.projectName || "",
      branch: template?.branch || "",
      corporateTaxTreatment: "OUT_OF_SCOPE",
    });

    setRows(updated);
    toast.success(`Added VAT Line for AED ${netVat.toFixed(2)}`);
  };

  const handleSave = async (isPosted: boolean) => {
    const activeLines = rows.filter(
      (r) => r.accountId && (Number(r.debit) > 0 || Number(r.credit) > 0)
    );

    if (activeLines.length < 2) {
      toast.error("A journal entry requires at least 2 lines with accounts and amounts.");
      return;
    }

    if (isPosted && !mathSummary.isBalanced) {
      toast.error(
        `Debits and Credits must balance to Post. Current Difference: AED ${mathSummary.difference.toFixed(2)}`
      );
      return;
    }

    setSaving(true);
    try {
      const primaryRef = activeLines.find((l) => l.invoiceNumber)?.invoiceNumber;
      const payload = {
        entryDate,
        reference: reference.trim() || primaryRef || undefined,
        description: notes.trim() || (primaryRef ? `Invoice ${primaryRef}` : undefined),
        isPosted,
        lines: activeLines.map((r) => ({
          accountId: r.accountId,
          invoiceNumber: r.invoiceNumber?.trim() || undefined,
          costCenter: r.invoiceNumber?.trim() || undefined,
          description: r.description.trim() || (r.invoiceNumber ? `Invoice ${r.invoiceNumber.trim()}` : undefined),
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
          currency: r.currency || "AED",
          fxRate: Number(r.fxRate) || 1,
          taxRate: r.taxRate || 0,
          taxType: r.taxType,
          taxAmount: r.taxAmount || 0,
          projectId: r.projectId || null,
          contactId: r.contactId || null,
          contactName: r.contactName || null,
          branch: r.branch || null,
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
    <div
      className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-5 sm:py-4 space-y-4 font-sans min-h-screen"
      style={{ backgroundColor: "#eef2f6" }}
    >
      {/* Top Header Card matching Fixed Assets & Chart of Accounts */}
      <div
        className="bg-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries")}
            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Journal Entries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <BookOpen className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[15px] sm:text-base font-semibold text-slate-900 tracking-tight leading-tight">
                Create Journal Entry
              </h1>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-normal"
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
              >
                Manual Voucher
              </span>
            </div>
            <p className="text-[11px] font-normal text-slate-500 mt-0.5">
              Record double-entry ledger lines, VAT adjustments, and project allocations in one clean flow.
            </p>
          </div>
        </div>

        {/* Right Actions & Secure Badge */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <div
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-medium mr-1"
            style={{
              backgroundColor: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure journal record</span>
          </div>

          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries")}
            className="h-8 px-3 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="h-8 px-3.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: "#ffffff",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
            }}
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !mathSummary.isBalanced}
            className="h-8 px-4 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              mathSummary.isBalanced
                ? {
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "1px solid #1e40af",
                  }
                : {
                    backgroundColor: "#e2e8f0",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                  }
            }
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Posting..." : "Post Journal"}</span>
          </button>
        </div>
      </div>

      {/* Top Controls Grid: Transaction Parameters + Live Double-Entry Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Inputs Card */}
        <div
          className="lg:col-span-8 bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          style={{ border: "1px solid #cbd5e1" }}
        >
          {/* Soft Blue Section Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              backgroundColor: "#f0f7ff",
              borderBottom: "1px solid #dbeafe",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                }}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-[13px] font-medium text-slate-800">
                Transaction Parameters
              </h2>
            </div>
            <span className="text-[10.5px] font-normal text-slate-500">
              Required
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                  Journal Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white text-[12px] font-mono font-normal text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  style={{ border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              {/* Reference # */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                  Voucher Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. JV-2026-001 or INV-102"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white text-[12px] font-mono font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  style={{ border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Tax Treatment / Amounts are */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                  Amounts Are (Tax Treatment)
                </label>
                <select
                  value={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl bg-white text-[12px] font-normal text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  <option value="exclusive">Tax Exclusive (Net + VAT)</option>
                  <option value="inclusive">Tax Inclusive (VAT Included)</option>
                  <option value="no_tax">No Tax (Out of Scope)</option>
                </select>
              </div>
            </div>

            {/* Notes / Narration */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1.5">
                Journal Notes / Narration
              </label>
              <textarea
                rows={3}
                placeholder="Write a clear narration or audit memo for this journal voucher..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-white text-[12px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                style={{ border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </div>

        {/* Right Live Summary Card */}
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
            hasUnpostedTax={mathSummary.hasUnpostedTax}
            onAutoBalance={handleAutoBalance}
            onAddVatLine={handleAddVatLine}
          />
        </div>
      </div>

      {/* Spreadsheet Table */}
      <JournalEntryGrid
        rows={rows}
        onChange={setRows}
        accounts={accounts}
        projects={projects}
        contacts={contacts}
        taxInclusive={taxInclusive}
        onOpenCreateAccount={() => router.push("/finance/accounts/new")}
        onOpenCreateProject={(rowIndex) => {
          setActiveRowIdx(rowIndex);
          setQuickCreateType("project");
        }}
        onAutoBalance={handleAutoBalance}
        onAddVatLine={handleAddVatLine}
      />

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
