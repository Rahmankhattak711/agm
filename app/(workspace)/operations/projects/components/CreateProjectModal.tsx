import React, { useState } from "react";
import {
  QuotationRecord,
  Customer,
  ProjectPriority,
} from "@/lib/hooks/api-hooks";
import { Button, Input, Select, Modal, DatePicker } from "@/components/ui";
import { fmt, dpToISO, isoToDP } from "../types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: QuotationRecord[];
  acceptedQuotations: QuotationRecord[];
  customers: Customer[];
  onSubmit: (data: {
    name: string;
    description?: string;
    location?: string;
    quotationId?: string;
    customerId?: string;
    budget: number;
    priority: ProjectPriority;
    startDate?: string;
    deadline?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  quotations,
  acceptedQuotations,
  customers,
  onSubmit,
  isLoading,
}: CreateProjectModalProps) {
  const [createMode, setCreateMode] = useState<"FROM_QUOTE" | "CUSTOM">(
    "FROM_QUOTE",
  );
  const [cQuoteId, setCQuoteId] = useState("");
  const [cName, setCName] = useState("");
  const [cCustomer, setCCustomer] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cBudget, setCBudget] = useState("");
  const [cPriority, setCPriority] = useState<ProjectPriority>("MEDIUM");
  const [cStart, setCStart] = useState(
    isoToDP(new Date().toISOString().split("T")[0]),
  );
  const [cDeadline, setCDeadline] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function fillFromQuote(quoteId: string) {
    setCQuoteId(quoteId);
    const q = quotations.find((x) => x.id === quoteId);
    if (!q) return;
    setCName(
      q.project
        ? `${q.project} (${q.quotationNo})`
        : `Project – ${q.quotationNo}`,
    );
    setCLocation(q.location || "");
    setCBudget(String(q.totalAmount || "0"));
    if (q.customerId) setCCustomer(q.customerId);
  }

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      const initialQuotes =
        acceptedQuotations.length > 0 ? acceptedQuotations : quotations;
      if (initialQuotes.length > 0) {
        setCreateMode("FROM_QUOTE");
        fillFromQuote(initialQuotes[0].id);
      } else {
        setCreateMode("CUSTOM");
        setCName("");
        setCLocation("");
        setCBudget("");
        setCCustomer(customers[0]?.id || "");
      }
      setCDesc("");
      setCPriority("MEDIUM");
      setCStart(isoToDP(new Date().toISOString().split("T")[0]));
      setCDeadline("");
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (!cName.trim()) throw new Error("Project name is required");
      await onSubmit({
        name: cName.trim(),
        description: cDesc.trim() || undefined,
        location: cLocation.trim() || undefined,
        quotationId: createMode === "FROM_QUOTE" ? cQuoteId : undefined,
        customerId: cCustomer || undefined,
        budget: cBudget ? Number(cBudget) : 0,
        priority: cPriority,
        startDate: dpToISO(cStart) || undefined,
        deadline: dpToISO(cDeadline) || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create project");
    }
  }

  const quoteList =
    acceptedQuotations.length > 0 ? acceptedQuotations : quotations;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      maxWidth="2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
        {(["FROM_QUOTE", "CUSTOM"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setCreateMode(m)}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              createMode === m
                ? "bg-white text-emerald-800 shadow"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {m === "FROM_QUOTE" ? "From Accepted Quotation" : "Custom Project"}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {createMode === "FROM_QUOTE" && (
          <div>
            <label className="form-label">Select Quotation *</label>
            <Select
              value={cQuoteId}
              onChange={(e) => fillFromQuote(e.target.value)}
              className="w-full py-1.5"
              options={quoteList.map((q) => ({
                value: q.id,
                label: `${q.quotationNo} – ${q.customer || "Client"} (AED ${fmt(q.totalAmount)})`,
              }))}
            />
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Project Name *</label>
            <Input
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="e.g. Villa 42 Interior Fitout"
              className="w-full py-1.5"
            />
          </div>
          <div>
            <label className="form-label">Customer</label>
            <Select
              value={cCustomer}
              onChange={(e) => setCCustomer(e.target.value)}
              className="w-full py-1.5"
              options={[
                { value: "", label: "Select customer…" },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Site Location</label>
            <Input
              value={cLocation}
              onChange={(e) => setCLocation(e.target.value)}
              placeholder="e.g. Business Bay, Dubai"
              className="w-full py-1.5"
            />
          </div>
          <div>
            <label className="form-label">Priority</label>
            <Select
              value={cPriority}
              onChange={(e) => setCPriority(e.target.value as ProjectPriority)}
              className="w-full py-1.5"
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "URGENT", label: "Urgent" },
              ]}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Budget (AED) *</label>
          <Input
            type="number"
            step="0.01"
            value={cBudget}
            onChange={(e) => setCBudget(e.target.value)}
            placeholder="0.00"
            className="w-full py-1.5 font-mono"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Start Date</label>
            <DatePicker
              value={cStart}
              onChange={setCStart}
              placeholder="Select start date"
            />
          </div>
          <div>
            <label className="form-label">Deadline</label>
            <DatePicker
              value={cDeadline}
              onChange={setCDeadline}
              placeholder="Select deadline"
            />
          </div>
        </div>
        <div>
          <label className="form-label">Notes & Scope</label>
          <textarea
            value={cDesc}
            onChange={(e) => setCDesc(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            placeholder="Key deliverables, materials, subcontractors…"
          />
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
