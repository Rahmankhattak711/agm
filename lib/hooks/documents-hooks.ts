import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";
import type { CustomLetterDocumentData } from "@/components/documents/custom-letter-constants";

export type AgreementRecord = {
  id: string;
  title: string;
  refNumber: string;
  date: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED";
  copiesCount: number;
  contractor: any;
  client: any;
  property: string;
  project: string;
  contractValueNum: number;
  contractValueText: string;
  quotationRef: string;
  clientMaterials: any[];
  clauses: any[];
  paymentMilestones: any[];
  contractorSignatory: any;
  clientSignatory: any;
  createdBy?: { id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export function useAgreements(params?: { search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<AgreementRecord[]>({
    queryKey: ["agreements", params],
    queryFn: () =>
      fetchJson<AgreementRecord[]>(`/api/commercial/agreements${qStr}`),
  });
}

export function useAgreement(id?: string | null) {
  return useQuery<AgreementRecord>({
    queryKey: ["agreement", id],
    queryFn: () =>
      fetchJson<AgreementRecord>(`/api/commercial/agreements/${id}`),
    enabled: !!id,
  });
}

export function useSaveAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AgreementRecord>) =>
      fetchJson<AgreementRecord>("/api/commercial/agreements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agreements"] });
    },
  });
}

export function useDeleteAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/commercial/agreements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agreements"] });
    },
  });
}

export type RiskAssessmentRecord = {
  id: string;
  refNumber: string;
  date: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  customerName: string;
  projectName: string;
  phoneNumber: string;
  projectLocation: string;
  startDate: string;
  duration: string;
  workingHours: string;
  projectManager: {
    name: string;
    description: string;
  };
  constructionManager: {
    name: string;
    description: string;
  };
  purpose: string;
  scope: string;
  items: Array<{
    id: string;
    activity: string;
    riskDescription: string;
    impact: string;
    mitigation: string;
  }>;
  createdBy?: { id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export function useRiskAssessments(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<RiskAssessmentRecord[]>({
    queryKey: ["risk-assessments", params],
    queryFn: () =>
      fetchJson<RiskAssessmentRecord[]>(
        `/api/commercial/risk-assessments${qStr}`,
      ),
  });
}

export function useRiskAssessment(id?: string | null) {
  return useQuery<RiskAssessmentRecord>({
    queryKey: ["risk-assessment", id],
    queryFn: () =>
      fetchJson<RiskAssessmentRecord>(`/api/commercial/risk-assessments/${id}`),
    enabled: !!id,
  });
}

export function useSaveRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiskAssessmentRecord>) =>
      fetchJson<RiskAssessmentRecord>("/api/commercial/risk-assessments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-assessments"] });
    },
  });
}

export function useDeleteRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/commercial/risk-assessments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-assessments"] });
    },
  });
}

export type MethodStatementRecord = {
  id: string;
  refNumber: string;
  date: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  customerName: string;
  projectName: string;
  phoneNumber: string;
  customerEmail: string;
  projectLocation: string;
  workType: string;
  startDate: string;
  duration: string;
  workingHours: string;
  projectManager: {
    name: string;
    description: string;
  };
  constructionManager: {
    name: string;
    description: string;
  };
  introduction: string;
  purpose: string;
  scopeOverview: string;
  items: Array<{
    id: string;
    number: number;
    description: string;
  }>;
  createdBy?: { id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export function useMethodStatements(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<MethodStatementRecord[]>({
    queryKey: ["method-statements", params],
    queryFn: () =>
      fetchJson<MethodStatementRecord[]>(
        `/api/commercial/method-statements${qStr}`,
      ),
  });
}

export function useMethodStatement(id?: string | null) {
  return useQuery<MethodStatementRecord>({
    queryKey: ["method-statement", id],
    queryFn: () =>
      fetchJson<MethodStatementRecord>(
        `/api/commercial/method-statements/${id}`,
      ),
    enabled: !!id,
  });
}

export function useSaveMethodStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MethodStatementRecord>) =>
      fetchJson<MethodStatementRecord>("/api/commercial/method-statements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["method-statements"] });
    },
  });
}

export function useDeleteMethodStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/commercial/method-statements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["method-statements"] });
    },
  });
}

export type SalaryCertificateRecord = {
  id: string;
  refNumber: string;
  date: string;
  status: "DRAFT" | "ACTIVE" | "ISSUED" | "COMPLETED";
  addressee: string;
  employeePrefix: "Mr." | "Ms." | "Mrs." | "Dr.";
  employeeName: string;
  emiratesId: string;
  joiningDate: string;
  companyName: string;
  position: string;
  purposeDisclaimer: string;
  monthlySalaryNum: number;
  monthlySalaryText: string;
  currency: string;
  signatoryCompany: string;
  signatoryTitle: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatorySignatureUrl?: string;
  companyStampUrl?: string;
  showStampAndSignature: boolean;
  city: string;
  poBox: string;
  landline: string;
  telephone: string;
  vatNumber: string;
  footerCompanyName: string;
  registeredAddress: string;
  employeeId?: string;
  notes?: string;
  createdBy?: { id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export function useSalaryCertificates(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SalaryCertificateRecord[]>({
    queryKey: ["salary-certificates", params],
    queryFn: () =>
      fetchJson<SalaryCertificateRecord[]>(
        `/api/commercial/salary-certificates${qStr}`,
      ),
  });
}

export function useSalaryCertificate(id?: string | null) {
  return useQuery<SalaryCertificateRecord>({
    queryKey: ["salary-certificate", id],
    queryFn: () =>
      fetchJson<SalaryCertificateRecord>(
        `/api/commercial/salary-certificates/${id}`,
      ),
    enabled: !!id,
  });
}

export function useSaveSalaryCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SalaryCertificateRecord>) =>
      fetchJson<SalaryCertificateRecord>(
        "/api/commercial/salary-certificates",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-certificates"] });
    },
  });
}

export function useDeleteSalaryCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/commercial/salary-certificates/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-certificates"] });
    },
  });
}

export function useCustomLetters(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const queryStr = q.toString() ? "?" + q.toString() : "";
  return useQuery<CustomLetterDocumentData[]>({
    queryKey: ["custom-letters", params],
    queryFn: () =>
      fetchJson<CustomLetterDocumentData[]>(
        "/api/commercial/custom-letters" + queryStr,
      ),
  });
}

export function useCustomLetter(id?: string | null) {
  return useQuery<CustomLetterDocumentData>({
    queryKey: ["custom-letter", id],
    queryFn: () =>
      fetchJson<CustomLetterDocumentData>(
        "/api/commercial/custom-letters/" + id,
      ),
    enabled: Boolean(id),
  });
}

export function useSaveCustomLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomLetterDocumentData>) =>
      fetchJson<CustomLetterDocumentData>("/api/commercial/custom-letters", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-letters"] });
    },
  });
}

export function useDeleteCustomLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>("/api/commercial/custom-letters/" + id, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-letters"] });
    },
  });
}
