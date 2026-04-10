

# Phase 3: PWA Offline Mode, ZIP Batch Processing, Enterprise Privacy Controls

## Overview

Three features that make MetaClean work offline, handle ZIP archives, and give enterprises fine-grained control over what metadata gets removed.

## 1. PWA — Installable Offline App

Since all processing is already client-side, the app is a natural fit for PWA. No service workers needed for basic installability.

**Approach**: Simple manifest + install prompt page (no `vite-plugin-pwa` or service workers, which cause issues in the Lovable preview).

- Add `public/manifest.json` with app name, icons, `display: "standalone"`, theme color `#0a0a1a`
- Add manifest link + mobile meta tags to `index.html`
- Create `src/pages/Install.tsx` — an `/install` page with platform-specific install instructions and a "Install App" button that triggers the `beforeinstallprompt` event
- Add install link to Navbar
- Generate PWA icons (192x192, 512x512) as simple SVG-based PNGs in `public/`

**Result**: Users can install MetaClean to their home screen. All processing works offline since it's fully client-side.

## 2. ZIP Batch Processing

Accept `.zip` files, extract contents, process each supported file inside, then offer a cleaned ZIP download.

- Add `application/zip` and `.zip` to `FileDropZone` accepted types
- Add `isZip()` helper to `metadata.ts`
- Create `src/lib/zip-processor.ts`:
  - `extractZip(file: File)` — uses existing `jszip` to list and extract files
  - `processZip(file: File)` — iterates entries, runs `extractMetadata` + `cleanFile` on each supported file, skips unsupported, repacks into a new ZIP
  - Returns per-file audit data + cleaned ZIP blob
- Update `Dashboard.tsx`:
  - When a ZIP is dropped, show it as a parent job with expandable child entries
  - "Clean" on a ZIP cleans all supported files inside and produces a cleaned ZIP
  - Audit report includes per-file breakdown within the ZIP

## 3. Enterprise Privacy Controls

A settings panel that lets users choose which metadata categories to strip (or keep). Stored in `localStorage`.

- Create `src/lib/privacy-settings.ts`:
  - Interface `PrivacySettings` with toggles: `stripGps`, `stripAuthor`, `stripDates`, `stripCamera`, `stripSoftware`, `stripComments`, `stripAlbumArt`
  - Default: all enabled (strip everything)
  - `loadSettings()` / `saveSettings()` using localStorage
- Create `src/pages/Settings.tsx` — `/settings` route:
  - Toggle switches for each category with descriptions
  - "Enterprise" preset (strip all), "Minimal" preset (GPS + author only), "Custom"
  - Data retention control: adjust auto-delete timer (15min / 30min / 1hr / immediate)
  - Export/import settings as JSON for team sharing
- Update `cleanFile()` in `metadata.ts` to accept `PrivacySettings` and selectively strip fields
- Update `Dashboard.tsx` to load settings and pass them to clean functions
- Add Settings link to Navbar

## Files Changed/Created

| File | Change |
|------|--------|
| `public/manifest.json` | New — PWA manifest |
| `public/icon-192.svg`, `public/icon-512.svg` | New — PWA icons |
| `index.html` | Add manifest link, mobile meta tags |
| `src/pages/Install.tsx` | New — install instructions page |
| `src/lib/zip-processor.ts` | New — ZIP extract/clean/repack logic |
| `src/lib/privacy-settings.ts` | New — settings interface + localStorage |
| `src/pages/Settings.tsx` | New — enterprise privacy controls UI |
| `src/lib/metadata.ts` | Update `cleanFile` to accept privacy settings for selective stripping |
| `src/components/FileDropZone.tsx` | Add `.zip` to accepted types |
| `src/pages/Dashboard.tsx` | ZIP job handling, pass privacy settings to clean |
| `src/components/Navbar.tsx` | Add Settings + Install links |
| `src/App.tsx` | Add `/settings` and `/install` routes |
| `src/pages/Index.tsx` | Update features list |

## Dependencies

No new dependencies needed — `jszip` already handles ZIP files, and PWA uses a simple manifest without `vite-plugin-pwa`.

