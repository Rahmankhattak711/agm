import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";
import type {
  Employee,
  DailyAttendance,
  LeaveRequest,
  LeaveStatus,
  Bonus,
  BonusType,
  EmployeeMonthlySheetData,
  WorkforceMonthlySheetData,
} from "./types";

export function useEmployees(filters?: {
  department?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.department) params.append("department", filters.department);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Employee[]>({
    queryKey: ["employees", filters],
    queryFn: () => fetchJson<Employee[]>(`/api/employees${queryStr}`),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<Employee>("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Employee>("/api/employees", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/employees?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDailyAttendance(filters?: {
  employeeId?: string;
  date?: string;
  month?: number;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<DailyAttendance[]>({
    queryKey: ["attendance", filters],
    queryFn: () =>
      fetchJson<DailyAttendance[]>(`/api/employees/attendance${queryStr}`),
  });
}

export function useRecordAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<any>("/api/employees/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/attendance?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.status) params.append("status", filters.status);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", filters],
    queryFn: () =>
      fetchJson<LeaveRequest[]>(`/api/employees/leaves${queryStr}`),
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
    }) =>
      fetchJson<LeaveRequest>("/api/employees/leaves", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: LeaveStatus }) =>
      fetchJson<LeaveRequest>("/api/employees/leaves", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/leaves?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}

export function useBonuses(filters?: {
  employeeId?: string;
  month?: number;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Bonus[]>({
    queryKey: ["bonuses", filters],
    queryFn: () => fetchJson<Bonus[]>(`/api/employees/bonuses${queryStr}`),
  });
}

export function useCreateBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      type: BonusType;
      amount: number;
      month?: number;
      year?: number;
      reason?: string;
    }) =>
      fetchJson<Bonus>("/api/employees/bonuses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Bonus>("/api/employees/bonuses", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/employees/bonuses?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonuses"] });
    },
  });
}

export function useEmployeeMonthlySheet(filters: {
  employeeId?: string;
  month: number;
  year: number;
}) {
  const params = new URLSearchParams();
  if (filters.employeeId) params.append("employeeId", filters.employeeId);
  params.append("month", filters.month.toString());
  params.append("year", filters.year.toString());

  return useQuery<EmployeeMonthlySheetData>({
    queryKey: ["employee-monthly-sheet", filters],
    queryFn: () =>
      fetchJson<EmployeeMonthlySheetData>(
        `/api/employees/monthly-sheet?${params.toString()}`,
      ),
    enabled: Boolean(filters.employeeId && filters.month && filters.year),
  });
}

export function useWorkforceMonthlySheet(filters: {
  month: number;
  year: number;
}) {
  const params = new URLSearchParams();
  params.append("employeeId", "all");
  params.append("month", filters.month.toString());
  params.append("year", filters.year.toString());

  return useQuery<WorkforceMonthlySheetData>({
    queryKey: ["workforce-monthly-sheet", filters],
    queryFn: () =>
      fetchJson<WorkforceMonthlySheetData>(
        `/api/employees/monthly-sheet?${params.toString()}`,
      ),
    enabled: Boolean(filters.month && filters.year),
  });
}

export function useSaveMonthlyPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<any>("/api/employees/monthly-sheet", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["employee-monthly-sheet"],
      });
      qc.invalidateQueries({
        queryKey: ["workforce-monthly-sheet"],
      });
    },
  });
}
