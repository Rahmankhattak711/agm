"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Project } from "@/lib/hooks/api-hooks";
import { Button, FormInput, FormDatePicker, FormSubmit } from "@/components/ui";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedCategory =
    CATEGORIES.find((c) => c.key === selectedCatKey) || CATEGORIES[0];

  const form = useForm({
    defaultValues: {
      amount: "",
      date: isoToDP(new Date().toISOString().split("T")[0]),
      description: "",
      quantity: "",
      unitRate: "",
      reference: "",
    },
    onSubmit: async ({ value }) => {
      if (!selectedProject) return;

      const cleanAmt = Number(String(value.amount).replace(/,/g, "").trim());
      if (!cleanAmt || cleanAmt <= 0 || isNaN(cleanAmt)) {
        setErrorMsg("Please enter a valid amount greater than 0");
        return;
      }

      const finalDesc =
        value.description.trim() || selectedCategory.defaultDesc;

      setErrorMsg("");
      try {
        await onAddCost({
          projectId: selectedProject.id,
          costType: selectedCategory.costType,
          category: selectedCategory.name,
          description: finalDesc,
          amount: cleanAmt,
          quantity: value.quantity ? Number(value.quantity) : undefined,
          unitRate: value.unitRate ? Number(value.unitRate) : undefined,
          reference: value.reference.trim() || undefined,
          date: dpToISO(value.date) || new Date().toISOString().split("T")[0],
        });

        form.reset({
          amount: "",
          date: isoToDP(new Date().toISOString().split("T")[0]),
          description: "",
          quantity: "",
          unitRate: "",
          reference: "",
        });
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to add cost item");
      }
    },
  });

  return (
    <div className="bg-agm-card rounded-2xl border-2 border-agm-green/30 p-5 shadow-xs space-y-4 print:hidden">
      <div className="flex items-center justify-between border-b border-agm-border pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-agm-green text-white flex items-center justify-center text-xs font-bold">
            +
          </span>
          <h2 className="text-sm font-bold text-agm-text">
            Add Cost to Report ({selectedProject?.name || "Project"})
          </h2>
        </div>
        <span className="text-[11px] text-agm-muted font-medium">
          Select category &amp; enter amount to instantly update the report
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-bold text-agm-text uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agm-green" />
              1. Select Work Package / Category:
            </label>
            <span className="text-[11px] text-agm-subtle font-medium">
              Selected:{" "}
              <strong className="text-agm-text">
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
                    if (!form.getFieldValue("description")) {
                      form.setFieldValue("description", cat.defaultDesc);
                    }
                  }}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${cat.activeBg} ${cat.activeBorder}`
                      : "bg-agm-card border-agm-box-border hover:border-agm-muted/40 hover:bg-agm-box-bg/50 shadow-2xs hover:-translate-y-0.5"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-agm-card shadow-xs border-agm-box-border"
                        : cat.bgLight
                    }`}
                  >
                    <IconComp size={18} className={cat.color} />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block truncate text-xs ${
                        isSelected
                          ? "font-bold text-agm-text"
                          : "font-semibold text-agm-muted group-hover:text-agm-text"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="block text-[10px] text-agm-subtle font-mono">
                      {cat.costType}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-agm-muted uppercase tracking-wider mb-2">
            2. Enter Spent Details:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-agm-green-dark uppercase tracking-wider mb-1">
                Amount Spent (AED) *
              </label>
              <form.Field name="amount">
                {(field) => (
                  <FormInput
                    field={field}
                    required
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 1000 or 39000"
                    className="w-full py-2 text-xs font-mono font-bold bg-agm-green-soft/50 border-agm-green/30 text-agm-green-dark focus:ring-agm-green/20 focus:border-agm-green"
                  />
                )}
              </form.Field>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-agm-subtle font-bold">
                  Quick:
                </span>
                {[1000, 5000, 10000, 39000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => form.setFieldValue("amount", String(val))}
                    className="px-2 py-0.5 text-[10px] font-mono text-agm-muted bg-agm-box-bg hover:bg-agm-box-border rounded-md border-0"
                  >
                    +{val >= 1000 ? `${val / 1000}k` : val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-agm-muted uppercase tracking-wider mb-1">
                Date *
              </label>
              <form.Field name="date">
                {(field) => (
                  <FormDatePicker field={field} placeholder="Select date" />
                )}
              </form.Field>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-agm-muted uppercase tracking-wider mb-1">
                Description / Memo
              </label>
              <form.Field name="description">
                {(field) => (
                  <FormInput
                    field={field}
                    placeholder={`e.g. ${selectedCategory?.defaultDesc || "Cost details"}`}
                    className="w-full py-2 text-xs"
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-bold text-agm-muted hover:text-agm-text transition cursor-pointer flex items-center gap-1"
          >
            <span>
              {showAdvanced ? "− Hide" : "+ Show"} Optional Reference &amp;
              Quantity
            </span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-agm-box-bg p-3 rounded-xl border border-agm-box-border mt-2">
              <div>
                <label className="block text-[10px] font-bold text-agm-muted uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <form.Field name="quantity">
                  {(field) => (
                    <FormInput
                      field={field}
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5"
                      className="w-full py-1.5 text-xs bg-agm-card"
                    />
                  )}
                </form.Field>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-agm-muted uppercase tracking-wider mb-1">
                  Unit Rate (AED)
                </label>
                <form.Field name="unitRate">
                  {(field) => (
                    <FormInput
                      field={field}
                      type="number"
                      step="0.01"
                      placeholder="e.g. 200"
                      className="w-full py-1.5 text-xs bg-agm-card font-mono"
                    />
                  )}
                </form.Field>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-agm-muted uppercase tracking-wider mb-1">
                  Reference / Invoice #
                </label>
                <form.Field name="reference">
                  {(field) => (
                    <FormInput
                      field={field}
                      placeholder="e.g. INV-101"
                      className="w-full py-1.5 text-xs bg-agm-card font-mono"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <FormSubmit
            form={form}
            variant="primary"
            loading={isLoading}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs px-6 py-2 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <PlusIcon size={13} /> Add to Report
          </FormSubmit>
        </div>
      </form>
    </div>
  );
}
