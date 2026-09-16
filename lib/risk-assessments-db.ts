import fs from "fs";
import path from "path";
import {
  RiskAssessmentDocumentData,
  SAMPLE_RISK_ASSESSMENT,
} from "@/components/documents/risk-assessment-constants";

const DATA_DIR = path.join(process.cwd(), "data");
const RISK_FILE = path.join(DATA_DIR, "risk-assessments.json");

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RISK_FILE)) {
    const initial = [
      {
        ...SAMPLE_RISK_ASSESSMENT,
        id: "ra-01200-r2",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(RISK_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllRiskAssessments(): RiskAssessmentDocumentData[] {
  try {
    ensureStorage();
    const raw = fs.readFileSync(RISK_FILE, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Error reading risk assessments storage:", err);
    return [];
  }
}

export function getRiskAssessmentById(id: string): RiskAssessmentDocumentData | null {
  const all = getAllRiskAssessments();
  return all.find((a) => a.id === id) || null;
}

export function saveRiskAssessment(
  data: Partial<RiskAssessmentDocumentData> & { refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): RiskAssessmentDocumentData {
  ensureStorage();
  const all = getAllRiskAssessments();
  const now = new Date().toISOString();

  let targetId = data.id;
  if (!targetId) {
    targetId = `ra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const existingIdx = all.findIndex(
    (a) => a.id === targetId || a.refNumber === data.refNumber,
  );

  const mergedRecord: RiskAssessmentDocumentData = {
    ...SAMPLE_RISK_ASSESSMENT,
    ...(existingIdx >= 0 ? all[existingIdx] : {}),
    ...data,
    id: existingIdx >= 0 ? all[existingIdx].id : targetId,
    status: (data.status as any) || (existingIdx >= 0 ? all[existingIdx].status : "DRAFT") || "DRAFT",
    updatedAt: now,
    createdAt: existingIdx >= 0 ? all[existingIdx].createdAt || now : now,
    createdBy:
      (existingIdx >= 0 && all[existingIdx].createdBy) ||
      (authUser
        ? {
            id: authUser.id,
            fullName: authUser.fullName,
            email: authUser.email,
          }
        : {
            id: "system",
            fullName: "AGM Representative",
            email: "assem@agmfitout.com",
          }),
  };

  if (existingIdx >= 0) {
    all[existingIdx] = mergedRecord;
  } else {
    all.unshift(mergedRecord);
  }

  fs.writeFileSync(RISK_FILE, JSON.stringify(all, null, 2), "utf-8");
  return mergedRecord;
}

export function deleteRiskAssessment(id: string): boolean {
  ensureStorage();
  const all = getAllRiskAssessments();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  fs.writeFileSync(RISK_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}
