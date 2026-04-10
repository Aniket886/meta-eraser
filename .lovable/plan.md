

# Expand File Type Support: TIFF, HEIC, JSON, XML, TXT

## Current State
Already supported: JPEG, PNG, PDF, DOCX, XLSX, PPTX, MP3, MP4, MOV, ZIP.

## What Gets Added

### 1. TIFF Images
- Add `image/tiff` to accepted types and `.tiff`, `.tif` to extensions
- `exifr` already supports TIFF — same extraction logic as JPEG/PNG
- Cleaning: canvas redraw (browser can render TIFF), output as PNG (browsers can't encode TIFF)
- Warning: output format changes from TIFF → PNG after cleaning

### 2. HEIC Images
- Add `image/heic`, `image/heif` to accepted types and `.heic`, `.heif` to extensions
- **Limitation**: Browsers cannot natively decode HEIC. Use `heic2any` library to convert HEIC → JPEG in-browser before extraction
- Extract metadata with `exifr` after conversion
- Clean by canvas redraw (outputs as JPEG)
- Warning shown: "HEIC converted to JPEG during cleaning"

### 3. JSON Files
- Add `application/json` and `.json`
- Extract: scan top-level keys for common metadata patterns — `author`, `creator`, `created`, `modified`, `generator`, `_metadata`, `$schema`, timestamps
- Clean: remove identified metadata keys, preserve the rest
- Output as reformatted JSON blob

### 4. XML Files
- Add `application/xml`, `text/xml` and `.xml`
- Extract: parse with DOMParser, look for processing instructions, `<!-- comments -->`, and common metadata elements (`<meta>`, `<author>`, `<creator>`, `<dc:*>` Dublin Core)
- Clean: strip comments, processing instructions, and metadata elements
- Output cleaned XML

### 5. TXT Files
- Add `text/plain` and `.txt`
- Extract: scan for embedded metadata patterns — YAML frontmatter (`---` blocks), email headers (`From:`, `Date:`, `Subject:`), common header lines
- Clean: strip detected frontmatter or header blocks
- Warn if no metadata patterns found

## New Dependencies
- `heic2any` — HEIC → JPEG conversion in browser

## Files Changed

| File | Change |
|------|--------|
| `src/lib/metadata.ts` | Add MIME helpers, extract/clean functions for TIFF, HEIC, JSON, XML, TXT |
| `src/components/FileDropZone.tsx` | Add new types/extensions to accepted lists, update label |
| `src/lib/zip-processor.ts` | Add new extensions to SUPPORTED_EXTENSIONS map |
| `src/pages/Index.tsx` | Update features list to mention new formats |

## Technical Notes
- TIFF extraction uses existing `exifr` — no new dependency needed
- HEIC requires `heic2any` (~50KB) for browser-side conversion
- JSON/XML/TXT metadata is heuristic-based (pattern matching on common keys) since these are freeform formats
- The `isImage()` helper expands to include `image/tiff`, `image/heic`, `image/heif`
- HEIC cleaning pipeline: HEIC → (heic2any) → JPEG blob → canvas redraw → clean JPEG output

