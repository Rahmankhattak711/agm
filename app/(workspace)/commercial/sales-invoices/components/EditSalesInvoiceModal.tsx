"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  FileTextIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import { useAccounts } from "@/lib/hooks/finance-hooks";
import { formatNumber } from "./types";
import { round2 } from "@/lib/utils/math";

export interface EditSalesInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoice | null;
  onSaveInvoice: (id: string, updatedData: any) => Promise<void>;
}

interface EditableInvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export const EditSalesInvoiceModal: React.FC<EditSalesInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSaveInvoice,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerTrn, setCustomerTrn] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [discountAccountId, setDiscountAccountId] = useState<string>("");

  const { data: allAccounts = [] } = useAccounts();
  const discountAccounts = useMemo(() => {
    return (allAccounts || []).filter(
      (acc: any) =>
        acc.isActive !== false &&
        (acc.type === "REVENUE" || acc.type === "EXPENSE") &&
        (acc.accountName?.toLowerCase().includes("discount") ||
         acc.accountName?.toLowerCase().includes("allowance") ||
         acc.accountCode === "4112" ||
         acc.accountCode === "54" ||
         acc.accountCode === "5215")
    );
  }, [allAccounts]);
  const [vatRate, setVatRate] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableInvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invoice) {
      setCustomerName(invoice.customerName || "");
      setCustomerTrn(invoice.customerTrn || "");
      setProjectScope(invoice.projectScope || "");
      setInvoiceDate(
        invoice.invoiceDate
          ? new Date(invoice.invoiceDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      );
      setDueDate(
        invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().slice(0, 10)
          : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
      );
      setDiscount(Number(invoice.discount || 0));
      setDiscountAccountId(invoice.discountAccountId || "");
      const hasVat =
        Number(invoice.vatAmount || 0) > 0 ||
        (invoice.vatRate !== null &&
          invoice.vatRate !== undefined &&
          Number(invoice.vatRate) > 0);
      setVatRate(
        invoice.vatRate !== null && invoice.vatRate !== undefined
          ? Number(invoice.vatRate)
          : hasVat
            ? 5
            : 0,
      );
      setNotes(invoice.notes || "");

      if (invoice.items && invoice.items.length > 0) {
        setItems(
          invoice.items.map((it) => ({
            id: it.id,
            description: it.description || "",
            quantity: Number(it.quantity || 1),
            unit: it.unit || "SQM",
            unitPrice: Number(it.unitPrice || 0),
          })),
        );
      } else {
        setItems([
          {
            description: "Fitout scope item / contract work",
            quantity: 1,
            unit: "SQM",
            unitPrice: Number(invoice.subtotal || invoice.totalAmount || 0),
          },
        ]);
      }
      setError("");
    }
  }, [invoice, isOpen]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity || 0);
      const r = Number(item.unitPrice || 0);
      return sum + q * r;
    }, 0);
  }, [items]);

  const netSubtotal = useMemo(() => {
    return Math.max(0, itemsSubtotal - Number(discount || 0));
  }, [itemsSubtotal, discount]);

  const calculatedVat = useMemo(() => {
    if (vatRate <= 0) return 0;
    return round2((netSubtotal * vatRate) / 100);
  }, [netSubtotal, vatRate]);

  const totalDue = useMemo(() => {
    return round2(netSubtotal + calculatedVat);
  }, [netSubtotal, calculatedVat]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit: "SQM",
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof EditableInvoiceItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSaveInvoice(invoice.id, {
        customerName: customerName.trim(),
        customerTrn: customerTrn.trim() || null,
        projectScope: projectScope.trim(),
        invoiceDate,
        dueDate,
        discount: Number(discount || 0),
        discountAccountId: Number(discount || 0) > 0 ? (discountAccountId || null) : null,
        vatRate: Number(vatRate || 0),
        vatAmount: calculatedVat,
        totalAmount: totalDue,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          productId: null,
          description: it.description || "Scope item",
          quantity: Number(it.quantity || 1),
          unit: it.unit || "SQM",
          unitPrice: Number(it.unitPrice || 0),
          discount: 0,
          totalAmount: Number(it.quantity || 1) * Number(it.unitPrice || 0),
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save invoice changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Sales Invoice — ${invoice.invoiceNumber}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer / Client Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahman khattak"
              className="text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer TRN (Tax Registration Number)
            </label>
            <Input
              value={customerTrn}
              onChange={(e) => setCustomerTrn(e.target.value)}
              placeholder="15-digit TRN (e.g. 100234567800003)"
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Scope / Subject
            </label>
            <Input
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="e.g. Commercial Fitout Contract"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Date
            </label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-xs"
              required
            />
          </div>
        </div>

        <div className="space-y-2 border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/40">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileTextIcon size={14} className="text-emerald-700" />
              Scope of Work &amp; Line Items ({items.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              icon={<PlusIcon size={12} />}
              className="text-xs font-bold border-emerald-600 text-emerald-800 hover:bg-emerald-50"
            >
              Add Item Line
            </Button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineTotal =
                (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Description #{idx + 1}
                    </label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(idx, "description", e.target.value)
                      }
                      placeholder="Scope item description"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Unit
                    </label>
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        handleUpdateItem(idx, "unit", e.target.value)
                      }
                      placeholder="SQM, PCS, LOT"
                      className="text-xs text-center"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 text-right">
                      Qty
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(
                          idx,
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="text-xs text-right font-mono"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 text-right">
                      Unit Rate (AED)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleUpdateItem(
                          idx,
                          "unitPrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="text-xs text-right font-mono"
                      required
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-1 flex items-center justify-end sm:justify-center pt-2 sm:pt-4">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Remove line"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Discount (AED)
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                VAT Configuration
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-bold rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="0">
                  0% VAT (Zero-Rated / Exempt / Without VAT)
                </option>
                <option value="5">5% UAE Standard Output VAT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes or remarks..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 font-mono text-xs space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">
              Calculation Breakdown
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span>AED {formatNumber(itemsSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>- AED {formatNumber(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>Subtotal (Excl. VAT):</span>
              <span>AED {formatNumber(netSubtotal)}</span>
            </div>
            {vatRate > 0 ? (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>{vatRate}% UAE Output VAT:</span>
                <span>AED {formatNumber(calculatedVat)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-400 italic">
                <span>Output VAT:</span>
                <span>0.00 AED (No VAT)</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-2">
              <span>Invoice Total Due:</span>
              <span className="text-emerald-950 font-mono">
                AED {formatNumber(totalDue)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            icon={<SaveIcon size={14} />}
            className="text-white font-semibold text-xs shadow-2xs"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            {isSubmitting ? "Saving..." : "Save Invoice Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSalesInvoiceModal;
