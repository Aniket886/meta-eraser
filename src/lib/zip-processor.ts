import JSZip from "jszip";
import { extractMetadata, cleanFile, type MetadataMap } from "./metadata";
import { generateAuditReport, type AuditReport } from "./audit";
import type { PrivacySettings } from "./privacy-settings";

export interface ZipEntry {
  name: string;
  type: string;
  size: number;
  metadata?: MetadataMap;
  metadataBefore?: MetadataMap;
  auditReport?: AuditReport;
  supported: boolean;
  warnings?: string[];
}

export interface ZipResult {
  entries: ZipEntry[];
  cleanedBlob: Blob;
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function isZip(file: File): boolean {
  return file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.toLowerCase().endsWith(".zip");
}

export async function processZip(
  file: File,
  settings?: PrivacySettings,
  onProgress?: (current: number, total: number) => void
): Promise<ZipResult> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const outputZip = new JSZip();
  const entries: ZipEntry[] = [];

  const fileEntries: { name: string; zipObj: JSZip.JSZipObject }[] = [];
  zip.forEach((path, obj) => {
    if (!obj.dir) fileEntries.push({ name: path, zipObj: obj });
  });

  const total = fileEntries.length;

  for (let i = 0; i < fileEntries.length; i++) {
    const { name, zipObj } = fileEntries[i];
    onProgress?.(i + 1, total);
    const ext = getExtension(name);
    const mimeType = SUPPORTED_EXTENSIONS[ext];

    if (!mimeType) {
      // Unsupported — copy as-is
      const data = await zipObj.async("uint8array");
      outputZip.file(name, data);
      entries.push({ name, type: ext, size: data.length, supported: false });
      continue;
    }

    try {
      const data = await zipObj.async("arraybuffer");
      const innerFile = new File([data], name.split("/").pop() || name, { type: mimeType });
      const { metadata, warnings } = await extractMetadata(innerFile);
      const metadataBefore = { ...metadata };

      const cleanedBlob = await cleanFile(innerFile, settings);
      const cleanedFile = new File([cleanedBlob], innerFile.name, { type: mimeType });
      const { metadata: afterMeta } = await extractMetadata(cleanedFile);
      const auditReport = generateAuditReport(name, mimeType, innerFile.size, metadataBefore, afterMeta);

      const cleanedData = await cleanedBlob.arrayBuffer();
      outputZip.file(name, new Uint8Array(cleanedData));

      entries.push({
        name, type: mimeType, size: innerFile.size,
        metadata: afterMeta, metadataBefore, auditReport,
        supported: true, warnings,
      });
    } catch {
      // On error, copy original
      const data = await zipObj.async("uint8array");
      outputZip.file(name, data);
      entries.push({ name, type: mimeType, size: data.length, supported: true, warnings: ["Failed to process."] });
    }
  }

  const cleanedZipBlob = await outputZip.generateAsync({ type: "blob" });
  return { entries, cleanedBlob: new Blob([cleanedZipBlob], { type: "application/zip" }) };
}
