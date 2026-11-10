"use client";

import React, { useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { PlusIcon } from "@/components/icons";
import { RotateCcw, RefreshCw, Plus, ChevronLeft } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";
import { useSuppliers } from "@/lib/hooks/api-hooks";
import { useProjects } from "@/lib/hooks/projects-hooks";
import {
  useDebitNotes,
  useCreateDebitNote,
  useSupplierBills,
  DebitNote,
} from "@/lib/hooks/inventory-hooks";
import {
  PurchaseReturnItem,
  ReturnFormState,
  EMPTY_FORM,
  generateReturnNumber,
} from "./components/types";
import PurchaseReturnDocument from "./components/PurchaseReturnDocument";
import PurchaseReturnsKpis from "./components/PurchaseReturnsKpis";
import PurchaseReturnsFilters from "./components/PurchaseReturnsFilters";
import PurchaseReturnsTable from "./components/PurchaseReturnsTable";
import LogReturnModal from "./components/LogReturnModal";
import PurchaseReturnDetailModal from "./components/PurchaseReturnDetailModal";

export default function PurchaseReturnsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturnItem | null>(null);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
  const [returnToPrint, setReturnToPrint] = useState<PurchaseReturnItem | null>(
    null,
  );
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const { data: debitNotes = [], isLoading, isFetching, refetch } = useDebitNotes(search);
  const { data: suppliers = [] } = useSuppliers();
  const { data: projects = [] } = useProjects();
  const { data: supplierBills = [] } = useSupplierBills();
  const createMutation = useCreateDebitNote();

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

  const currentReturnNumber = useMemo(
    () => generateReturnNumber(debitNotes.length),
    [debitNotes.length],
  );

  const returnsList: PurchaseReturnItem[] = useMemo(() => {
    return debitNotes.map((dn: DebitNote) => {
      const linkedBill =
        dn.supplierBill ||
        supplierBills.find((b) => b.id === dn.supplierBillId);
      const supplierObj =
        dn.supplier || suppliers.find((s) => s.id === dn.supplierId);

      let matchedProject = projects.find((p) => {
        if (dn.reason && dn.reason.includes(`[${p.projectCode}`)) return true;
        if (dn.reason && dn.reason.includes(p.name)) return true;
        return false;
      });

      let rawReason = dn.reason || "Material return / debit note";
      let cleanReason = rawReason;
      if (rawReason.startsWith("[") && rawReason.includes("] ")) {
        const parts = rawReason.split("] ");
        const tag = parts[0].slice(1);
        cleanReason = parts.slice(1).join("] ");
        if (!matchedProject) {
          matchedProject = projects.find(
            (p) => p.projectCode === tag || tag.startsWith(p.projectCode),
          );
        }
      }

      const total = Number(dn.totalAmount || 0);
      const sub = Number(dn.subtotal || total / 1.05);
      const vat = Number(dn.vatAmount || total - sub);

      const poRef =
        linkedBill?.billNumber || dn.purchaseOrderId || "Direct Debit";

      return {
        id: dn.id,
        returnNumber: dn.debitNoteNumber,
        poReference: poRef,
        supplierId: dn.supplierId,
        supplierName: dn.supplierName || supplierObj?.name || "Vendor",
        supplierTrn: supplierObj?.trn || "",
        projectId: matchedProject?.id || null,
        projectCode: matchedProject?.projectCode || undefined,
        projectName: matchedProject?.name || undefined,
        clientName:
          matchedProject?.customer?.companyName ||
          matchedProject?.customer?.name ||
          undefined,
        returnDate: dn.returnDate,
        reason: cleanReason,
        itemsCount: dn.items && dn.items.length > 0 ? dn.items.length : 1,
        subtotal: sub,
        vatAmount: vat,
        totalAmount: total,
        status: (dn.status as any) || "POSTED",
        items: dn.items || [],
        supplier: supplierObj,
        supplierBill: linkedBill,
      };
    });
  }, [debitNotes, supplierBills, suppliers, projects]);

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnsList.filter((item) => {
      const matchesSearch =
        item.returnNumber.toLowerCase().includes(q) ||
        item.poReference.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        (item.projectName && item.projectName.toLowerCase().includes(q)) ||
        (item.projectCode && item.projectCode.toLowerCase().includes(q)) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
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
    () =>
      returnsList.filter(
        (r) => r.status === "POSTED" || r.status === "COMPLETED",
      ).length,
    [returnsList],
  );

  const activeReviewCount = useMemo(
    () =>
      returnsList.filter(
        (r) =>
          r.status === "SUBMITTED" ||
          r.status === "APPROVED" ||
          r.status === "DRAFT",
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
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.selectedSupplier || !form.returnAmount) {
        return;
      }

      const supplierObj = suppliers.find((s) => s.id === form.selectedSupplier);
      const supplierName = supplierObj ? supplierObj.name : "Vendor";

      const selectedProj = projects.find((p) => p.id === form.selectedProject);
      const projectTag = selectedProj
        ? `[${selectedProj.projectCode}: ${selectedProj.name}] `
        : "";

      const returnReasonFormatted = `${projectTag}${form.returnReason || "Material defect / Debit Note"}`;

      const totalAmt = parseFloat(form.returnAmount) || 0;
      const subtotalAmt = totalAmt / 1.05;
      const vatAmt = totalAmt - subtotalAmt;

      await createMutation.mutateAsync({
        debitNoteNumber: currentReturnNumber,
        supplierId: form.selectedSupplier,
        supplierName,
        supplierBillId: form.supplierBillId || null,
        purchaseOrderId: form.purchaseOrderId || null,
        returnDate: form.returnDate,
        reason: returnReasonFormatted,
        subtotal: subtotalAmt,
        vatAmount: vatAmt,
        totalAmount: totalAmt,
        autoPost: true,
        items: [
          {
            description:
              form.returnReason || `Debit Note adjustment for ${supplierName}`,
            quantity: 1,
            unitPrice: subtotalAmt,
            unitCost: subtotalAmt,
            totalAmount: subtotalAmt,
          },
        ],
      });

      handleCloseCreate();
    },
    [
      form,
      suppliers,
      projects,
      currentReturnNumber,
      createMutation,
      handleCloseCreate,
    ],
  );

  const handleToggleExpand = useCallback(
    (id: string) => setExpandedReturnId((prev) => (prev === id ? null : id)),
    [],
  );

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* Executive Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/inventory/purchase-orders")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Purchase Orders"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Purchase Returns (Debit Notes)
            </h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {returnsList.length} records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
            style={{ borderColor: "#cbd5e1" }}
            title="Refresh returns list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#1d4ed8]" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg text-white hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Purchase Return</span>
          </button>
        </div>
      </div>

      {/* Procurement Cycle Horizontal Quick Navigation */}
      <ProcurementQuickNav />

      <PurchaseReturnsKpis
        totalReturnVal={totalReturnVal}
        returnsCount={returnsList.length}
        completedCount={completedCount}
        activeReviewCount={activeReviewCount}
      />

      {/* 3. Soft Filter Bar with Status Tabs */}
      <PurchaseReturnsFilters
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        search={search}
        onSearch={setSearch}
        count={filteredReturns.length}
      />

      {/* 4. Table Card with Responsive Pagination */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <PurchaseReturnsTable
          filteredReturns={filteredReturns}
          expandedReturnId={expandedReturnId}
          onToggleExpand={handleToggleExpand}
          onPrintReturn={handlePrintReturn}
          onViewReturn={(item) => setSelectedReturn(item)}
          isLoading={isLoading}
          onOpenCreate={handleOpenCreate}
          isFiltered={search.trim() !== "" || statusFilter !== "ALL"}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
        />
      </div>

      <PurchaseReturnDetailModal
        item={selectedReturn}
        onClose={() => setSelectedReturn(null)}
        onPrint={handlePrintReturn}
      />

      <LogReturnModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreateReturn}
        form={form}
        setField={setField}
        suppliers={suppliers}
        projects={projects}
        supplierBills={supplierBills}
        isSubmitting={createMutation.isPending}
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
