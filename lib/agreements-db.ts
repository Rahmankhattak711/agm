import fs from "fs";
import path from "path";
import { AgreementDocumentData, SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";

const DATA_DIR = path.join(process.cwd(), "data");
const AGREEMENTS_FILE = path.join(DATA_DIR, "agreements.json");

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGREEMENTS_FILE)) {
    const initial = [
      {
        ...SAMPLE_RENOVATION_AGREEMENT,
        id: "agm-agr-01147-r3",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(AGREEMENTS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllAgreements(): AgreementDocumentData[] {
  try {
    ensureStorage();
    const raw = fs.readFileSync(AGREEMENTS_FILE, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Error reading agreements storage:", err);
    return [];
  }
}

export function getAgreementById(id: string): AgreementDocumentData | null {
  const all = getAllAgreements();
  return all.find((a) => a.id === id) || null;
}

export function saveAgreement(
  data: Partial<AgreementDocumentData> & { title?: string; refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): AgreementDocumentData {
  ensureStorage();
  const all = getAllAgreements();
  const now = new Date().toISOString();

  let targetId = data.id;
  if (!targetId) {
    targetId = `agr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const existingIdx = all.findIndex((a) => a.id === targetId || a.refNumber === data.refNumber);

  const mergedRecord: AgreementDocumentData = {
    ...SAMPLE_RENOVATION_AGREEMENT,
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

  fs.writeFileSync(AGREEMENTS_FILE, JSON.stringify(all, null, 2), "utf-8");
  return mergedRecord;
}

export function deleteAgreement(id: string): boolean {
  ensureStorage();
  const all = getAllAgreements();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  fs.writeFileSync(AGREEMENTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}
