"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Project, ProjectStatus, ProjectPriority } from "@/lib/hooks/api-hooks";
import {
  Button,
  Modal,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import { dpToISO, isoToDP } from "../types";

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSubmit: (data: {
    id: string;
    name: string;
    description?: string;
    location?: string;
    budget: number;
    priority: ProjectPriority;
    status: ProjectStatus;
    progressPct: number;
    startDate?: string;
    deadline?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function EditProjectModal({
  project,
  onClose,
  onSubmit,
  isLoading,
}: EditProjectModalProps) {
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm({
    defaultValues: {
      name: "",
      location: "",
      description: "",
      budget: "",
      priority: "MEDIUM" as ProjectPriority,
      status: "PLANNING" as ProjectStatus,
      progressPct: 0,
      startDate: "",
      deadline: "",
    },
    onSubmit: async ({ value }) => {
      if (!project) return;
      setErrorMsg("");
      try {
        if (!value.name.trim()) throw new Error("Project name is required");
        await onSubmit({
          id: project.id,
          name: value.name.trim(),
          description: value.description.trim() || undefined,
          location: value.location.trim() || undefined,
          budget: value.budget ? Number(value.budget) : 0,
          priority: value.priority,
          status: value.status,
          progressPct: Number(value.progressPct) || 0,
          startDate: dpToISO(value.startDate) || undefined,
          deadline: dpToISO(value.deadline) || undefined,
        });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update project");
      }
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        location: project.location || "",
        description: project.description || "",
        budget: String(project.contractValue || project.budget || ""),
        priority: (project.priority as ProjectPriority) || "MEDIUM",
        status: project.status as ProjectStatus,
        progressPct: project.progressPct || 0,
        startDate: project.startDate
          ? isoToDP(project.startDate.split("T")[0])
          : "",
        deadline: project.deadline
          ? isoToDP(project.deadline.split("T")[0])
          : "",
      });
      setErrorMsg("");
    }
  }, [project, form]);

  return (
    <Modal
      isOpen={!!project}
      onClose={onClose}
      title={`Edit – ${project?.projectCode}`}
      maxWidth="2xl"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 text-xs"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Project Name *</label>
            <form.Field name="name">
              {(field) => (
                <FormInput field={field} required className="w-full py-1.5" />
              )}
            </form.Field>
          </div>
          <div>
            <label className="form-label">Status</label>
            <form.Field name="status">
              {(field) => (
                <FormSelect
                  field={field}
                  className="w-full py-1.5"
                  options={[
                    { value: "PLANNING", label: "Planning" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "ON_HOLD", label: "On Hold" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
              )}
            </form.Field>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Location</label>
            <form.Field name="location">
              {(field) => <FormInput field={field} className="w-full py-1.5" />}
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
          <form.Field name="progressPct">
            {(field) => (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="form-label mb-0">Completion Progress</label>
                  <span className="font-mono text-xs font-bold text-agm-green">
                    {field.state.value}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    className="flex-1 cursor-pointer accent-agm-green h-2 bg-agm-box-border rounded-lg"
                  />
                  <span className="text-xs font-mono font-semibold text-agm-muted w-10 text-right">
                    {field.state.value}%
                  </span>
                </div>
              </div>
            )}
          </form.Field>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <form.Field name="description">
            {(field) => (
              <FormTextarea
                field={field}
                rows={2}
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
            Save Changes
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
