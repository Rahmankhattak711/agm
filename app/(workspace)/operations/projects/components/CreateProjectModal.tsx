"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import {
  QuotationRecord,
  Customer,
  ProjectPriority,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Modal,
  Select,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
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
  const [errorMsg, setErrorMsg] = useState("");

  const quoteList =
    acceptedQuotations.length > 0 ? acceptedQuotations : quotations;

  const form = useForm({
    defaultValues: {
      quotationId: "",
      name: "",
      customerId: "",
      location: "",
      description: "",
      budget: "",
      priority: "MEDIUM" as ProjectPriority,
      startDate: isoToDP(new Date().toISOString().split("T")[0]),
      deadline: "",
    },
    onSubmit: async ({ value }) => {
      setErrorMsg("");
      try {
        if (!value.name.trim()) throw new Error("Project name is required");
        await onSubmit({
          name: value.name.trim(),
          description: value.description.trim() || undefined,
          location: value.location.trim() || undefined,
          quotationId:
            createMode === "FROM_QUOTE" ? value.quotationId : undefined,
          customerId: value.customerId || undefined,
          budget: value.budget ? Number(value.budget) : 0,
          priority: value.priority,
          startDate: dpToISO(value.startDate) || undefined,
          deadline: dpToISO(value.deadline) || undefined,
        });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create project");
      }
    },
  });

  const fillFromQuote = useCallback(
    (quoteId: string) => {
      form.setFieldValue("quotationId", quoteId);
      const q = quotations.find((x) => x.id === quoteId);
      if (!q) return;
      form.setFieldValue(
        "name",
        q.project
          ? `${q.project} (${q.quotationNo})`
          : `Project – ${q.quotationNo}`,
      );
      form.setFieldValue("location", q.location || "");
      form.setFieldValue("budget", String(q.totalAmount || "0"));
      if (q.customerId) form.setFieldValue("customerId", q.customerId);
    },
    [quotations, form],
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      const initialQuotes =
        acceptedQuotations.length > 0 ? acceptedQuotations : quotations;
      if (initialQuotes.length > 0) {
        setCreateMode("FROM_QUOTE");
        const firstQuote = initialQuotes[0];
        form.reset({
          quotationId: firstQuote.id,
          name: firstQuote.project
            ? `${firstQuote.project} (${firstQuote.quotationNo})`
            : `Project – ${firstQuote.quotationNo}`,
          customerId: firstQuote.customerId || "",
          location: firstQuote.location || "",
          description: "",
          budget: String(firstQuote.totalAmount || "0"),
          priority: "MEDIUM",
          startDate: isoToDP(new Date().toISOString().split("T")[0]),
          deadline: "",
        });
      } else {
        setCreateMode("CUSTOM");
        form.reset({
          quotationId: "",
          name: "",
          customerId: customers[0]?.id || "",
          location: "",
          description: "",
          budget: "",
          priority: "MEDIUM",
          startDate: isoToDP(new Date().toISOString().split("T")[0]),
          deadline: "",
        });
      }
    }
  }, [isOpen, acceptedQuotations, customers, quotations, form]);

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
      <div className="flex bg-agm-box-bg p-1 rounded-xl mb-4 text-xs font-bold border border-agm-box-border">
        {(["FROM_QUOTE", "CUSTOM"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setCreateMode(m)}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              createMode === m
                ? "bg-agm-card text-agm-green-dark shadow-xs"
                : "text-agm-muted hover:text-agm-text"
            }`}
          >
            {m === "FROM_QUOTE" ? "From Accepted Quotation" : "Custom Project"}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {createMode === "FROM_QUOTE" && (
          <div>
            <label className="form-label">Select Quotation *</label>
            <form.Field name="quotationId">
              {(field) => (
                <Select
                  value={field.state.value}
                  onChange={(e) => fillFromQuote(e.target.value)}
                  className="w-full py-1.5"
                  options={quoteList.map((q) => ({
                    value: q.id,
                    label: `${q.quotationNo} – ${q.customer || "Client"} (AED ${fmt(q.totalAmount)})`,
                  }))}
                />
              )}
            </form.Field>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Project Name *</label>
            <form.Field name="name">
              {(field) => (
                <FormInput
                  field={field}
                  required
                  placeholder="e.g. Villa 42 Interior Fitout"
                  className="w-full py-1.5"
                />
              )}
            </form.Field>
          </div>
          <div>
            <label className="form-label">Customer</label>
            <form.Field name="customerId">
              {(field) => (
                <FormSelect
                  field={field}
                  className="w-full py-1.5"
                  options={[
                    { value: "", label: "Select customer…" },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              )}
            </form.Field>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Site Location</label>
            <form.Field name="location">
              {(field) => (
                <FormInput
                  field={field}
                  placeholder="e.g. Business Bay, Dubai"
                  className="w-full py-1.5"
                />
              )}
            </form.Field>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <form.Field name="priority">
              {(field) => (
                <FormSelect
                  field={field}
                  className="w-full py-1.5"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                    { value: "URGENT", label: "Urgent" },
                  ]}
                />
              )}
            </form.Field>
          </div>
        </div>
        <div>
          <label className="form-label">Budget (AED) *</label>
          <form.Field name="budget">
            {(field) => (
              <FormInput
                field={field}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full py-1.5 font-mono"
              />
            )}
          </form.Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Start Date</label>
            <form.Field name="startDate">
              {(field) => (
                <FormDatePicker field={field} placeholder="Select start date" />
              )}
            </form.Field>
          </div>
          <div>
            <label className="form-label">Deadline</label>
            <form.Field name="deadline">
              {(field) => (
                <FormDatePicker field={field} placeholder="Select deadline" />
              )}
            </form.Field>
          </div>
        </div>
        <div>
          <label className="form-label">Notes & Scope</label>
          <form.Field name="description">
            {(field) => (
              <FormTextarea
                field={field}
                rows={2}
                placeholder="Key deliverables, materials, subcontractors…"
                className="w-full rounded-xl border border-agm-box-border bg-agm-card text-agm-text p-2.5 text-xs focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green focus:outline-none"
              />
            )}
          </form.Field>
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-agm-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <FormSubmit
            form={form}
            variant="primary"
            loading={isLoading}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Create Project
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
