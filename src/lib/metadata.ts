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

// ── MIME helpers ──
const OOXML_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function isOoxml(type: string) { return OOXML_TYPES.has(type); }
function isImage(type: string) { return type === "image/jpeg" || type === "image/png"; }
function isPdf(type: string) { return type === "application/pdf"; }
function isMp3(type: string) { return type === "audio/mpeg" || type === "audio/mp3"; }
function isMp4(type: string) { return type === "video/mp4" || type === "video/quicktime"; }

// ── Extract ──

export async function extractMetadata(file: File): Promise<{
  metadata: MetadataMap;
  warnings: string[];
}> {
  if (isImage(file.type)) return extractImageMetadata(file);
  if (isPdf(file.type)) return extractPdfMetadata(file);
  if (isOoxml(file.type)) return extractOoxmlMetadata(file);
  if (isMp3(file.type)) return extractMp3Metadata(file);
  if (isMp4(file.type)) return extractMp4Metadata(file);
  return { metadata: {}, warnings: ["Unsupported file type."] };
}

async function extractImageMetadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const data = await exifr.parse(file, {
      gps: true, exif: true, iptc: true, tiff: true,
      icc: false, jfif: false, ihdr: false,
    });

    if (!data || Object.keys(data).length === 0) {
      return { metadata: {}, warnings: ["No metadata found in this image."] };
    }

    const nonRemovableFound: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      const strVal = val instanceof Date ? val.toISOString()
        : typeof val === "object" ? JSON.stringify(val)
        : String(val);
      const removable = !NON_REMOVABLE_IMAGE_FIELDS.has(key);
      metadata[key] = { value: strVal, removable };
      if (!removable) nonRemovableFound.push(key);
    }

    if (nonRemovableFound.length) {
      warnings.push(`${nonRemovableFound.join(", ")} cannot be removed (structural data).`);
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

    metadata["Page Count"] = { value: String(pdf.getPageCount()), removable: false };

    for (const [key, val] of Object.entries(fields)) {
      if (val) metadata[key] = { value: val, removable: true };
    }

    if (Object.keys(metadata).length <= 1) warnings.push("No removable metadata found in this PDF.");
    warnings.push("Page Count cannot be removed (structural data).");
  } catch {
    warnings.push("Could not parse PDF metadata.");
  }

  return { metadata, warnings };
}

async function extractOoxmlMetadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const coreXml = await zip.file("docProps/core.xml")?.async("text");
    if (coreXml) {
      const doc = new DOMParser().parseFromString(coreXml, "application/xml");
      const coreFields = [
        { tag: "dc:title", label: "Title" },
        { tag: "dc:creator", label: "Author" },
        { tag: "dc:subject", label: "Subject" },
        { tag: "dc:description", label: "Description" },
        { tag: "cp:lastModifiedBy", label: "Last Modified By" },
        { tag: "cp:revision", label: "Revision" },
        { tag: "dcterms:created", label: "Created Date" },
        { tag: "dcterms:modified", label: "Modified Date" },
      ];
      for (const { tag, label } of coreFields) {
        const el = doc.getElementsByTagName(tag)[0];
        if (el?.textContent) metadata[label] = { value: el.textContent, removable: true };
      }
    }

    const appXml = await zip.file("docProps/app.xml")?.async("text");
    if (appXml) {
      const doc = new DOMParser().parseFromString(appXml, "application/xml");
      const appFields = [
        { tag: "Application", label: "Application" },
        { tag: "AppVersion", label: "App Version" },
        { tag: "Company", label: "Company" },
        { tag: "Pages", label: "Page Count" },
        { tag: "Words", label: "Word Count" },
        { tag: "Slides", label: "Slide Count" },
      ];
      for (const { tag, label } of appFields) {
        const el = doc.getElementsByTagName(tag)[0];
        if (el?.textContent) {
          const structural = ["Pages", "Words", "Slides"].includes(tag);
          metadata[label] = { value: el.textContent, removable: !structural };
        }
      }
    }

    const nonRemovable = Object.entries(metadata).filter(([, v]) => !v.removable).map(([k]) => k);
    if (nonRemovable.length) warnings.push(`${nonRemovable.join(", ")} cannot be removed (structural data).`);
    if (Object.keys(metadata).length === 0) warnings.push("No metadata found in this document.");
  } catch {
    warnings.push("Could not parse document metadata.");
  }

  return { metadata, warnings };
}

async function extractMp3Metadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const { default: MP3Tag } = await import("mp3tag.js");
    const buffer = await file.arrayBuffer();
    const mp3tag = new MP3Tag(buffer);
    mp3tag.read();

    if (mp3tag.error) {
      warnings.push(`MP3 parse warning: ${mp3tag.error}`);
    }

    const tags = mp3tag.tags;
    const fieldMap: Record<string, string> = {
      title: "Title", artist: "Artist", album: "Album",
      year: "Year", genre: "Genre", comment: "Comment",
    };

    for (const [key, label] of Object.entries(fieldMap)) {
      const val = tags[key];
      if (val && String(val).trim()) {
        metadata[label] = { value: String(val), removable: true };
      }
    }

    // Check for album art
    if (tags.v2?.APIC?.length) {
      metadata["Album Art"] = { value: `${tags.v2.APIC.length} image(s)`, removable: true };
    }

    if (Object.keys(metadata).length === 0) warnings.push("No ID3 tags found in this MP3.");
  } catch {
    warnings.push("Could not parse MP3 metadata.");
  }

  return { metadata, warnings };
}

async function extractMp4Metadata(
  file: File
): Promise<{ metadata: MetadataMap; warnings: string[] }> {
  const metadata: MetadataMap = {};
  const warnings: string[] = [];

  try {
    const MP4Box = await import("mp4box");
    const buffer = await file.arrayBuffer();
    (buffer as any).fileStart = 0;

    const mp4boxFile = MP4Box.createFile();

    await new Promise<void>((resolve, reject) => {
      mp4boxFile.onReady = (info: any) => {
        try {
          // Structural (non-removable)
          if (info.duration && info.timescale) {
            metadata["Duration"] = { value: `${(info.duration / info.timescale).toFixed(1)}s`, removable: false };
          }
          if (info.brands?.length) {
            metadata["Brand"] = { value: info.brands.join(", "), removable: false };
          }

          // Track info
          for (const track of info.tracks || []) {
            const prefix = track.type === "video" ? "Video" : track.type === "audio" ? "Audio" : track.type;
            if (track.codec) metadata[`${prefix} Codec`] = { value: track.codec, removable: false };
            if (track.type === "video" && track.video) {
              metadata["Resolution"] = { value: `${track.video.width}x${track.video.height}`, removable: false };
            }
          }

          // Creation time from moov (removable)
          if (info.created && info.created.getTime() > 0) {
            metadata["Creation Date"] = { value: info.created.toISOString(), removable: true };
          }
          if (info.modified && info.modified.getTime() > 0) {
            metadata["Modification Date"] = { value: info.modified.toISOString(), removable: true };
          }

          resolve();
        } catch (e) {
          reject(e);
        }
      };
      mp4boxFile.onError = () => reject(new Error("MP4Box parse error"));
      mp4boxFile.appendBuffer(buffer as any);
      mp4boxFile.flush();
    });

    warnings.push("Video metadata cleaning has limitations — some fields require server-side re-muxing.");
    if (Object.keys(metadata).length === 0) warnings.push("No metadata found in this video.");
  } catch {
    warnings.push("Could not parse video metadata.");
  }

  return { metadata, warnings };
}

// ── Clean ──

export async function cleanFile(file: File, _settings?: import("./privacy-settings").PrivacySettings): Promise<Blob> {
  // Settings are used for selective stripping — currently the clean functions
  // strip everything; settings integration is handled at the caller level
  // by checking shouldStripField before deciding to clean.
  if (isImage(file.type)) return cleanImage(file);
  if (isPdf(file.type)) return cleanPdf(file);
  if (isOoxml(file.type)) return cleanOoxml(file);
  if (isMp3(file.type)) return cleanMp3(file);
  if (isMp4(file.type)) return cleanMp4(file);
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
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        mimeType,
        mimeType === "image/jpeg" ? 0.95 : undefined
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

async function cleanPdf(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject("");
  pdf.setCreator(""); pdf.setProducer(""); pdf.setKeywords([]);
  const saved = await pdf.save();
  return new Blob([saved.buffer as ArrayBuffer], { type: "application/pdf" });
}

async function cleanOoxml(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const coreFile = zip.file("docProps/core.xml");
  if (coreFile) {
    const coreXml = await coreFile.async("text");
    const doc = new DOMParser().parseFromString(coreXml, "application/xml");
    for (const tag of ["dc:title", "dc:creator", "dc:subject", "dc:description", "cp:lastModifiedBy", "cp:keywords", "cp:category"]) {
      const el = doc.getElementsByTagName(tag)[0];
      if (el) el.textContent = "";
    }
    zip.file("docProps/core.xml", new XMLSerializer().serializeToString(doc));
  }

  const appFile = zip.file("docProps/app.xml");
  if (appFile) {
    const appXml = await appFile.async("text");
    const doc = new DOMParser().parseFromString(appXml, "application/xml");
    for (const tag of ["Application", "AppVersion", "Company", "Manager"]) {
      const el = doc.getElementsByTagName(tag)[0];
      if (el) el.textContent = "";
    }
    zip.file("docProps/app.xml", new XMLSerializer().serializeToString(doc));
  }

  const output = await zip.generateAsync({ type: "blob" });
  return new Blob([output], { type: file.type });
}

async function cleanMp3(file: File): Promise<Blob> {
  const { default: MP3Tag } = await import("mp3tag.js");
  const buffer = await file.arrayBuffer();
  const mp3tag = new MP3Tag(buffer);
  mp3tag.read();

  // Remove all tags
  mp3tag.tags.title = "";
  mp3tag.tags.artist = "";
  mp3tag.tags.album = "";
  mp3tag.tags.year = "";
  mp3tag.tags.genre = "";
  mp3tag.tags.comment = "";
  if (mp3tag.tags.v2) {
    mp3tag.tags.v2.APIC = [];
  }
  if (mp3tag.tags.v1) {
    mp3tag.tags.v1.title = "";
    mp3tag.tags.v1.artist = "";
    mp3tag.tags.v1.album = "";
    mp3tag.tags.v1.year = "";
    mp3tag.tags.v1.genre = "";
    mp3tag.tags.v1.comment = "";
  }

  const saved = mp3tag.save({ id3v1: { include: false }, id3v2: { include: false } });
  return new Blob([new Uint8Array(saved as any)], { type: "audio/mpeg" });
}

async function cleanMp4(_file: File): Promise<Blob> {
  // Client-side MP4 metadata stripping is very limited without re-muxing.
  // Return the original file with a warning — full cleaning needs server-side.
  const buffer = await _file.arrayBuffer();
  return new Blob([buffer], { type: _file.type });
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
