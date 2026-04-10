

# Phase 2: New File Types, Batch Operations, API Access, Audit Reports

## What Gets Built

### 1. New File Type Support (MP3, MP4, MOV, XLSX, PPTX)

**MP3** — use `mp3tag.js` library
- Extract: ID3v1/v2 tags (title, artist, album, year, genre, comment, album art reference)
- Clean: Remove all ID3 tags by saving with `id3v2: { include: false }`, `id3v1: { include: false }`
- Non-removable: duration, bitrate (structural)

**MP4/MOV** — use `mp4box.js` library
- Extract: Parse moov box for creation date, encoder, GPS, title from udta/meta atoms
- Clean: Cannot reliably strip moov metadata client-side without re-muxing. Strategy: extract and display metadata, warn user that video metadata cleaning has limitations, strip what we can from the udta box
- Non-removable: codec, resolution, duration, framerate

**XLSX** — already using `jszip` (OOXML format, same as DOCX)
- Extract: Parse `docProps/core.xml` and `docProps/app.xml` (author, title, company, dates)
- Clean: Same approach as DOCX — rewrite XML properties with empty values

**PPTX** — same OOXML approach as DOCX/XLSX
- Extract/Clean: Identical to DOCX (same ZIP + docProps structure)

### 2. Batch Upload & "Clean All"
- Update `FileDropZone` accepted types to include `.mp3, .mp4, .mov, .xlsx, .pptx`
- Add a "Clean All" button in the Dashboard header that cleans all scanned files at once
- Add a "Download All" button that triggers sequential downloads of all cleaned files
- Show batch progress (e.g., "Cleaning 3 of 7 files...")

### 3. API Access Page
- New `/api` route with documentation page
- Provide a simple REST-like interface using browser-local processing (no backend needed)
- Show code snippets (curl, JS fetch) for how to use MetaClean programmatically
- Since there's no backend yet, this is a **documentation page** describing the planned API endpoints
- Endpoints documented: `POST /api/scan`, `POST /api/clean`, `GET /api/download/:id`

### 4. Audit Report
- After cleaning, generate a structured audit report per file showing:
  - File name, type, size, timestamp
  - Table of all fields found: field name, original value, status (removed/kept), reason if kept
  - Summary: X fields removed, Y fields kept (structural)
- "Download Audit Report" button generates a JSON file (or formatted text)
- Add a "Download All Reports" button for batch audit export
- Store `metadataBefore` separately from `metadata` on the FileJob so we can show the diff

## New Dependencies
- `mp3tag.js` — MP3 ID3 tag read/write/remove
- `mp4box` — MP4/MOV metadata parsing

## Files Changed/Created

| File | Change |
|------|--------|
| `src/lib/metadata.ts` | Add extract/clean functions for MP3, MP4/MOV, XLSX, PPTX |
| `src/lib/audit.ts` | New — audit report generation (JSON export) |
| `src/components/FileDropZone.tsx` | Expand accepted types and update label |
| `src/pages/Dashboard.tsx` | Add batch actions, audit report buttons, store before/after metadata |
| `src/pages/ApiDocs.tsx` | New — API documentation page |
| `src/App.tsx` | Add `/api` route |
| `src/components/Navbar.tsx` | Add API Docs link |
| `src/pages/Index.tsx` | Update features list with new file types |

## Technical Details

**FileJob interface changes:**
- Add `metadataBefore?: MetadataMap` to preserve pre-clean state
- On clean: save current metadata as `metadataBefore`, then update `metadata` with post-clean scan

**Audit report structure:**
```text
{
  filename, type, size, cleanedAt,
  fields: [
    { name, originalValue, status: "removed"|"kept", reason? }
  ],
  summary: { removed: N, kept: N }
}
```

**MP4/MOV limitation:** Full metadata stripping of video containers requires re-muxing which is expensive client-side. We'll extract and display all metadata, clean what's accessible (udta atoms), and warn about fields that can't be removed without server-side processing.

