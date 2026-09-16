import fs from "fs";
import path from "path";
import {
  MethodStatementDocumentData,
  SAMPLE_METHOD_STATEMENT,
} from "@/components/documents/method-statement-constants";

const DATA_DIR = path.join(process.cwd(), "data");
const METHOD_FILE = path.join(DATA_DIR, "method-statements.json");

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(METHOD_FILE)) {
    const initial = [
      {
        ...SAMPLE_METHOD_STATEMENT,
        id: "ms-01200-r2",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(METHOD_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllMethodStatements(): MethodStatementDocumentData[] {
  try {
    ensureStorage();
    const raw = fs.readFileSync(METHOD_FILE, "utf-8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Error reading method statements storage:", err);
    return [];
  }
}

export function getMethodStatementById(id: string): MethodStatementDocumentData | null {
  const all = getAllMethodStatements();
  return all.find((a) => a.id === id) || null;
}

export function saveMethodStatement(
  data: Partial<MethodStatementDocumentData> & { refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): MethodStatementDocumentData {
  ensureStorage();
  const all = getAllMethodStatements();
  const now = new Date().toISOString();

  let targetId = data.id;
  if (!targetId) {
    targetId = `ms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const existingIdx = all.findIndex(
    (a) => a.id === targetId || a.refNumber === data.refNumber,
  );

  const mergedRecord: MethodStatementDocumentData = {
    ...SAMPLE_METHOD_STATEMENT,
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

  fs.writeFileSync(METHOD_FILE, JSON.stringify(all, null, 2), "utf-8");
  return mergedRecord;
}

export function deleteMethodStatement(id: string): boolean {
  ensureStorage();
  const all = getAllMethodStatements();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  fs.writeFileSync(METHOD_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}
