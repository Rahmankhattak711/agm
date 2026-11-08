"use client";

import React, { useCallback, useMemo, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PlusIcon } from "@/components/icons";
import { RotateCcw, RefreshCw, Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
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

export default function PurchaseReturnsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    <div className="w-full min-h-full flex flex-col font-sans">
      {/* Executive Header - Clean alignment, zero overlap */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5] shadow-2xs">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Purchase Returns (Debit Notes)
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  {returnsList.length} Records
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Log rejected vendor supplies, link active projects, process Accounts Payable debit notes, and deduct supplier balances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
              title="Refresh returns list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5046e5]" : ""}`} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              icon={<Plus size={14} strokeWidth={2.5} />}
              className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Log Purchase Return
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 bg-slate-50/40">

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
          isLoading={isLoading}
          onOpenCreate={handleOpenCreate}
          isFiltered={search.trim() !== "" || statusFilter !== "ALL"}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
        />
      </div>

      </div>

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
