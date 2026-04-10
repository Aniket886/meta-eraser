

# Phase 1: Client-Side Metadata Processing

Since Supabase isn't enabled yet, all Phase 1 features will work entirely in the browser — no backend needed.

## What Gets Built

### 1. Real Metadata Extraction
- **JPEG/PNG**: Use `exifr` library to extract EXIF data (GPS, camera, author, dates, software)
- **PDF**: Use `pdf-lib` to read document properties (title, author, creator, dates, producer)
- **DOCX**: Parse the ZIP structure, read `docProps/core.xml` and `docProps/app.xml` for properties (author, title, dates, revision count, application)

### 2. One-Click Clean
- **JPEG/PNG**: Redraw image on a `<canvas>` element — this naturally strips all EXIF/metadata while preserving image quality
- **PDF**: Use `pdf-lib` to create a copy with metadata fields cleared
- **DOCX**: Unzip with `JSZip`, rewrite `core.xml` and `app.xml` with empty values, rezip

### 3. Download Cleaned File
- Generate a Blob from the cleaned file and trigger browser download

### 4. Auto-Delete After 1 Hour
- Store file references with timestamps in component state
- Run a `setInterval` timer that removes files older than 1 hour
- Show remaining time on each file

### 5. Dashboard Wiring
- Replace mock metadata with real extracted data
- Wire Clean button to actual cleaning logic
- Wire Download button to trigger file save
- Show scanning/cleaning progress states with transitions

## New Dependencies
- `exifr` — EXIF extraction for images
- `pdf-lib` — PDF metadata read/write
- `jszip` — DOCX (ZIP) parsing and repacking

## Files Changed/Created
- `src/lib/metadata.ts` — extraction + cleaning logic per file type
- `src/pages/Dashboard.tsx` — wire real processing pipeline
- `src/components/FileDropZone.tsx` — unchanged (already works)

## Technical Details

The processing pipeline per file:
1. User drops file → status `uploading` (instant, just reads into memory)
2. Detect type → call appropriate extractor → status `scanned` with real metadata table
3. User clicks Clean → call appropriate cleaner → status `cleaned`
4. User clicks Download → browser save dialog
5. After 1 hour → auto-remove from list

All processing happens in-browser. No data leaves the user's machine.

