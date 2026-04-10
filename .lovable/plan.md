

# Fix HEIC File Upload for iPhone Users

## Problem
The FileDropZone filters files by MIME type (`ACCEPTED_TYPES.includes(f.type)`), but iPhone HEIC files often have an empty or unrecognized MIME type in browsers. The backend processing code (heic2any conversion, EXIF extraction) already exists — the files are just being rejected at the upload gate.

## Solution
Update the file filtering in `FileDropZone.tsx` to also check the file extension when the MIME type is empty or unrecognized. This is a single-file fix.

### Changes to `src/components/FileDropZone.tsx`

1. Add a helper function `isAcceptedFile(file: File)` that:
   - First checks if `file.type` is in `ACCEPTED_TYPES` (existing behavior)
   - If MIME type is empty/unrecognized, falls back to checking the file extension against `ACCEPTED_EXTENSIONS`
2. Replace `ACCEPTED_TYPES.includes(f.type)` in both `handleDrop` and `handleChange` with the new helper

This is a ~10-line change in one file. No new dependencies needed — `heic2any` is already installed and the HEIC processing pipeline in `metadata.ts` is fully implemented.

