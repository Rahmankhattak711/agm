import fs from "fs";
import path from "path";
import os from "os";
import {
  RiskAssessmentDocumentData,
  SAMPLE_RISK_ASSESSMENT,
} from "@/components/documents/risk-assessment-constants";

declare global {
  // eslint-disable-next-line no-var
  var __agm_risk_cache: RiskAssessmentDocumentData[] | undefined;
}

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "agm_data");

function getStoragePath(): string {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    return path.join(LOCAL_DATA_DIR, "risk-assessments.json");
  } catch {
    try {
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
      }
      return path.join(TMP_DATA_DIR, "risk-assessments.json");
    } catch {
      return path.join(os.tmpdir(), "risk-assessments.json");
    }
  }
}

function getInitialRiskAssessments(): RiskAssessmentDocumentData[] {
  return [
    {
      ...SAMPLE_RISK_ASSESSMENT,
      id: "ra-01200-r2",
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getAllRiskAssessments(): RiskAssessmentDocumentData[] {
  if (global.__agm_risk_cache && global.__agm_risk_cache.length > 0) {
    return global.__agm_risk_cache;
  }

  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        global.__agm_risk_cache = list;
        return list;
      }
    }
  } catch (err) {
    console.warn("Could not read risk assessments from filesystem, using initial preset:", err);
  }

  const initial = getInitialRiskAssessments();
  global.__agm_risk_cache = initial;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), "utf-8");
  } catch {
    // Read-only filesystem fallback
  }
  return initial;
}

export function getRiskAssessmentById(id: string): RiskAssessmentDocumentData | null {
  const all = getAllRiskAssessments();
  return all.find((a) => a.id === id) || null;
}

export function saveRiskAssessment(
  data: Partial<RiskAssessmentDocumentData> & { refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): RiskAssessmentDocumentData {
  const all = [...getAllRiskAssessments()];
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

  global.__agm_risk_cache = all;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist risk assessment to disk (running in read-only environment), cached in memory:", err);
  }

  return mergedRecord;
}

export function deleteRiskAssessment(id: string): boolean {
  const all = getAllRiskAssessments();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  global.__agm_risk_cache = filtered;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist deleted risk assessment to disk, updated in memory:", err);
  }

  return true;
}
