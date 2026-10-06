"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useQuotations,
  useCustomers,
  Project,
} from "@/lib/hooks/api-hooks";
import { Button } from "@/components/ui";
import { PlusIcon, BuildingIcon } from "@/components/icons";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  ProjectsHeader,
  ProjectsKPIs,
  ProjectsFilterBar,
  ProjectCard,
  CreateProjectModal,
  EditProjectModal,
} from "./components";

export default function ProjectsPage() {
  const { canModify } = useAuth();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useProjects({
    status: statusFilter,
    search,
  });
  const { data: quotations = [] } = useQuotations();
  const { data: customers = [] } = useCustomers();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const acceptedQuotations = useMemo(
    () => quotations.filter((q) => q.status === "ACCEPTED"),
    [quotations],
  );

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const ok =
        p.projectCode.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        (p.customer?.name || "").toLowerCase().includes(q);
      return ok && (statusFilter === "ALL" || p.status === statusFilter);
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => {
    let bud = 0,
      ac = 0,
      active = 0,
      done = 0;
    for (const p of projects) {
      const pBud = Number(p.contractValue || p.budget || p.quotation?.totalAmount || 0);
      const totalCostFromItems = p.costs?.reduce(
        (sum: number, c: any) => sum + Number(c.amount || 0),
        0,
      );
      const pCost = Number(
        p.actualCost || (totalCostFromItems !== undefined && totalCostFromItems > 0 ? totalCostFromItems : 0),
      );
      bud += pBud;
      ac += pCost;
      if (p.status === "IN_PROGRESS" || p.status === "PLANNING") active++;
      else if (p.status === "COMPLETED") done++;
    }
    const balance = bud - ac;
    const balancePct = bud > 0 ? Math.round((balance / bud) * 100) : 0;
    return {
      total: projects.length,
      active,
      done,
      bud,
      ac,
      balance,
      balancePct,
    };
  }, [projects]);

  const userCanModify = canModify(null, ["ADMIN", "SUPER_ADMIN", "MANAGER"]);
  const userCanDelete = canModify(null, ["ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="space-y-6">
      <ProjectsHeader onNewProject={() => setIsCreateOpen(true)} />

      <ProjectsKPIs stats={stats} />

      <ProjectsFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        count={filteredProjects.length}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 flex flex-col items-center gap-3 text-slate-400">
          <BuildingIcon size={36} className="text-slate-300" />
          <p className="font-semibold text-sm">No projects yet</p>
          <p className="text-xs text-center max-w-xs">
            Start by clicking &quot;New Project&quot; to create a project from
            an accepted quotation.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={13} />}
            className="mt-2"
          >
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              canModify={userCanModify}
              canDelete={userCanDelete}
              onEdit={(proj) => setEditingProject(proj)}
              onDelete={async (proj) => {
                const isConfirmed = await confirm({
                  title: "Delete Project",
                  message: `Delete "${proj.name}"? All associated costs will be removed.`,
                  variant: "danger",
                  confirmText: "Delete",
                });
                if (isConfirmed) {
                  try {
                    await deleteProject.mutateAsync(proj.id);
                    toast.success(`Project "${proj.name}" deleted`);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete project");
                  }
                }
              }}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        quotations={quotations}
        acceptedQuotations={acceptedQuotations}
        customers={customers}
        isLoading={createProject.isPending}
        onSubmit={async (data) => {
          await createProject.mutateAsync({
            ...data,
            contractValue: data.budget,
            status: "PLANNING",
          });
        }}
      />

      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        isLoading={updateProject.isPending}
        onSubmit={async (data) => {
          await updateProject.mutateAsync({
            ...data,
            contractValue: data.budget,
          });
        }}
      />
    </div>
  );
}
