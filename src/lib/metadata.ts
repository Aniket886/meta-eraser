import exifr from "exifr";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export interface MetadataField {
  value: string;
  removable: boolean;
}

export type MetadataMap = Record<string, MetadataField>;

// ── EXIF fields that are non-removable (structural) ──
const NON_REMOVABLE_IMAGE_FIELDS = new Set([
  "ImageWidth", "ImageHeight", "ColorSpace", "BitsPerSample",
  "PixelXDimension", "PixelYDimension",
]);

// ── Extract ──

export async function extractMetadata(file: File): Promise<{
  metadata: MetadataMap;
  warnings: string[];
}> {
  const type = file.type;
  if (type === "image/jpeg" || type === "image/png") {
    return extractImageMetadata(file);
  }
  if (type === "application/pdf") {
    return extractPdfMetadata(file);
  }
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxMetadata(file);
  }
  return { metadata: {}, warnings: ["Unsupported file type."] };
}

async function extractImageMetadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const data = await exifr.parse(file, {
      gps: true,
      exif: true,
      iptc: true,
      tiff: true,
      icc: false,
      jfif: false,
      ihdr: false,
    });

    if (!data || Object.keys(data).length === 0) {
      return { metadata: {}, warnings: ["No metadata found in this image."] };
    }

    const nonRemovableFound: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      const strVal =
        val instanceof Date
          ? val.toISOString()
          : typeof val === "object"
          ? JSON.stringify(val)
          : String(val);
      const removable = !NON_REMOVABLE_IMAGE_FIELDS.has(key);
      metadata[key] = { value: strVal, removable };
      if (!removable) nonRemovableFound.push(key);
    }

    if (nonRemovableFound.length) {
      warnings.push(
        `${nonRemovableFound.join(", ")} cannot be removed (structural data).`
      );
    }
  } catch {
    warnings.push("Could not parse image metadata.");
  }

  return { metadata, warnings };
}

async function extractPdfMetadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

    const fields: Record<string, string | undefined> = {
      Title: pdf.getTitle(),
      Author: pdf.getAuthor(),
      Subject: pdf.getSubject(),
      Creator: pdf.getCreator(),
      Producer: pdf.getProducer(),
      "Creation Date": pdf.getCreationDate()?.toISOString(),
      "Modification Date": pdf.getModificationDate()?.toISOString(),
    };

    const pageCount = pdf.getPageCount();
    metadata["Page Count"] = { value: String(pageCount), removable: false };

    for (const [key, val] of Object.entries(fields)) {
      if (val) {
        metadata[key] = { value: val, removable: true };
      }
    }

    if (Object.keys(metadata).length <= 1) {
      warnings.push("No removable metadata found in this PDF.");
    }
    warnings.push("Page Count cannot be removed (structural data).");
  } catch {
    warnings.push("Could not parse PDF metadata.");
  }

  return { metadata, warnings };
}

async function extractDocxMetadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    // Parse core.xml
    const coreXml = await zip.file("docProps/core.xml")?.async("text");
    if (coreXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(coreXml, "application/xml");

      const fields = [
        { tag: "dc:title", label: "Title" },
        { tag: "dc:creator", label: "Author" },
        { tag: "dc:subject", label: "Subject" },
        { tag: "dc:description", label: "Description" },
        { tag: "cp:lastModifiedBy", label: "Last Modified By" },
        { tag: "cp:revision", label: "Revision" },
        { tag: "dcterms:created", label: "Created Date" },
        { tag: "dcterms:modified", label: "Modified Date" },
      ];

      for (const { tag, label } of fields) {
        const el = doc.getElementsByTagName(tag)[0];
        if (el?.textContent) {
          metadata[label] = { value: el.textContent, removable: true };
        }
      }
    }

    // Parse app.xml
    const appXml = await zip.file("docProps/app.xml")?.async("text");
    if (appXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(appXml, "application/xml");

      const appFields = [
        { tag: "Application", label: "Application" },
        { tag: "AppVersion", label: "App Version" },
        { tag: "Company", label: "Company" },
        { tag: "Pages", label: "Page Count" },
        { tag: "Words", label: "Word Count" },
      ];

      for (const { tag, label } of appFields) {
        const el = doc.getElementsByTagName(tag)[0];
        if (el?.textContent) {
          const structural = tag === "Pages" || tag === "Words";
          metadata[label] = {
            value: el.textContent,
            removable: !structural,
          };
        }
      }
    }

    const nonRemovable = Object.entries(metadata)
      .filter(([, v]) => !v.removable)
      .map(([k]) => k);
    if (nonRemovable.length) {
      warnings.push(
        `${nonRemovable.join(", ")} cannot be removed (structural data).`
      );
    }
    if (Object.keys(metadata).length === 0) {
      warnings.push("No metadata found in this document.");
    }
  } catch {
    warnings.push("Could not parse DOCX metadata.");
  }

  return { metadata, warnings };
}

// ── Clean ──

export async function cleanFile(file: File): Promise<Blob> {
  const type = file.type;
  if (type === "image/jpeg" || type === "image/png") {
    return cleanImage(file);
  }
  if (type === "application/pdf") {
    return cleanPdf(file);
  }
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return cleanDocx(file);
  }
  throw new Error("Unsupported file type");
}

function cleanImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        mimeType,
        mimeType === "image/jpeg" ? 0.95 : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

async function cleanPdf(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setCreator("");
  pdf.setProducer("");
  pdf.setKeywords([]);

  const saved = await pdf.save();
  return new Blob([saved.buffer as ArrayBuffer], { type: "application/pdf" });
}

async function cleanDocx(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Clear core.xml
  const coreFile = zip.file("docProps/core.xml");
  if (coreFile) {
    const coreXml = await coreFile.async("text");
    const parser = new DOMParser();
    const doc = parser.parseFromString(coreXml, "application/xml");
    const clearTags = [
      "dc:title", "dc:creator", "dc:subject", "dc:description",
      "cp:lastModifiedBy", "cp:keywords", "cp:category",
    ];
    for (const tag of clearTags) {
      const el = doc.getElementsByTagName(tag)[0];
      if (el) el.textContent = "";
    }
    const serializer = new XMLSerializer();
    zip.file("docProps/core.xml", serializer.serializeToString(doc));
  }

  // Clear app.xml
  const appFile = zip.file("docProps/app.xml");
  if (appFile) {
    const appXml = await appFile.async("text");
    const parser = new DOMParser();
    const doc = parser.parseFromString(appXml, "application/xml");
    const clearTags = ["Application", "AppVersion", "Company", "Manager"];
    for (const tag of clearTags) {
      const el = doc.getElementsByTagName(tag)[0];
      if (el) el.textContent = "";
    }
    const serializer = new XMLSerializer();
    zip.file("docProps/app.xml", serializer.serializeToString(doc));
  }

  const output = await zip.generateAsync({ type: "blob" });
  return new Blob([output], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// ── Download helper ──

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
