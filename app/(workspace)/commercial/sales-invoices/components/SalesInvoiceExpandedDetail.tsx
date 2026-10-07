"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  EditIcon,
  CheckIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { SalesInvoice, useUpdateSalesInvoice } from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { formatNumber, parseDescriptionPoints } from "./types";

export interface SalesInvoiceExpandedDetailProps {
  inv: SalesInvoice;
  onPrint?: (inv: SalesInvoice) => void;
  onPost?: (invId: string) => void;
  onOpenPayment?: (inv: SalesInvoice) => void;
  onEdit?: (inv: SalesInvoice) => void;
  onDelete?: (inv: SalesInvoice) => void;
  onClose?: () => void;
}

interface PaymentMilestoneItem {
  id: string;
  label: string;
  pct: number;
  amount: number;
}

export const SalesInvoiceExpandedDetail: React.FC<
  SalesInvoiceExpandedDetailProps
> = ({ inv, onEdit, onDelete }) => {
  const updateInvoiceMutation = useUpdateSalesInvoice();

  const itemsSum = useMemo(() => {
    if (inv.items && inv.items.length > 0) {
      return inv.items.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0,
      );
    }
    return Number(inv.subtotal || 0);
  }, [inv.items, inv.subtotal]);

  const discount = Number(inv.discount || 0);
  const calculatedSubtotal = Math.max(0, itemsSum - discount);
  const dbVatRate =
    inv.vatRate !== undefined && inv.vatRate !== null ? Number(inv.vatRate) : 0;
  const dbVatAmount = Number(inv.vatAmount || 0);
  const dbTotalAmount = Number(inv.totalAmount || 0);

  const calculatedVat =
    dbVatAmount > 0
      ? dbVatAmount
      : dbVatRate > 0 && dbTotalAmount > calculatedSubtotal
        ? Math.round(((calculatedSubtotal * dbVatRate) / 100) * 100) / 100
        : 0;
  const calculatedTotal =
    dbTotalAmount > 0
      ? dbTotalAmount
      : Math.round((calculatedSubtotal + calculatedVat) * 100) / 100;

  const projectTotalAmount = calculatedTotal;
  const totalAmount = calculatedTotal;

  const initialParsedData = useMemo(() => {
    let termsList: string[] = [];
    let paymentList: string[] = [];

    if (inv.terms) {
      try {
        const parsed = JSON.parse(inv.terms);
        if (Array.isArray(parsed)) {
          termsList = parsed.map((t: any) =>
            typeof t === "string" ? t : t.text || t.title || "",
          );
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.terms)) {
            termsList = parsed.terms.map((t: any) =>
              typeof t === "string"
                ? t
                : `${t.title ? t.title + ": " : ""}${t.text || ""}`,
            );
          }
          if (Array.isArray(parsed.paymentPlans)) {
            paymentList = parsed.paymentPlans;
          } else if (Array.isArray(parsed.paymentTerms)) {
            paymentList = parsed.paymentTerms;
          }
        }
      } catch {
        if (inv.terms !== "{}" && inv.terms.trim().length > 0) {
          termsList = [inv.terms];
        }
      }
    }

    if (paymentList.length === 0) {
      paymentList = [
        "40% Advance",
        "20% Floor work done at ground floor",
        "20% Glass work at site",
        "15% Wood work at site",
        "5% Upon handing over",
      ];
    }

    return { termsList, paymentList };
  }, [inv.terms]);

  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [milestones, setMilestones] = useState<PaymentMilestoneItem[]>(() => {
    return initialParsedData.paymentList.map((plan, idx) => {
      const match = plan.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = match
        ? parseFloat(match[1])
        : Math.round(100 / (initialParsedData.paymentList.length || 1));
      const cleanLabel =
        plan
          .replace(/^\d+(?:\.\d+)?\s*%\s*/, "")
          .replace(/^[-•*]\s*/, "")
          .trim() || `Milestone ${idx + 1}`;
      const amount = Math.round(((projectTotalAmount * pct) / 100) * 100) / 100;
      return {
        id: `ms-${idx}-${Date.now()}`,
        label: cleanLabel,
        pct,
        amount,
      };
    });
  });

  const [termsList, setTermsList] = useState<string[]>(
    initialParsedData.termsList,
  );

  useEffect(() => {
    if (!isEditingTerms) {
      setMilestones(
        initialParsedData.paymentList.map((plan, idx) => {
          const match = plan.match(/(\d+(?:\.\d+)?)\s*%/);
          const pct = match
            ? parseFloat(match[1])
            : Math.round(100 / (initialParsedData.paymentList.length || 1));
          const cleanLabel =
            plan
              .replace(/^\d+(?:\.\d+)?\s*%\s*/, "")
              .replace(/^[-•*]\s*/, "")
              .trim() || `Milestone ${idx + 1}`;
          const amount =
            Math.round(((projectTotalAmount * pct) / 100) * 100) / 100;
          return {
            id: `ms-${idx}-${Date.now()}`,
            label: cleanLabel,
            pct,
            amount,
          };
        }),
      );
      setTermsList(initialParsedData.termsList);
    }
  }, [
    inv.id,
    inv.terms,
    projectTotalAmount,
    isEditingTerms,
    initialParsedData,
  ]);

  const handleUpdateMilestonePct = (idx: number, newPct: number) => {
    setMilestones((prev) => {
      return prev.map((item, i) => {
        if (i !== idx) return item;
        const validPct = Math.max(0, newPct);
        const newAmount =
          Math.round(((projectTotalAmount * validPct) / 100) * 100) / 100;
        return { ...item, pct: validPct, amount: newAmount };
      });
    });
  };

  const handleUpdateMilestoneAmount = (idx: number, newAmount: number) => {
    setMilestones((prev) => {
      const validAmount = Math.max(0, newAmount);
      return prev.map((item, i) => {
        if (i !== idx) return item;
        const calculatedPct =
          projectTotalAmount > 0
            ? Math.round((validAmount / projectTotalAmount) * 100 * 10) / 10
            : 0;
        return { ...item, amount: validAmount, pct: calculatedPct };
      });
    });
  };

  const handleUpdateMilestoneLabel = (idx: number, newLabel: string) => {
    setMilestones((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label: newLabel } : item)),
    );
  };

  const handleAddMilestone = () => {
    const totalCurrentPct = milestones.reduce((s, m) => s + m.pct, 0);
    const remainingPct = Math.max(0, 100 - totalCurrentPct);
    const nextNum = milestones.length + 1;
    const defaultPct = remainingPct > 0 ? remainingPct : 10;
    const amount =
      Math.round(((projectTotalAmount * defaultPct) / 100) * 100) / 100;

    setMilestones((prev) => [
      ...prev,
      {
        id: `ms-${Date.now()}`,
        label: `Milestone ${nextNum}`,
        pct: defaultPct,
        amount,
      },
    ]);
  };

  const handleRemoveMilestone = (idx: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTerms = async () => {
    try {
      const formattedPaymentPlans = milestones.map(
        (m) => `${m.pct}% ${m.label}`,
      );

      const payload = {
        terms: JSON.stringify({
          terms: termsList.length > 0 ? termsList : undefined,
          paymentPlans: formattedPaymentPlans,
          paymentTerms: formattedPaymentPlans,
        }),
      };

      await updateInvoiceMutation.mutateAsync({
        id: inv.id,
        data: payload,
      });

      setIsEditingTerms(false);
      toast.success("Payment terms & milestones updated successfully!");
    } catch (err: any) {
      toast.error(
        "Error updating payment terms: " + (err.message || "Unknown error"),
      );
    }
  };

  const totalMilestonePct = useMemo(
    () => milestones.reduce((s, m) => s + m.pct, 0),
    [milestones],
  );

  const totalMilestoneAmount = useMemo(
    () => milestones.reduce((s, m) => s + m.amount, 0),
    [milestones],
  );

  const displayTotalAmount = calculatedTotal;
  const displaySubtotal = calculatedSubtotal;
  const displayVatAmount = calculatedVat;
  const displayRemainingBalance = Math.max(
    0,
    calculatedTotal - Number(inv.paidAmount || 0),
  );

  return (
    <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 space-y-3 bg-slate-50/60 min-w-0 max-w-full">
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileTextIcon size={15} className="w-[15px] h-[15px]" />
            <span>Description of Work / Services (Scope Breakdown)</span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(inv)}
                className="bg-white/10 hover:bg-white/20 text-white rounded px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Edit invoice"
              >
                <EditIcon size={13} className="w-[13px] h-[13px]" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(inv)}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white rounded px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Delete invoice"
              >
                <TrashIcon size={13} className="w-[13px] h-[13px]" />
                <span>Delete</span>
              </button>
            )}
            <span className="text-[11px] font-normal opacity-90 font-mono">
              {inv.items?.length || 0} Scope Item(s)
            </span>
          </div>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 text-[10.5px]">
              <th className="py-1.5 px-2 text-left w-8">#</th>
              <th className="py-1.5 px-2.5 text-left">
                Description / Milestone
              </th>
              <th className="py-1.5 px-2 text-center w-14">Unit</th>
              <th className="py-1.5 px-2 text-right w-14">Qty</th>
              <th className="py-1.5 px-2 text-right w-20">Unit Rate</th>
              <th className="py-1.5 px-2.5 text-right w-24">Total (AED)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inv.items?.map((item, idx) => {
              const parsed = parseDescriptionPoints(item.description);
              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-2 px-2 font-mono text-slate-400 align-top text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 text-slate-800 align-top">
                    <div className="font-semibold text-slate-900 text-xs">
                      {parsed[0] || item.description}
                    </div>
                    {parsed.length > 1 && (
                      <ul className="mt-1 space-y-0.5 text-[10.5px] text-slate-600 list-disc list-inside">
                        {parsed.slice(1).map((p: string, pIdx: number) => (
                          <li key={pIdx} className="leading-snug">
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600 align-top font-mono text-[10.5px]">
                    {item.unit || "SQM"}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-medium text-slate-800 align-top text-xs">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-700 align-top text-xs">
                    {formatNumber(item.unitPrice)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 align-top text-xs">
                    {formatNumber(item.totalAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1 min-w-0">
        <div className="lg:col-span-7 xl:col-span-8 text-xs text-slate-600 space-y-2.5 min-w-0">
          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="text-slate-500 font-semibold">Invoice Date:</span>
            <span className="font-medium text-slate-800">
              {inv.invoiceDate
                ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
                : "—"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-semibold">Due Date:</span>
            <span className="font-medium text-slate-800">
              {inv.dueDate
                ? new Date(inv.dueDate).toLocaleDateString("en-GB")
                : "—"}
            </span>
            {inv.quotationRef && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-semibold">
                  Quotation Ref:
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {inv.quotationRef}
                </span>
              </>
            )}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-agm-green animate-pulse"></span>
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Payment Terms &amp; Milestone Schedule
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isEditingTerms ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddMilestone}
                      icon={<PlusIcon size={13} className="w-3.5 h-3.5" />}
                      className="text-[10.5px] font-bold text-teal-800 hover:bg-teal-50 border-teal-200 h-7 px-2 cursor-pointer"
                    >
                      Add Milestone
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveTerms}
                      disabled={updateInvoiceMutation.isPending}
                      icon={<SaveIcon size={13} className="w-3.5 h-3.5" />}
                      className="text-[10.5px] font-bold bg-agm-green hover:bg-agm-green-2 text-white h-7 px-2.5 cursor-pointer shadow-2xs"
                    >
                      {updateInvoiceMutation.isPending
                        ? "Saving..."
                        : "Save Terms"}
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTerms(true)}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <EditIcon size={13} className="w-[13px] h-[13px]" /> Edit
                    Schedule
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg border text-[11.5px] transition-all ${
                    isEditingTerms
                      ? "bg-slate-50 border-slate-300"
                      : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 shrink-0 text-slate-400 font-bold text-[10.5px] font-mono">
                      #{idx + 1}
                    </span>

                    {isEditingTerms ? (
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) =>
                          handleUpdateMilestoneLabel(idx, e.target.value)
                        }
                        className="flex-1 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 outline-none focus:border-agm-green"
                        placeholder="Milestone description..."
                      />
                    ) : (
                      <span className="font-semibold text-slate-800 truncate">
                        {m.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      {isEditingTerms ? (
                        <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 focus-within:border-agm-green">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={m.pct}
                            onChange={(e) =>
                              handleUpdateMilestonePct(
                                idx,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-12 text-right font-mono font-bold text-xs text-slate-900 outline-none"
                          />
                          <span className="text-[11px] font-bold text-slate-500 ml-0.5">
                            %
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-mono font-bold text-[11px]">
                          {m.pct}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs">
                      {isEditingTerms ? (
                        <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 focus-within:border-agm-green">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={m.amount}
                            onChange={(e) =>
                              handleUpdateMilestoneAmount(
                                idx,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20 text-right font-mono font-bold text-xs text-slate-900 outline-none"
                          />
                          <span className="text-[10px] text-slate-500 font-bold ml-1">
                            AED
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900">
                          {formatNumber(m.amount)} AED
                        </span>
                      )}
                    </div>

                    {isEditingTerms && milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Remove milestone"
                      >
                        <TrashIcon size={14} className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-700 font-mono">
              <span className="flex items-center gap-1">
                Allocated Milestone Percentage:
                <span
                  className={
                    Math.abs(totalMilestonePct - 100) < 0.1
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {totalMilestonePct}%
                </span>
              </span>
              <span className="text-slate-900">
                Total Allocated: {formatNumber(totalMilestoneAmount)} AED
              </span>
            </div>
          </div>

          {inv.notes && (
            <div className="text-slate-700 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong className="text-slate-800 font-bold">Notes:</strong>{" "}
              {inv.notes}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-2.5 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Project Total Value
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatNumber(projectTotalAmount)}{" "}
                  <span className="text-[10px] text-slate-400">AED</span>
                </span>
              </div>
              <div className="border-t border-slate-100/80 my-0.5"></div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Invoice Subtotal (Excl. VAT)</span>
                <span className="font-mono font-medium text-slate-700">
                  {formatNumber(displaySubtotal)}{" "}
                  <span className="text-[10px] text-slate-400">AED</span>
                </span>
              </div>
              {displayVatAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    {dbVatRate > 0
                      ? dbVatRate
                      : displaySubtotal > 0
                        ? Math.round((displayVatAmount / displaySubtotal) * 100)
                        : 5}
                    % UAE Output VAT
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {formatNumber(displayVatAmount)}{" "}
                    <span className="text-[10px] text-slate-400">AED</span>
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 p-3 border-t border-slate-100/80 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-800">
                  Invoice Total
                </span>
                <div className="text-right">
                  <span
                    className={`font-mono text-lg font-black tracking-tight ${isEditingTerms ? "text-teal-700" : "text-slate-900"}`}
                  >
                    {formatNumber(displayTotalAmount)}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500 ml-1">
                    AED
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden relative">
            <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${displayTotalAmount > 0 ? Math.min(100, Math.max(0, (Number(inv.paidAmount || 0) / displayTotalAmount) * 100)) : 0}%`,
                }}
              />
            </div>
            <div className="p-3.5 pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11.5px] font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Paid / Settled
                </span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {formatNumber(inv.paidAmount)}{" "}
                  <span className="text-[9.5px]">AED</span>
                </span>
              </div>

              <div className="flex justify-between items-end pt-2.5 border-t border-slate-100 border-dashed">
                <span className="text-xs font-bold text-slate-600">
                  Balance Due
                </span>
                <div className="text-right">
                  <span
                    className={`font-mono text-base font-black tracking-tight ${displayRemainingBalance > 0 ? "text-rose-600" : "text-slate-700"}`}
                  >
                    {formatNumber(displayRemainingBalance)}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold ml-1 ${displayRemainingBalance > 0 ? "text-rose-400" : "text-slate-400"}`}
                  >
                    AED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceExpandedDetail;
