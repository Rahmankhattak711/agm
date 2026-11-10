"use client";

import React, { useMemo } from "react";
import {
  UAE_TAX_RATES,
  TaxCategoryType,
  TaxEngineService,
} from "@/lib/services/accounting/tax-engine.service";
import { Trash2, Plus, Info, Sparkles, PlusCircle } from "lucide-react";
import { HierarchicalAccountSelect } from "./HierarchicalAccountSelect";
import { TaxRateDropdown } from "./TaxRateDropdown";

export interface JournalGridRow {
  id: string;
  invoiceNumber?: string;
  description: string;
  accountId: string;
  accountName?: string;
  accountCode?: string;
  currency: string;
  fxRate: number;
  debit: number | string;
  credit: number | string;
  debitAed: number;
  creditAed: number;
  taxType: TaxCategoryType;
  taxRate: number;
  taxAmount: number;
  contactId?: string;
  contactName?: string;
  projectId: string;
  projectName?: string;
  branch: string;
  costCenter?: string;
  corporateTaxTreatment?: string;
}

interface JournalEntryGridProps {
  rows: JournalGridRow[];
  onChange: (rows: JournalGridRow[]) => void;
  accounts: Array<{
    id: string;
    accountCode: string;
    accountName: string;
    level?: number;
    parentId?: string | null;
    allowPosting?: boolean;
  }>;
  projects: Array<{ id: string; name: string; projectCode: string }>;
  contacts?: Array<{ id: string; name: string; type?: "Customer" | "Supplier" }>;
  taxInclusive?: "exclusive" | "inclusive" | "no_tax";
  onOpenCreateAccount: () => void;
  onOpenCreateProject: (rowIndex: number) => void;
  onAutoBalance?: () => void;
  onAddVatLine?: () => void;
}

export const BRANCH_OPTIONS = [
  "Dubai HQ",
  "Abu Dhabi Site",
  "Sharjah Workshop",
  "Ras Al Khaimah Site",
];

export const CORPORATE_TAX_OPTIONS = [
  { value: "TAXABLE_9", label: "Standard Taxable (9%)" },
  { value: "EXEMPT", label: "Exempt Income" },
  { value: "NON_DEDUCTIBLE", label: "Non-Deductible Expense" },
  { value: "FREE_ZONE_0", label: "Qualifying Free Zone (0%)" },
  { value: "OUT_OF_SCOPE", label: "Out of Scope" },
];

export function JournalEntryGrid({
  rows,
  onChange,
  accounts,
  projects,
  contacts = [],
  taxInclusive = "exclusive",
  onOpenCreateAccount,
  onOpenCreateProject,
  onAutoBalance,
  onAddVatLine,
}: JournalEntryGridProps) {
  // Filter to postable accounts (exclude level 1 summary parents or non-postable)
  const postableAccounts = useMemo(() => {
    return accounts.filter(
      (acc: any) => acc.allowPosting !== false && acc.level !== 1
    );
  }, [accounts]);

  const updateRow = (index: number, updates: Partial<JournalGridRow>) => {
    const updated = [...rows];
    let row = { ...updated[index], ...updates };

    // Auto-inherit Invoice #, Project, Branch, Tax Rate, and Corporate Tax from prior row if index > 0
    if (index > 0) {
      const template = updated.slice(0, index).reverse().find((r) => r.invoiceNumber || r.projectId || r.branch || (r.taxType && r.taxType !== "OUT_OF_SCOPE"));
      if (template) {
        if (!row.invoiceNumber && template.invoiceNumber) {
          row.invoiceNumber = template.invoiceNumber;
        }
        if (!row.projectId && template.projectId) {
          row.projectId = template.projectId;
          row.projectName = template.projectName;
        }
        if (!row.branch && template.branch) {
          row.branch = template.branch;
        }
        if ((!row.taxType || row.taxType === "OUT_OF_SCOPE") && template.taxType && template.taxType !== "OUT_OF_SCOPE" && updates.taxType === undefined) {
          row.taxType = template.taxType;
        }
        if ((!row.corporateTaxTreatment || row.corporateTaxTreatment === "TAXABLE_9") && template.corporateTaxTreatment && updates.corporateTaxTreatment === undefined) {
          row.corporateTaxTreatment = template.corporateTaxTreatment;
        }
      }
    }

    const fx = Number(row.fxRate) > 0 ? Number(row.fxRate) : 1;
    const debitNum = Number(row.debit) || 0;
    const creditNum = Number(row.credit) || 0;

    row.debitAed = Math.round(debitNum * fx * 100) / 100;
    row.creditAed = Math.round(creditNum * fx * 100) / 100;

    const activeAmt = debitNum > 0 ? debitNum : creditNum;
    if (activeAmt > 0 && row.taxType && taxInclusive !== "no_tax") {
      const isInclusive = taxInclusive === "inclusive";
      const taxCalc = TaxEngineService.calculateTax(activeAmt, row.taxType, isInclusive);
      row.taxAmount = Math.round(taxCalc.taxAmount * fx * 100) / 100;
      const opt = UAE_TAX_RATES.find((t) => t.code === row.taxType);
      row.taxRate = opt ? opt.rate : 0;
    } else {
      row.taxAmount = 0;
      const opt = UAE_TAX_RATES.find((t) => t.code === row.taxType);
      row.taxRate = opt ? opt.rate : 0;
    }

    updated[index] = row;
    onChange(updated);
  };

  const handleAccountChange = (index: number, accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    const row = rows[index];
    const template = index > 0
      ? rows.slice(0, index).reverse().find((r) => r.invoiceNumber || r.projectId || r.branch || (r.taxType && r.taxType !== "OUT_OF_SCOPE"))
      : null;

    let targetTax: TaxCategoryType = row.taxType;
    if (template?.taxType && template.taxType !== "OUT_OF_SCOPE") {
      targetTax = template.taxType;
    } else if (taxInclusive === "no_tax") {
      targetTax = "OUT_OF_SCOPE";
    }

    updateRow(index, {
      accountId: acc.id,
      accountName: acc.accountName,
      accountCode: acc.accountCode,
      taxType: targetTax,
      invoiceNumber: row.invoiceNumber || template?.invoiceNumber || "",
      projectId: row.projectId || template?.projectId || "",
      projectName: row.projectName || template?.projectName || "",
      branch: row.branch || template?.branch || "",
      corporateTaxTreatment: row.corporateTaxTreatment || template?.corporateTaxTreatment || "TAXABLE_9",
    });
  };

  const addRows = (count: number = 1) => {
    const template = [...rows].reverse().find((r) => r.invoiceNumber || r.projectId || r.branch);
    const newRows: JournalGridRow[] = Array.from({ length: count }, (_, i) => ({
      id: `row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: template?.invoiceNumber || "",
      description: "",
      accountId: "",
      currency: "AED",
      fxRate: 1,
      debit: "",
      credit: "",
      debitAed: 0,
      creditAed: 0,
      taxType: template?.taxType || "OUT_OF_SCOPE",
      taxRate: template?.taxRate || 0,
      taxAmount: 0,
      projectId: template?.projectId || "",
      projectName: template?.projectName || "",
      branch: template?.branch || "",
      corporateTaxTreatment: template?.corporateTaxTreatment || "TAXABLE_9",
    }));
    onChange([...rows, ...newRows]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 2) {
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Table Container matching Fixed Assets / Chart of Accounts card */}
      <div
        className="rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
        style={{ border: "1px solid #cbd5e1" }}
      >
        {/* Top Card Header Bar */}
        <div
          className="px-4 py-3 flex flex-wrap items-center justify-between gap-2.5"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-medium text-slate-800">
              Journal entry lines
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
              style={{
                backgroundColor: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {rows.length} lines
            </span>
          </div>

          {/* Row Controls & Smart Double-Entry Helpers in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addRows(1)}
              className="h-7 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              style={{
                backgroundColor: "#ffffff",
                color: "#334155",
                border: "1px solid #cbd5e1",
              }}
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Add row</span>
            </button>
            <button
              type="button"
              onClick={() => addRows(5)}
              className="h-7 px-2.5 rounded-lg text-[11px] font-normal transition-colors cursor-pointer"
              style={{
                backgroundColor: "#ffffff",
                color: "#64748b",
                border: "1px solid #cbd5e1",
              }}
            >
              + 5 rows
            </button>

            {onAddVatLine && (
              <button
                type="button"
                onClick={onAddVatLine}
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Auto-Add VAT (5%)</span>
              </button>
            )}

            {onAutoBalance && (
              <button
                type="button"
                onClick={onAutoBalance}
                className="h-7 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Balance Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Grid Area */}
        <div className="overflow-x-auto min-h-[420px] pb-28">
          <table className="w-full text-left text-[11.5px] whitespace-nowrap border-collapse min-w-[1240px]">
            <thead>
              <tr
                className="text-slate-500 uppercase text-[9.5px] tracking-wider font-medium"
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <th className="px-2 py-2.5 w-8 text-center text-slate-400 font-medium">#</th>
                <th className="px-2.5 py-2.5 w-36 min-w-[140px] font-medium">Invoice / Ref #</th>
                <th className="px-2.5 py-2.5 w-56 min-w-[230px] font-medium">Account *</th>
                <th className="px-2.5 py-2.5 w-32 min-w-[130px] text-right font-medium">Debit (AED)</th>
                <th className="px-2.5 py-2.5 w-32 min-w-[130px] text-right font-medium">Credit (AED)</th>
                <th className="px-2.5 py-2.5 w-28 text-right bg-slate-50/80 text-slate-600 font-medium">Debit AED</th>
                <th className="px-2.5 py-2.5 w-28 text-right bg-slate-50/80 text-slate-600 font-medium">Credit AED</th>
                <th className="px-2.5 py-2.5 w-48 min-w-[185px] font-medium">Tax Rate</th>
                <th className="px-2.5 py-2.5 w-44 min-w-[155px] font-medium">Project</th>
                <th className="px-2.5 py-2.5 w-32 min-w-[125px] font-medium">Branch</th>
                <th className="px-2.5 py-2.5 w-44 min-w-[165px] font-medium">Corporate Tax</th>
                <th className="px-2.5 py-2.5 w-48 min-w-[180px] font-medium">Description</th>
                <th className="px-2 py-2.5 w-9 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[#f8fafc] group transition-colors">
                  {/* Index */}
                  <td className="px-2 py-2 text-center text-slate-400 text-[11px] font-mono font-normal">
                    {idx + 1}
                  </td>

                  {/* Invoice # */}
                  <td className="px-2 py-1.5 min-w-[145px]">
                    <input
                      type="text"
                      placeholder="INV-001 / Ref"
                      value={row.invoiceNumber || ""}
                      onChange={(e) => updateRow(idx, { invoiceNumber: e.target.value })}
                      className="w-full bg-white focus:border-blue-600 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-normal text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                      style={{ border: "1px solid #cbd5e1" }}
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = (row.invoiceNumber || "").replace(/^(INV-|INV\/|REF-|REF\/)/i, "");
                          updateRow(idx, { invoiceNumber: `INV-${cur}` });
                        }}
                        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer select-none"
                        style={{ border: "1px solid #e2e8f0" }}
                        title="Set INV- prefix"
                      >
                        INV-
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = (row.invoiceNumber || "").replace(/^(INV-|INV\/|REF-|REF\/)/i, "");
                          updateRow(idx, { invoiceNumber: `REF-${cur}` });
                        }}
                        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer select-none"
                        style={{ border: "1px solid #e2e8f0" }}
                        title="Set REF- prefix"
                      >
                        REF-
                      </button>
                    </div>
                  </td>

                  {/* Account */}
                  <td className="px-2 py-1.5 min-w-[235px]">
                    <HierarchicalAccountSelect
                      value={row.accountId}
                      onChange={(accountId) => handleAccountChange(idx, accountId)}
                      accounts={accounts}
                      onOpenCreateAccount={onOpenCreateAccount}
                    />
                  </td>

                  {/* Debit */}
                  <td className="px-2 py-1.5 min-w-[135px]">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9.5px] font-normal text-slate-400 select-none pointer-events-none">
                        AED
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.debit}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateRow(idx, {
                            debit: val,
                            credit: val && parseFloat(val) > 0 ? "" : row.credit,
                          });
                        }}
                        onBlur={() => {
                          if (row.debit !== "" && row.debit !== undefined) {
                            const num = parseFloat(String(row.debit));
                            if (!isNaN(num) && num > 0) {
                              updateRow(idx, { debit: num.toFixed(2) });
                            }
                          }
                        }}
                        className="w-full bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 rounded-xl pl-9 pr-2.5 py-1.5 text-[11.5px] text-right font-mono text-slate-800 font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                        style={{ border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </td>

                  {/* Credit */}
                  <td className="px-2 py-1.5 min-w-[135px]">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9.5px] font-normal text-slate-400 select-none pointer-events-none">
                        AED
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.credit}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateRow(idx, {
                            credit: val,
                            debit: val && parseFloat(val) > 0 ? "" : row.debit,
                          });
                        }}
                        onBlur={() => {
                          if (row.credit !== "" && row.credit !== undefined) {
                            const num = parseFloat(String(row.credit));
                            if (!isNaN(num) && num > 0) {
                              updateRow(idx, { credit: num.toFixed(2) });
                            }
                          }
                        }}
                        className="w-full bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 rounded-xl pl-9 pr-2.5 py-1.5 text-[11.5px] text-right font-mono text-slate-800 font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                        style={{ border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </td>

                  {/* Debit AED */}
                  <td className="px-2.5 py-2 text-right font-mono font-medium bg-slate-50/50 text-slate-800 text-[11.5px]">
                    {row.debitAed > 0
                      ? row.debitAed.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>

                  {/* Credit AED */}
                  <td className="px-2.5 py-2 text-right font-mono font-medium bg-slate-50/50 text-slate-800 text-[11.5px]">
                    {row.creditAed > 0
                      ? row.creditAed.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>

                  {/* Tax Rate */}
                  <td className="px-2 py-1.5 min-w-[190px]">
                    <TaxRateDropdown
                      value={row.taxType}
                      onChange={(newTaxType) => updateRow(idx, { taxType: newTaxType })}
                    />
                    {row.taxAmount > 0 && (
                      <span className="text-[10px] text-blue-700 font-mono font-normal block mt-0.5 px-1">
                        VAT: AED {row.taxAmount.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Project */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.projectId || ""}
                      onChange={(e) => {
                        if (e.target.value === "__create__") {
                          onOpenCreateProject(idx);
                        } else {
                          const p = projects.find((item) => item.id === e.target.value);
                          updateRow(idx, {
                            projectId: e.target.value,
                            projectName: p?.name || "",
                          });
                        }
                      }}
                      className="w-full bg-white rounded-xl px-2.5 py-1.5 text-[11px] font-normal text-slate-700 focus:border-blue-600 outline-none truncate cursor-pointer"
                      style={{ border: "1px solid #cbd5e1" }}
                    >
                      <option value="">Select project...</option>
                      <option value="__create__" className="text-blue-700 font-medium">
                        + Create project
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.projectCode ? `${p.projectCode} - ` : ""}
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Branch */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.branch || ""}
                      onChange={(e) => updateRow(idx, { branch: e.target.value })}
                      className="w-full bg-white rounded-xl px-2 py-1.5 text-[11px] font-normal text-slate-700 focus:border-blue-600 outline-none cursor-pointer"
                      style={{ border: "1px solid #cbd5e1" }}
                    >
                      <option value="">—</option>
                      {BRANCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Corporate Tax Treatment */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.corporateTaxTreatment || "TAXABLE_9"}
                      onChange={(e) => updateRow(idx, { corporateTaxTreatment: e.target.value })}
                      className="w-full bg-white rounded-xl px-2 py-1.5 text-[11px] font-normal text-slate-700 focus:border-blue-600 outline-none cursor-pointer"
                      style={{ border: "1px solid #cbd5e1" }}
                    >
                      {CORPORATE_TAX_OPTIONS.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Description */}
                  <td className="px-2 py-1.5 min-w-[180px]">
                    <input
                      type="text"
                      placeholder="Description / Narration"
                      value={row.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      className="w-full bg-white focus:border-blue-600 px-2.5 py-1.5 rounded-xl text-[11px] font-normal text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                      style={{ border: "1px solid #cbd5e1" }}
                    />
                  </td>

                  {/* Delete line */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 2}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 disabled:opacity-20 transition-colors cursor-pointer"
                      title={rows.length <= 2 ? "Minimum 2 lines required" : "Remove line"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
