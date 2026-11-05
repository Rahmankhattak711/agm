"use client";

import React, { useMemo } from "react";
import {
  UAE_TAX_RATES,
  TaxCategoryType,
  TaxEngineService,
} from "@/lib/services/accounting/tax-engine.service";
import { Trash2, Plus, Info, Sparkles, PlusCircle } from "lucide-react";

export interface JournalGridRow {
  id: string;
  description: string;
  accountId: string;
  accountName?: string;
  accountCode?: string;
  currency: string;
  fxRate: number;
  debit: number | "";
  credit: number | "";
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
  costCenter: string;
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
      costCenter: "",
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
      <div className="border border-slate-200/90 rounded-2xl overflow-x-auto bg-white shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse min-w-[1280px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <th className="px-2 py-3 w-8 text-center text-slate-400">#</th>
              <th className="px-3 py-3 w-48 min-w-[180px]">Description</th>
              <th className="px-3 py-3 w-56 min-w-[220px]">Account *</th>
              <th className="px-2 py-3 w-16 text-center">Currency</th>
              <th className="px-2 py-3 w-20 text-center">
                <div className="inline-flex items-center gap-1 justify-center" title="Foreign exchange multiplier to AED">
                  <span>FX rate</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-3 py-3 w-28 text-right">Debit</th>
              <th className="px-3 py-3 w-28 text-right">Credit</th>
              <th className="px-3 py-3 w-28 text-right bg-slate-100/40 text-slate-700">Debit AED</th>
              <th className="px-3 py-3 w-28 text-right bg-slate-100/40 text-slate-700">Credit AED</th>
              <th className="px-3 py-3 w-48 min-w-[190px]">Tax Rate</th>
              <th className="px-3 py-3 w-40 min-w-[150px]">Contact</th>
              <th className="px-3 py-3 w-44 min-w-[160px]">Project</th>
              <th className="px-3 py-3 w-32 min-w-[130px]">Branch</th>
              <th className="px-3 py-3 w-32 min-w-[120px]">Cost center</th>
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
                <td className="px-2 py-1.5">
                  <select
                    value={row.accountId}
                    onChange={(e) => {
                      if (e.target.value === "__create__") {
                        onOpenCreateAccount();
                      } else {
                        handleAccountChange(idx, e.target.value);
                      }
                    }}
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs outline-none font-medium truncate transition-all cursor-pointer ${
                      !row.accountId
                        ? "border-amber-300 bg-amber-50/20 text-slate-500"
                        : "border-slate-200 hover:border-slate-300 text-slate-800 focus:border-[#5046e5]"
                    }`}
                  >
                    <option value="">Select account...</option>
                    <option value="__create__" className="text-[#5046e5] font-bold">
                      + Create new account...
                    </option>
                    {postableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Currency */}
                <td className="px-2 py-1.5 text-center">
                  <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-slate-100 border border-slate-200 font-semibold text-slate-600">
                    {row.currency || "AED"}
                  </span>
                </td>

                {/* FX Rate */}
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={row.fxRate}
                    onChange={(e) => updateRow(idx, { fxRate: parseFloat(e.target.value) || 1 })}
                    className="w-16 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1.5 text-xs text-right font-mono focus:border-[#5046e5] outline-none text-slate-700"
                  />
                </td>

                {/* Debit */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="—"
                    value={row.debit}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                      updateRow(idx, {
                        debit: val,
                        credit: val !== "" && val > 0 ? "" : row.credit,
                      });
                    }}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5046e5] rounded-lg px-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-semibold outline-none"
                  />
                </td>

                {/* Credit */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="—"
                    value={row.credit}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                      updateRow(idx, {
                        credit: val,
                        debit: val !== "" && val > 0 ? "" : row.debit,
                      });
                    }}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#5046e5] rounded-lg px-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-semibold outline-none"
                  />
                </td>

                {/* Debit AED */}
                <td className="px-3 py-2 text-right font-mono font-bold bg-slate-50/60 text-slate-800">
                  {row.debitAed > 0 ? row.debitAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </td>

                {/* Credit AED */}
                <td className="px-3 py-2 text-right font-mono font-bold bg-slate-50/60 text-slate-800">
                  {row.creditAed > 0 ? row.creditAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </td>

                {/* Tax Rate (Grouped as in User's screenshot) */}
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <select
                      value={row.taxType}
                      onChange={(e) => updateRow(idx, { taxType: e.target.value as TaxCategoryType })}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#5046e5] outline-none cursor-pointer font-medium"
                    >
                      <optgroup label="OUT OF SCOPE">
                        <option value="OUT_OF_SCOPE">0% - Out of Scope</option>
                        <option value="EXEMPT">0% - Exempt</option>
                      </optgroup>
                      <optgroup label="PURCHASES">
                        <option value="STANDARD_PURCHASES">5% - VAT on Purchases</option>
                      </optgroup>
                      <optgroup label="REVERSE CHARGE">
                        <option value="REVERSE_CHARGE">5% - Reverse Charge</option>
                      </optgroup>
                      <optgroup label="SALES">
                        <option value="STANDARD_SALES">5% - Standard Rated</option>
                        <option value="ZERO_RATED">0% - Zero-Rated Sales</option>
                      </optgroup>
                    </select>
                    {row.taxAmount > 0 && (
                      <span className="text-[10px] text-indigo-600 font-mono font-semibold block mt-0.5 px-1">
                        VAT: AED {row.taxAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Contact */}
                <td className="px-2 py-1.5">
                  <select
                    value={row.contactId || ""}
                    onChange={(e) => {
                      const c = contacts.find((item) => item.id === e.target.value);
                      updateRow(idx, {
                        contactId: e.target.value || undefined,
                        contactName: c?.name || undefined,
                      });
                    }}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#5046e5] outline-none truncate cursor-pointer"
                  >
                    <option value="">Select contact...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.type ? `(${c.type})` : ""}
                      </option>
                    ))}
                  </select>
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

                {/* Cost Center */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="—"
                    value={row.costCenter}
                    onChange={(e) => updateRow(idx, { costCenter: e.target.value })}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#5046e5] outline-none"
                  />
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
