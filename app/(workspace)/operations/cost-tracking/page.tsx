"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  useProjects,
  useProject,
  useAddProjectCost,
  useDeleteProjectCost,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import { CATEGORIES } from "./types";

import {
  CostTrackingHeader,
  CostTrackingProjectSelector,
  CostTrackingMetrics,
  CostTrackingAddExpense,
  CostTrackingCategoryReport,
  CostTrackingDetailedList,
} from "./components";

function CostTrackingInner() {
  const { canModify } = useAuth();
  const { confirm } = useConfirm();
  const userCanModify = canModify(null, ["ADMIN", "SUPER_ADMIN", "MANAGER"]);
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    searchParams.get("project") || "",
  );
  const [search, setSearch] = useState("");

  const { data: projects = [], refetch: refetchProjects } = useProjects({});
  const { data: projectDetail, refetch: refetchProject } =
    useProject(selectedProjectId);
  const addCost = useAddProjectCost();
  const deleteCost = useDeleteProjectCost();

  useEffect(() => {
    const id = searchParams.get("project");
    if (id) {
      setSelectedProjectId(id);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [searchParams, projects, selectedProjectId]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== "CANCELLED"),
    [projects],
  );

  const selectedProject = useMemo(() => {
    if (projectDetail && projectDetail.id === selectedProjectId) {
      return projectDetail;
    }
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      activeProjects[0] ||
      null
    );
  }, [projectDetail, projects, activeProjects, selectedProjectId]);

  const reportData = useMemo(() => {
    if (!selectedProject) {
      return {
        budget: 0,
        totalSpent: 0,
        remaining: 0,
        isUnderBudget: true,
        categoryTotals: {} as Record<string, number>,
        categoryCounts: {} as Record<string, number>,
      };
    }

    const budget = Number(
      selectedProject.budget ||
        selectedProject.estimatedCost ||
        selectedProject.contractValue ||
        0,
    );
    const costs = selectedProject.costs || [];

    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalSpent = 0;

    CATEGORIES.forEach((c) => {
      categoryTotals[c.key] = 0;
      categoryCounts[c.key] = 0;
    });

    for (const c of costs) {
      const amt = Number(c.amount || 0);
      totalSpent += amt;

      const catText =
        `${c.category || ""} ${c.description || ""}`.toLowerCase();
      const type = c.costType;

      let matchedKey = "other";

      if (
        type === "LABOR" ||
        catText.includes("labor") ||
        catText.includes("carpenter") ||
        catText.includes("mason") ||
        catText.includes("painter") ||
        catText.includes("wireman") ||
        catText.includes("helper")
      ) {
        matchedKey = "labor";
      } else if (
        catText.includes("door") ||
        catText.includes("lock") ||
        catText.includes("hinge") ||
        catText.includes("architrave")
      ) {
        matchedKey = "doors";
      } else if (
        catText.includes("floor") ||
        catText.includes("tile") ||
        catText.includes("screed") ||
        catText.includes("grout") ||
        catText.includes("adhesive")
      ) {
        matchedKey = "flooring";
      } else if (
        catText.includes("paint") ||
        catText.includes("putty") ||
        catText.includes("primer")
      ) {
        matchedKey = "painting";
      } else if (
        catText.includes("elec") ||
        catText.includes("light") ||
        catText.includes("conduit") ||
        catText.includes("wire") ||
        catText.includes("cable")
      ) {
        matchedKey = "electrical";
      } else if (
        type === "EQUIPMENT" ||
        catText.includes("scaffold") ||
        catText.includes("tool") ||
        catText.includes("equip")
      ) {
        matchedKey = "equipment";
      } else if (
        type === "TRANSPORT" ||
        catText.includes("skip") ||
        catText.includes("haulage") ||
        catText.includes("debris") ||
        catText.includes("transport")
      ) {
        matchedKey = "waste";
      }

      categoryTotals[matchedKey] = (categoryTotals[matchedKey] || 0) + amt;
      categoryCounts[matchedKey] = (categoryCounts[matchedKey] || 0) + 1;
    }

    const pLabor = Number(selectedProject.laborCost || 0);
    const pMaterial = Number(selectedProject.materialCost || 0);
    const pOther = Number(selectedProject.otherExpenses || 0);
    const pActual = Number(selectedProject.actualCost || 0);

    if (pLabor > categoryTotals["labor"]) {
      const diff = pLabor - categoryTotals["labor"];
      categoryTotals["labor"] += diff;
      totalSpent += diff;
    }

    const currentMat =
      categoryTotals["doors"] +
      categoryTotals["flooring"] +
      categoryTotals["painting"] +
      categoryTotals["electrical"];
    if (pMaterial > currentMat) {
      const diff = pMaterial - currentMat;
      categoryTotals["doors"] += diff;
      totalSpent += diff;
    }

    const currentOth =
      categoryTotals["equipment"] +
      categoryTotals["waste"] +
      categoryTotals["other"];
    if (pOther > currentOth) {
      const diff = pOther - currentOth;
      categoryTotals["other"] += diff;
      totalSpent += diff;
    }

    if (pActual > totalSpent) {
      const diff = pActual - totalSpent;
      categoryTotals["labor"] += diff;
      totalSpent += diff;
    }

    const remaining = budget - totalSpent;
    const isUnderBudget = remaining >= 0;

    return {
      budget,
      totalSpent,
      remaining,
      isUnderBudget,
      categoryTotals,
      categoryCounts,
    };
  }, [selectedProject]);

  const filteredCosts = useMemo(() => {
    if (!selectedProject?.costs) return [];
    return selectedProject.costs.filter((c) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        c.description.toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.reference || "").toLowerCase().includes(q)
      );
    });
  }, [selectedProject, search]);

  return (
    <div className="space-y-6">
      <CostTrackingHeader />

      <CostTrackingProjectSelector
        projects={activeProjects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      <CostTrackingMetrics
        selectedProject={selectedProject}
        reportData={reportData}
      />

      {canModify(null, ["ADMIN", "SUPER_ADMIN", "MANAGER"]) && (
        <CostTrackingAddExpense
          selectedProject={selectedProject}
          isLoading={addCost.isPending}
          onAddCost={async (data) => {
            await addCost.mutateAsync(data);
            await Promise.all([refetchProject(), refetchProjects()]);
            qc.invalidateQueries({ queryKey: ["project", data.projectId] });
            qc.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}

      <CostTrackingCategoryReport
        selectedProject={selectedProject}
        reportData={reportData}
      />

      <CostTrackingDetailedList
        selectedProject={selectedProject}
        filteredCosts={filteredCosts}
        search={search}
        onSearchChange={setSearch}
        canModify={canModify(null, ["ADMIN", "SUPER_ADMIN", "MANAGER"])}
        onDeleteCost={async (costId) => {
          if (!selectedProject) return;
          const isConfirmed = await confirm({
            title: "Delete Cost Entry",
            message: "Are you sure you want to delete this cost entry?",
            variant: "danger",
            confirmText: "Delete",
          });
          if (!isConfirmed) return;
          try {
            await deleteCost.mutateAsync({
              projectId: selectedProject.id,
              costId,
            });
            await Promise.all([refetchProject(), refetchProjects()]);
            qc.invalidateQueries({ queryKey: ["project", selectedProject.id] });
            qc.invalidateQueries({ queryKey: ["projects"] });
            toast.success("Cost item deleted successfully");
          } catch (err: any) {
            toast.error("Failed to delete cost item: " + err.message);
          }
        }}
      />
    </div>
  );
}

export default function CostTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Cost Tracking Report…
        </div>
      }
    >
      <CostTrackingInner />
    </Suspense>
  );
}
