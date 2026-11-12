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


export function useDepartments() {
  return useQuery<any[]>({
    queryKey: ["hr-departments"],
    queryFn: () => fetchJson("/api/hr/departments"),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string }) =>
      fetchJson("/api/hr/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; code?: string; name?: string; description?: string; isActive?: boolean }) =>
      fetchJson("/api/hr/departments", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/hr/departments?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
      qc.invalidateQueries({ queryKey: ["hr-designations"] });
    },
  });
}

export function useDesignations() {
  return useQuery<any[]>({
    queryKey: ["hr-designations"],
    queryFn: () => fetchJson("/api/hr/designations"),
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      code: string;
      name: string;
      departmentId?: string;
      isFieldWorker?: boolean;
      description?: string;
    }) =>
      fetchJson("/api/hr/designations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-designations"] });
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
    },
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      code?: string;
      name?: string;
      departmentId?: string;
      isFieldWorker?: boolean;
      description?: string;
    }) =>
      fetchJson("/api/hr/designations", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-designations"] });
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
    },
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/hr/designations?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-designations"] });
      qc.invalidateQueries({ queryKey: ["hr-departments"] });
    },
  });
}


export function useWorkers(filters?: { category?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.search) params.append("search", filters.search);
  const q = params.toString() ? `?${params.toString()}` : "";

  return useQuery<{
    workers: any[];
    totalWorkers: number;
  }>({
    queryKey: ["hr-workers", filters],
    queryFn: () => fetchJson(`/api/hr/workers${q}`),
  });
}

export function useVaultDocuments(filters?: {
  employeeId?: string;
  documentType?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.documentType) params.append("documentType", filters.documentType);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  const q = params.toString() ? `?${params.toString()}` : "";

  return useQuery<{
    documents: any[];
    summary: {
      totalDocuments: number;
      validCount: number;
      criticalCount: number;
      expiringSoonCount: number;
      expiredCount: number;
    };
  }>({
    queryKey: ["hr-vault-documents", filters],
    queryFn: () => fetchJson(`/api/hr/documents${q}`),
  });
}

export function useRegisterDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      documentType: string;
      documentNumber: string;
      issueDate?: string;
      expiryDate: string;
      notes?: string;
    }) =>
      fetchJson("/api/hr/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-vault-documents"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}


export function useHrAttendanceRegister(filters?: {
  rangeType?: "daily" | "weekly" | "monthly" | "custom";
  date?: string;
  month?: number;
  year?: number;
  from?: string;
  to?: string;
  department?: string;
  employeeId?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.rangeType) params.append("rangeType", filters.rangeType);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  if (filters?.from) params.append("from", filters.from);
  if (filters?.to) params.append("to", filters.to);
  if (filters?.department) params.append("department", filters.department);
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.search) params.append("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<{
    records: any[];
    summary: {
      periodLabel: string;
      startDate: string;
      endDate: string;
      totalEmployees: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      leaveCount: number;
      totalWorkingHours: number;
      totalOvertimeHours: number;
      estimatedTotalOvertimeCost: number;
    };
  }>({
    queryKey: ["hr-attendance-register", filters],
    queryFn: () => fetchJson(`/api/hr/attendance${queryStr}`),
  });
}

export function useRecordHrAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<any>("/api/hr/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-attendance-register"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useBulkMarkStandardDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateStr: string) =>
      fetchJson<any>("/api/hr/attendance", {
        method: "POST",
        body: JSON.stringify({ action: "BULK_STANDARD_DAY", date: dateStr }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-attendance-register"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}




export function useSalaryStructures(filters?: { employeeId?: string; department?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.department) params.append("department", filters.department);
  if (filters?.search) params.append("search", filters.search);
  const q = params.toString() ? `?${params.toString()}` : "";

  return useQuery<any[]>({
    queryKey: ["hr-salary-structures", filters],
    queryFn: () => fetchJson(`/api/hr/salary-structures${q}`),
  });
}

export function useSaveSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson("/api/hr/salary-structures", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-salary-structures"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function usePayrollBatch(month: number, year: number) {
  return useQuery<any>({
    queryKey: ["hr-payroll-batch", month, year],
    queryFn: () => fetchJson(`/api/hr/payroll?month=${month}&year=${year}`),
  });
}

export function useUpdatePayrollBatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: number; year: number; status: "REVIEWED" | "APPROVED" | "PAID" }) =>
      fetchJson("/api/hr/payroll", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-payroll-batch"] });
      qc.invalidateQueries({ queryKey: ["hr-salary-slips"] });
    },
  });
}

export function useSalarySlips(filters?: { month?: number; year?: number; employeeId?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.month) params.append("month", filters.month.toString());
  if (filters?.year) params.append("year", filters.year.toString());
  if (filters?.employeeId) params.append("employeeId", filters.employeeId);
  if (filters?.search) params.append("search", filters.search);
  const q = params.toString() ? `?${params.toString()}` : "";

  return useQuery<any[]>({
    queryKey: ["hr-salary-slips", filters],
    queryFn: () => fetchJson(`/api/hr/salary-slips${q}`),
  });
}
