"use client";

import React, { useCallback, useMemo, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useSuppliers } from "@/lib/hooks/api-hooks";
import {
  PurchaseReturnItem,
  ReturnFormState,
  INITIAL_PURCHASE_RETURNS,
  EMPTY_FORM,
  generateReturnNumber,
} from "./components/types";
import PurchaseReturnDocument from "./components/PurchaseReturnDocument";
import PurchaseReturnsKpis from "./components/PurchaseReturnsKpis";
import PurchaseReturnsFilters from "./components/PurchaseReturnsFilters";
import PurchaseReturnsTable from "./components/PurchaseReturnsTable";
import LogReturnModal from "./components/LogReturnModal";

export default function PurchaseReturnsPage() {
  const { data: suppliers = [] } = useSuppliers();

  const [returnsList, setReturnsList] = useState<PurchaseReturnItem[]>(
    INITIAL_PURCHASE_RETURNS,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
  const [returnToPrint, setReturnToPrint] = useState<PurchaseReturnItem | null>(
    null,
  );
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: returnToPrint?.returnNumber
      ? `Debit-Note-${returnToPrint.returnNumber}`
      : "Purchase-Debit-Note",
  });

  const handlePrintReturn = (item: PurchaseReturnItem) => {
    setReturnToPrint(item);
    setTimeout(() => {
      triggerPrint();
    }, 80);
  };

  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const currentReturnNumber = useMemo(
    () => generateReturnNumber(returnsList.length),
    [returnsList.length],
  );

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnsList.filter((item) => {
      const matchesSearch =
        item.returnNumber.toLowerCase().includes(q) ||
        item.poReference.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returnsList, search, statusFilter]);

  const totalReturnVal = useMemo(
    () => filteredReturns.reduce((s, r) => s + r.totalAmount, 0),
    [filteredReturns],
  );

  const completedCount = useMemo(
    () => returnsList.filter((r) => r.status === "COMPLETED").length,
    [returnsList],
  );

  const activeReviewCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "SUBMITTED" || r.status === "APPROVED",
      ).length,
    [returnsList],
  );

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsCreateOpen(true);
  }, [resetForm]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    resetForm();
  }, [resetForm]);

  const setField = useCallback(
    <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleCreateReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.poReference || !form.selectedSupplier || !form.returnAmount) {
        return;
      }

      const supplierObj = suppliers.find((s) => s.id === form.selectedSupplier);
      const supplierName = supplierObj ? supplierObj.name : "Vendor";
      const supplierTrn = supplierObj?.trn || "";

      const newReturn: PurchaseReturnItem = {
        id: `pr-${Date.now()}`,
        returnNumber: currentReturnNumber,
        poReference: form.poReference,
        supplierName,
        supplierTrn,
        returnDate: new Date().toISOString().slice(0, 10),
        reason: form.returnReason || "Material defect / Debit Note",
        itemsCount: 1,
        totalAmount: parseFloat(form.returnAmount) || 0,
        status: "SUBMITTED",
      };

      setReturnsList((prev) => [newReturn, ...prev]);
      handleCloseCreate();
    },
    [form, suppliers, currentReturnNumber, handleCloseCreate],
  );

  const handleToggleExpand = useCallback(
    (id: string) => setExpandedReturnId((prev) => (prev === id ? null : id)),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Returns (Debit Notes)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log rejected vendor supplies, process Accounts Payable debit notes,
            and deduct supplier balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Log Purchase Return
          </Button>
        </div>
      </div>

      <PurchaseReturnsKpis
        totalReturnVal={totalReturnVal}
        returnsCount={returnsList.length}
        completedCount={completedCount}
        activeReviewCount={activeReviewCount}
      />

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <PurchaseReturnsFilters
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          search={search}
          onSearch={setSearch}
          count={filteredReturns.length}
        />

        <PurchaseReturnsTable
          filteredReturns={filteredReturns}
          expandedReturnId={expandedReturnId}
          onToggleExpand={handleToggleExpand}
          onPrintReturn={handlePrintReturn}
        />
      </div>

      <LogReturnModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreateReturn}
        form={form}
        setField={setField}
        suppliers={suppliers}
      />

      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {returnToPrint && <PurchaseReturnDocument item={returnToPrint} />}
        </div>
      </div>
    </div>
  );
}
