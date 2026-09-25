import React, { useState, useEffect } from "react";
import { Project, ProjectStatus, ProjectPriority } from "@/lib/hooks/api-hooks";
import { Button, Input, Select, Modal, DatePicker } from "@/components/ui";
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
  const [eName, setEName] = useState("");
  const [eLocation, setELocation] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eBudget, setEBudget] = useState("");
  const [ePriority, setEPriority] = useState<ProjectPriority>("MEDIUM");
  const [eStatus, setEStatus] = useState<ProjectStatus>("PLANNING");
  const [eProgressPct, setEProgressPct] = useState<number>(0);
  const [eStart, setEStart] = useState("");
  const [eDeadline, setEDeadline] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (project) {
      setEName(project.name);
      setELocation(project.location || "");
      setEDesc(project.description || "");
      setEBudget(String(project.budget || ""));
      setEPriority((project.priority as ProjectPriority) || "MEDIUM");
      setEStatus(project.status as ProjectStatus);
      setEProgressPct(project.progressPct || 0);
      setEStart(
        project.startDate ? isoToDP(project.startDate.split("T")[0]) : "",
      );
      setEDeadline(
        project.deadline ? isoToDP(project.deadline.split("T")[0]) : "",
      );
      setErrorMsg("");
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setErrorMsg("");
    try {
      if (!eName.trim()) throw new Error("Project name is required");
      await onSubmit({
        id: project.id,
        name: eName.trim(),
        description: eDesc.trim() || undefined,
        location: eLocation.trim() || undefined,
        budget: eBudget ? Number(eBudget) : 0,
        priority: ePriority,
        status: eStatus,
        progressPct: Number(eProgressPct) || 0,
        startDate: dpToISO(eStart) || undefined,
        deadline: dpToISO(eDeadline) || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update project");
    }
  }

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
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Project Name *</label>
            <Input
              required
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              className="w-full py-1.5"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <Select
              value={eStatus}
              onChange={(e) => setEStatus(e.target.value as ProjectStatus)}
              className="w-full py-1.5"
              options={[
                { value: "PLANNING", label: "Planning" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "ON_HOLD", label: "On Hold" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Location</label>
            <Input
              value={eLocation}
              onChange={(e) => setELocation(e.target.value)}
              className="w-full py-1.5"
            />
          </div>
          <div>
            <label className="form-label">Priority</label>
            <Select
              value={ePriority}
              onChange={(e) => setEPriority(e.target.value as ProjectPriority)}
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
            value={eBudget}
            onChange={(e) => setEBudget(e.target.value)}
            className="w-full py-1.5 font-mono"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Start Date</label>
            <DatePicker
              value={eStart}
              onChange={setEStart}
              placeholder="Select start date"
            />
          </div>
          <div>
            <label className="form-label">Deadline</label>
            <DatePicker
              value={eDeadline}
              onChange={setEDeadline}
              placeholder="Select deadline"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="form-label mb-0">Completion Progress</label>
            <span className="font-mono text-xs font-bold text-agm-green">
              {eProgressPct}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={eProgressPct}
              onChange={(e) => setEProgressPct(Number(e.target.value))}
              className="flex-1 cursor-pointer accent-emerald-600 h-2 bg-slate-200 rounded-lg"
            />
            <span className="text-xs font-mono font-semibold text-slate-600 w-10 text-right">
              {eProgressPct}%
            </span>
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea
            value={eDesc}
            onChange={(e) => setEDesc(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
