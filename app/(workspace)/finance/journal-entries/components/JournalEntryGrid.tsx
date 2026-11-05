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
    const row = { ...updated[index], ...updates };

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
    const isPaymentAccount =
      acc.accountCode.startsWith("111") ||
      acc.accountCode.startsWith("101") ||
      acc.accountCode.startsWith("102") ||
      acc.accountName.toLowerCase().includes("cash") ||
      acc.accountName.toLowerCase().includes("bank");

    let defaultTax: TaxCategoryType = row.taxType;
    if (isPaymentAccount || taxInclusive === "no_tax") {
      defaultTax = "OUT_OF_SCOPE";
    }

    updateRow(index, {
      accountId: acc.id,
      accountName: acc.accountName,
      accountCode: acc.accountCode,
      taxType: defaultTax,
    });
  };

  const addRows = (count: number = 1) => {
    const newRows: JournalGridRow[] = Array.from({ length: count }, (_, i) => ({
      id: `row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
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
    <div className="space-y-3">
      {/* Table Container */}
      <div className="border border-slate-200/90 rounded-2xl overflow-x-auto bg-white shadow-xs min-h-[460px] pb-28">
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse w-full min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <th className="px-2 py-3 w-8 text-center text-slate-400">#</th>
              <th className="px-3 py-3 w-48 min-w-[180px]">Description</th>
              <th className="px-3 py-3 w-56 min-w-[220px]">Account *</th>
              <th className="px-3 py-3 w-32 min-w-[130px] text-right">Debit (AED)</th>
              <th className="px-3 py-3 w-32 min-w-[130px] text-right">Credit (AED)</th>
              <th className="px-3 py-3 w-28 text-right bg-slate-100/40 text-slate-700">Debit AED</th>
              <th className="px-3 py-3 w-28 text-right bg-slate-100/40 text-slate-700">Credit AED</th>
              <th className="px-3 py-3 w-48 min-w-[190px]">Tax Rate</th>
              <th className="px-3 py-3 w-44 min-w-[160px]">Project</th>
              <th className="px-3 py-3 w-32 min-w-[130px]">Branch</th>
              <th className="px-3 py-3 w-44 min-w-[170px]">Corporate tax treatment</th>
              <th className="px-2 py-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50/60 group transition-colors">
                {/* Index */}
                <td className="px-2 py-2 text-center text-slate-400 text-[11px] font-mono">
                  {idx + 1}
                </td>

                {/* Description */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Description / Narration"
                    value={row.description}
                    onChange={(e) => updateRow(idx, { description: e.target.value })}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5046e5] px-2.5 py-1.5 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                  />
                </td>

                {/* Account */}
                <td className="px-2 py-1.5 min-w-[240px]">
                  <HierarchicalAccountSelect
                    value={row.accountId}
                    onChange={(accountId) => handleAccountChange(idx, accountId)}
                    accounts={accounts}
                    onOpenCreateAccount={onOpenCreateAccount}
                  />
                </td>

                {/* Debit (with inline AED prefix) */}
                <td className="px-2 py-1.5 min-w-[140px]">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none pointer-events-none">
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
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] rounded-lg pl-10 pr-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                    />
                  </div>
                </td>

                {/* Credit (with inline AED prefix) */}
                <td className="px-2 py-1.5 min-w-[140px]">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none pointer-events-none">
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
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] rounded-lg pl-10 pr-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                    />
                  </div>
                </td>

                {/* Debit AED */}
                <td className="px-3 py-2 text-right font-mono font-bold bg-slate-50/60 text-slate-800">
                  {row.debitAed > 0 ? row.debitAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </td>

                {/* Credit AED */}
                <td className="px-3 py-2 text-right font-mono font-bold bg-slate-50/60 text-slate-800">
                  {row.creditAed > 0 ? row.creditAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </td>

                {/* Tax Rate (Custom Dropdown matching user screenshot) */}
                <td className="px-2 py-1.5 min-w-[200px]">
                  <TaxRateDropdown
                    value={row.taxType}
                    onChange={(newTaxType) => updateRow(idx, { taxType: newTaxType })}
                  />
                  {row.taxAmount > 0 && (
                    <span className="text-[10px] text-indigo-600 font-mono font-semibold block mt-0.5 px-1">
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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#5046e5] outline-none truncate cursor-pointer"
                  >
                    <option value="">Select project...</option>
                    <option value="__create__" className="text-[#5046e5] font-bold">
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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-[#5046e5] outline-none cursor-pointer"
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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 focus:border-[#5046e5] outline-none cursor-pointer"
                  >
                    {CORPORATE_TAX_OPTIONS.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Delete line */}
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 2}
                    className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 disabled:opacity-20 transition-colors cursor-pointer"
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

      {/* Row Controls & Smart Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addRows(1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add row</span>
          </button>
          <button
            type="button"
            onClick={() => addRows(5)}
            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          >
            + 5 rows
          </button>
          <button
            type="button"
            onClick={() => addRows(10)}
            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          >
            + 10 rows
          </button>
        </div>

        {/* Smart Double-Entry Helpers */}
        <div className="flex items-center gap-2">
          {onAddVatLine && (
            <button
              type="button"
              onClick={onAddVatLine}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Auto-Add VAT Line (5%)</span>
            </button>
          )}

          {onAutoBalance && (
            <button
              type="button"
              onClick={onAutoBalance}
              className="px-3.5 py-1.5 rounded-lg bg-[#5046e5]/10 hover:bg-[#5046e5]/20 text-[#5046e5] border border-[#5046e5]/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5046e5]" />
              <span>Auto-Balance Entry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
