import fs from "fs";
import path from "path";
import os from "os";
import {
  MethodStatementDocumentData,
  SAMPLE_METHOD_STATEMENT,
} from "@/components/documents/method-statement-constants";

declare global {
  // eslint-disable-next-line no-var
  var __agm_method_cache: MethodStatementDocumentData[] | undefined;
}

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "agm_data");

function getStoragePath(): string {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    return path.join(LOCAL_DATA_DIR, "method-statements.json");
  } catch {
    try {
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
      }
      return path.join(TMP_DATA_DIR, "method-statements.json");
    } catch {
      return path.join(os.tmpdir(), "method-statements.json");
    }
  }
}

function getInitialMethodStatements(): MethodStatementDocumentData[] {
  return [
    {
      ...SAMPLE_METHOD_STATEMENT,
      id: "ms-01147-r3",
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getAllMethodStatements(): MethodStatementDocumentData[] {
  if (global.__agm_method_cache && global.__agm_method_cache.length > 0) {
    return global.__agm_method_cache;
  }

  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        global.__agm_method_cache = list;
        return list;
      }
    }
  } catch (err) {
    console.warn("Could not read method statements from filesystem, using initial preset:", err);
  }

  const initial = getInitialMethodStatements();
  global.__agm_method_cache = initial;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), "utf-8");
  } catch {
    // Read-only filesystem fallback
  }
  return initial;
}

export function getMethodStatementById(id: string): MethodStatementDocumentData | null {
  const all = getAllMethodStatements();
  return all.find((a) => a.id === id) || null;
}

export function saveMethodStatement(
  data: Partial<MethodStatementDocumentData> & { refNumber: string },
  authUser?: { id: string; fullName: string; email: string } | null,
): MethodStatementDocumentData {
  const all = [...getAllMethodStatements()];
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

  global.__agm_method_cache = all;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist method statement to disk (running in read-only environment), cached in memory:", err);
  }

  return mergedRecord;
}

export function deleteMethodStatement(id: string): boolean {
  const all = getAllMethodStatements();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  global.__agm_method_cache = filtered;

  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist deleted method statement to disk, updated in memory:", err);
  }

  return true;
}
