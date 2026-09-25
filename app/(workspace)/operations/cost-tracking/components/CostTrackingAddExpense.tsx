import React, { useState } from "react";
import { Project } from "@/lib/hooks/api-hooks";
import { Button, Input, DatePicker } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { CATEGORIES, dpToISO, isoToDP } from "../types";

interface CostTrackingAddExpenseProps {
  selectedProject: Project | null;
  onAddCost: (data: {
    projectId: string;
    costType: any;
    category: string;
    description: string;
    amount: number;
    quantity?: number;
    unitRate?: number;
    reference?: string;
    date: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CostTrackingAddExpense({
  selectedProject,
  onAddCost,
  isLoading,
}: CostTrackingAddExpenseProps) {
  const [selectedCatKey, setSelectedCatKey] = useState<string>("labor");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    isoToDP(new Date().toISOString().split("T")[0]),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const [reference, setReference] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;

    const cleanAmt = Number(String(amount).replace(/,/g, "").trim());
    if (!cleanAmt || cleanAmt <= 0 || isNaN(cleanAmt)) {
      setErrorMsg("Please enter a valid amount greater than 0");
      return;
    }

    const targetCat =
      CATEGORIES.find((c) => c.key === selectedCatKey) || CATEGORIES[0];
    const finalDesc = description.trim() || targetCat.defaultDesc;

    setErrorMsg("");
    try {
      await onAddCost({
        projectId: selectedProject.id,
        costType: targetCat.costType,
        category: targetCat.name,
        description: finalDesc,
        amount: cleanAmt,
        quantity: quantity ? Number(quantity) : undefined,
        unitRate: unitRate ? Number(unitRate) : undefined,
        reference: reference.trim() || undefined,
        date: dpToISO(date) || new Date().toISOString().split("T")[0],
      });

      setAmount("");
      setDescription("");
      setQuantity("");
      setUnitRate("");
      setReference("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add cost item");
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.key === selectedCatKey);

  return (
    <div className="bg-white rounded-2xl border-2 border-agm-green/30 p-5 shadow-xs space-y-4 print:hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-agm-green text-white flex items-center justify-center text-xs font-bold">
            +
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            Add Cost to Report ({selectedProject?.name || "Project"})
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Select category &amp; enter amount to instantly update the report
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agm-green" />
              1. Select Work Package / Category:
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Selected:{" "}
              <strong className="text-slate-800">
                {selectedCategory?.name}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCatKey === cat.key;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setSelectedCatKey(cat.key);
                    if (!description) setDescription(cat.defaultDesc);
                  }}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${cat.activeBg} ${cat.activeBorder}`
                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs hover:-translate-y-0.5"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-white shadow-xs border-slate-200"
                        : cat.bgLight
                    }`}
                  >
                    <IconComp size={18} className={cat.color} />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block truncate text-xs ${
                        isSelected
                          ? "font-bold text-slate-900"
                          : "font-semibold text-slate-700 group-hover:text-slate-900"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      {cat.costType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            2. Enter Spent Details:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                Amount Spent (AED) *
              </label>
              <Input
                required
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1000 or 39000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full py-2 text-xs font-mono font-bold bg-emerald-50/50 border-emerald-300 text-emerald-950 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">
                  Quick:
                </span>
                {[1000, 5000, 10000, 39000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmount(String(val))}
                    className="px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border-0"
                  >
                    +{val >= 1000 ? `${val / 1000}k` : val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Date *
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Select date"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Description / Memo
              </label>
              <Input
                placeholder={`e.g. ${selectedCategory?.defaultDesc || "Cost details"}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2 text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
          >
            <span>
              {showAdvanced ? "− Hide" : "+ Show"} Optional Reference &amp;
              Quantity
            </span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full py-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unit Rate (AED)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 200"
                  value={unitRate}
                  onChange={(e) => setUnitRate(e.target.value)}
                  className="w-full py-1.5 text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reference / Invoice #
                </label>
                <Input
                  placeholder="e.g. INV-101"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full py-1.5 text-xs bg-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs px-6 py-2 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <PlusIcon size={13} /> Add to Report
          </Button>
        </div>
      </form>
    </div>
  );
}
