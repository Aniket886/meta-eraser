import type { MetadataMap } from "./metadata";

export interface AuditField {
  name: string;
  originalValue: string;
  afterValue: string;
  status: "removed" | "kept";
  reason?: string;
}

export interface AuditReport {
  filename: string;
  type: string;
  size: number;
  cleanedAt: string;
  fields: AuditField[];
  summary: { removed: number; kept: number };
}

export function generateAuditReport(
  filename: string,
  type: string,
  size: number,
  metadataBefore: MetadataMap,
  metadataAfter: MetadataMap
): AuditReport {
  const fields: AuditField[] = [];
  let removed = 0;
  let kept = 0;

  for (const [key, before] of Object.entries(metadataBefore)) {
    const after = metadataAfter[key];
    const wasRemoved = !after || after.value === "" || after.value !== before.value;

    if (before.removable && wasRemoved) {
      fields.push({ name: key, originalValue: before.value, status: "removed" });
      removed++;
    } else {
      fields.push({
        name: key,
        originalValue: before.value,
        status: "kept",
        reason: before.removable ? "Value unchanged" : "Structural data",
      });
      kept++;
    }
  }

  return {
    filename,
    type,
    size,
    cleanedAt: new Date().toISOString(),
    fields,
    summary: { removed, kept },
  };
}

export function downloadAuditReport(report: AuditReport) {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.filename}_audit.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBatchAuditReport(reports: AuditReport[]) {
  const json = JSON.stringify(reports, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metaclean_audit_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
