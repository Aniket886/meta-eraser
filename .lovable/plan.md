

# Show Error Toast for Unsupported File Formats

## Problem
When users drop or select unsupported files, they're silently ignored — no feedback at all.

## Solution
In `FileDropZone.tsx`, after filtering files, check if any were rejected. If so, show a sonner toast listing the rejected file names and supported formats.

### Changes to `src/components/FileDropZone.tsx`
1. Import `toast` from `sonner`
2. In both `handleDrop` and `handleChange`:
   - Get all files, partition into accepted and rejected using `isAcceptedFile`
   - If rejected files exist, show `toast.error` with rejected file names and a hint of supported formats
   - Continue passing accepted files to `onFilesSelected` as before

Example toast message:
> **Unsupported file(s) skipped**  
> `photo.webp, doc.pages` — Supported formats: JPG, PNG, TIFF, HEIC, PDF, DOCX, XLSX, PPTX, MP3, MP4, MOV, JSON, XML, TXT, ZIP

Single file change, ~15 lines added.

