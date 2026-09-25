import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";
import type { Project, ProjectCost, ProjectMilestone } from "./types";

export function useProjects(filters?: {
  status?: string;
  search?: string;
  customerId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "ALL")
    params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.customerId) params.append("customerId", filters.customerId);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Project[]>({
    queryKey: ["projects", filters],
    queryFn: () => fetchJson<Project[]>(`/api/projects${queryStr}`),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => fetchJson<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      fetchJson<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/projects/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAddProjectCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      [key: string]: any;
    }) =>
      fetchJson<ProjectCost>(`/api/projects/${projectId}/costs`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });
}

export function useUpdateProjectCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      costId,
      ...data
    }: {
      projectId: string;
      costId: string;
      [key: string]: any;
    }) =>
      fetchJson<ProjectCost>(
        `/api/projects/${projectId}/costs?costId=${costId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });
}

export function useDeleteProjectCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      costId,
    }: {
      projectId: string;
      costId: string;
    }) =>
      fetchJson<{ ok: boolean }>(
        `/api/projects/${projectId}/costs?costId=${costId}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });
}

export function useAddProjectMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      [key: string]: any;
    }) =>
      fetchJson<ProjectMilestone>(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });
}

export function useUpdateProjectMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      milestoneId,
      ...data
    }: {
      projectId: string;
      milestoneId: string;
      [key: string]: any;
    }) =>
      fetchJson<ProjectMilestone>(
        `/api/projects/${projectId}/milestones?milestoneId=${milestoneId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", variables.projectId] });
    },
  });
}
