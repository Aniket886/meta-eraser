export interface PrivacySettings {
  stripGps: boolean;
  stripAuthor: boolean;
  stripDates: boolean;
  stripCamera: boolean;
  stripSoftware: boolean;
  stripComments: boolean;
  stripAlbumArt: boolean;
  retentionMinutes: number;
}

export const DEFAULT_SETTINGS: PrivacySettings = {
  stripGps: true,
  stripAuthor: true,
  stripDates: true,
  stripCamera: true,
  stripSoftware: true,
  stripComments: true,
  stripAlbumArt: true,
  retentionMinutes: 60,
};

export const PRESETS: Record<string, { label: string; description: string; settings: Partial<PrivacySettings> }> = {
  enterprise: {
    label: "Enterprise",
    description: "Strip everything — maximum privacy.",
    settings: {
      stripGps: true, stripAuthor: true, stripDates: true,
      stripCamera: true, stripSoftware: true, stripComments: true, stripAlbumArt: true,
    },
  },
  minimal: {
    label: "Minimal",
    description: "Only GPS and author — keep the rest.",
    settings: {
      stripGps: true, stripAuthor: true, stripDates: false,
      stripCamera: false, stripSoftware: false, stripComments: false, stripAlbumArt: false,
    },
  },
};

const STORAGE_KEY = "metaclean-privacy-settings";

export function loadSettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: PrivacySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function exportSettings(settings: PrivacySettings): string {
  return JSON.stringify(settings, null, 2);
}

export function importSettings(json: string): PrivacySettings {
  const parsed = JSON.parse(json);
  return { ...DEFAULT_SETTINGS, ...parsed };
}

/** Field-category mapping for selective stripping */
const GPS_FIELDS = new Set(["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef", "latitude", "longitude"]);
const AUTHOR_FIELDS = new Set(["Author", "Creator", "Last Modified By", "Artist", "Company", "dc:creator", "cp:lastModifiedBy"]);
const DATE_FIELDS = new Set(["Creation Date", "Modification Date", "Created Date", "Modified Date", "DateTimeOriginal", "CreateDate", "ModifyDate", "Year"]);
const CAMERA_FIELDS = new Set(["Make", "Model", "LensModel", "FocalLength", "ExposureTime", "FNumber", "ISO", "ISOSpeedRatings", "ShutterSpeedValue", "ApertureValue"]);
const SOFTWARE_FIELDS = new Set(["Software", "Application", "App Version", "Producer", "Creator"]);
const COMMENT_FIELDS = new Set(["Comment", "UserComment", "Description", "Subject", "Title", "dc:description", "dc:subject"]);
const ALBUM_ART_FIELDS = new Set(["Album Art"]);

export function shouldStripField(fieldName: string, settings: PrivacySettings): boolean {
  if (GPS_FIELDS.has(fieldName) && !settings.stripGps) return false;
  if (AUTHOR_FIELDS.has(fieldName) && !settings.stripAuthor) return false;
  if (DATE_FIELDS.has(fieldName) && !settings.stripDates) return false;
  if (CAMERA_FIELDS.has(fieldName) && !settings.stripCamera) return false;
  if (SOFTWARE_FIELDS.has(fieldName) && !settings.stripSoftware) return false;
  if (COMMENT_FIELDS.has(fieldName) && !settings.stripComments) return false;
  if (ALBUM_ART_FIELDS.has(fieldName) && !settings.stripAlbumArt) return false;
  return true;
}
