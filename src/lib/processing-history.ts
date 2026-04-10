const STORAGE_KEY = "metaclean_processing_history";

export interface ProcessingRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cleanedAt: string;
  fieldsRemoved: number;
}

export function getHistory(): ProcessingRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<ProcessingRecord, "id" | "cleanedAt">) {
  const records = getHistory();
  records.unshift({
    ...entry,
    id: crypto.randomUUID(),
    cleanedAt: new Date().toISOString(),
  });
  // Keep last 100 entries
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
