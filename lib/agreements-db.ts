import fs from "fs";
import path from "path";
import os from "os";
import {
  AgreementDocumentData,
  SAMPLE_RENOVATION_AGREEMENT,
} from "@/components/documents/constants";

declare global {
  var __agm_agreements_cache: AgreementDocumentData[] | undefined;
}

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "agm_data");

function getStoragePath(): string {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    return path.join(LOCAL_DATA_DIR, "agreements.json");
  } catch {
    try {
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
      }
      return path.join(TMP_DATA_DIR, "agreements.json");
    } catch {
      return path.join(os.tmpdir(), "agreements.json");
    }
  }
}

function getInitialAgreements(): AgreementDocumentData[] {
  return [
    {
      ...SAMPLE_RENOVATION_AGREEMENT,
      id: "agm-agr-01147-r3",
      title: "AGM FITOUT AGREEMENT",
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getAllAgreements(): AgreementDocumentData[] {
  if (
    global.__agm_agreements_cache &&
    global.__agm_agreements_cache.length > 0
  ) {
    return global.__agm_agreements_cache;
  }

  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        global.__agm_agreements_cache = list;
        return list;
      }
    }
  } catch (err) {
    console.warn(
      "Could not read agreements from filesystem, using initial preset:",
      err,
    );
  }

  const initial = getInitialAgreements();
  global.__agm_agreements_cache = initial;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), "utf-8");
  } catch {}
  return initial;
}

export function getAgreementById(id: string): AgreementDocumentData | null {
  const all = getAllAgreements();
  return all.find((a) => a.id === id) || null;
}

export function saveAgreement(
  data: Partial<AgreementDocumentData> & { title?: string; refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): AgreementDocumentData {
  const all = [...getAllAgreements()];
  const now = new Date().toISOString();

  let targetId = data.id;
  if (!targetId) {
    targetId = `agr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const existingIdx = all.findIndex(
    (a) => a.id === targetId || a.refNumber === data.refNumber,
  );

  const mergedRecord: AgreementDocumentData = {
    ...SAMPLE_RENOVATION_AGREEMENT,
    ...(existingIdx >= 0 ? all[existingIdx] : {}),
    ...data,
    id: existingIdx >= 0 ? all[existingIdx].id : targetId,
    title:
      data.title ||
      (existingIdx >= 0 ? all[existingIdx].title : "AGM FITOUT AGREEMENT") ||
      "AGM FITOUT AGREEMENT",
    status:
      (data.status as any) ||
      (existingIdx >= 0 ? all[existingIdx].status : "DRAFT") ||
      "DRAFT",
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

  global.__agm_agreements_cache = all;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.warn(
      "Could not persist agreements to disk (running in read-only environment), cached in memory:",
      err,
    );
  }

  return mergedRecord;
}

export function deleteAgreement(id: string): boolean {
  const all = getAllAgreements();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  global.__agm_agreements_cache = filtered;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.warn(
      "Could not persist deleted agreement to disk, updated in memory:",
      err,
    );
  }

  return true;
}
