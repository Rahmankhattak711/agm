"use client";

import React, { useMemo } from "react";
import { UAE_TAX_RATES, TaxCategoryType, TaxEngineService } from "@/lib/services/accounting/tax-engine.service";
import { Trash2, Plus } from "lucide-react";

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
  onOpenCreateAccount: () => void;
  onOpenCreateProject: (rowIndex: number) => void;
}

export function JournalEntryGrid({
  rows,
  onChange,
  accounts,
  projects,
  onOpenCreateAccount,
  onOpenCreateProject,
}: JournalEntryGridProps) {
  // Strictly filter to detail posting accounts (exclude Level 1 summary headers & allowPosting=false)
  const postableAccounts = useMemo(() => {
    return accounts.filter(
      (acc: any) => acc.allowPosting !== false && acc.level !== 1,
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
    if (activeAmt > 0 && row.taxType) {
      const taxCalc = TaxEngineService.calculateTax(activeAmt, row.taxType);
      row.taxAmount = taxCalc.taxAmount;
      const opt = UAE_TAX_RATES.find((t) => t.code === row.taxType);
      row.taxRate = opt ? opt.rate : 0;
    } else {
      row.taxAmount = 0;
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
      acc.accountName.toLowerCase().includes("cash") ||
      acc.accountName.toLowerCase().includes("bank");

    let defaultTax: TaxCategoryType = row.taxType;
    if (isPaymentAccount) {
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
      id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
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
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <th className="px-3 py-3 w-10 text-center">#</th>
              <th className="px-3 py-3 min-w-[170px]">Description</th>
              <th className="px-3 py-3 min-w-[240px]">Account *</th>
              <th className="px-2 py-3 w-16">Currency</th>
              <th className="px-2 py-3 w-16">FX rate</th>
              <th className="px-3 py-3 min-w-[110px] text-right">Debit</th>
              <th className="px-3 py-3 min-w-[110px] text-right">Credit</th>
              <th className="px-3 py-3 min-w-[110px] text-right bg-slate-50/50">Debit AED</th>
              <th className="px-3 py-3 min-w-[110px] text-right bg-slate-50/50">Credit AED</th>
              <th className="px-3 py-3 min-w-[170px]">Tax rate</th>
              <th className="px-3 py-3 min-w-[170px]">Project / Site</th>
              <th className="px-3 py-3 min-w-[120px]">Cost center</th>
              <th className="px-2 py-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50/70 group transition-colors">
                <td className="px-3 py-2 text-center text-slate-400 text-[11px] font-mono">
                  {idx + 1}
                </td>

                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Line description"
                    value={row.description}
                    onChange={(e) => updateRow(idx, { description: e.target.value })}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none transition-all"
                  />
                </td>

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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none font-medium truncate transition-all cursor-pointer"
                  >
                    <option value="">Select account...</option>
                    <option value="__create__" className="text-[#5046e5] font-bold">
                      + Create account
                    </option>
                    {postableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-2 py-1.5 text-slate-500">
                  <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-slate-100 border border-slate-200 font-semibold text-slate-600">AED</span>
                </td>

                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={row.fxRate}
                    onChange={(e) => updateRow(idx, { fxRate: parseFloat(e.target.value) || 1 })}
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right font-mono focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                  />
                </td>

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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-semibold focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                  />
                </td>

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
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-semibold focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                  />
                </td>

                <td className="px-3 py-2 text-right font-mono font-semibold bg-slate-50/50 text-slate-700">
                  {row.debitAed > 0 ? row.debitAed.toFixed(2) : "—"}
                </td>

                <td className="px-3 py-2 text-right font-mono font-semibold bg-slate-50/50 text-slate-700">
                  {row.creditAed > 0 ? row.creditAed.toFixed(2) : "—"}
                </td>

                <td className="px-2 py-1.5">
                  <select
                    value={row.taxType}
                    onChange={(e) => updateRow(idx, { taxType: e.target.value as TaxCategoryType })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none cursor-pointer"
                  >
                    <optgroup label="OUT OF SCOPE">
                      <option value="OUT_OF_SCOPE">0% - Out of Scope</option>
                      <option value="EXEMPT">0% - Exempt</option>
                    </optgroup>
                    <optgroup label="PURCHASES (TAXABLE)">
                      <option value="STANDARD_PURCHASES">5% - VAT on Purchases</option>
                      <option value="REVERSE_CHARGE">5% - Reverse Charge</option>
                    </optgroup>
                    <optgroup label="SALES (TAXABLE)">
                      <option value="STANDARD_SALES">5% - Standard Rated</option>
                      <option value="ZERO_RATED">0% - Zero-Rated Sales</option>
                    </optgroup>
                  </select>
                </td>

                <td className="px-2 py-1.5">
                  <select
                    value={row.projectId}
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none truncate cursor-pointer"
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

                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="—"
                    value={row.costCenter}
                    onChange={(e) => updateRow(idx, { costCenter: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] outline-none"
                  />
                </td>

                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 2}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1.5 disabled:opacity-20 transition-colors cursor-pointer"
                    title="Remove line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => addRows(1)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Add row</span>
        </button>
        <button
          type="button"
          onClick={() => addRows(10)}
          className="px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
        >
          Add 10 more rows
        </button>
      </div>
    </div>
  );
}
