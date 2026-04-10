---
name: Supported file types
description: All file formats supported for metadata extraction and cleaning
type: feature
---
Images: JPEG, PNG, TIFF, HEIC/HEIF (HEIC converts to JPEG, TIFF converts to PNG after cleaning)
Documents: PDF, DOCX, XLSX, PPTX
Audio/Video: MP3, MP4, MOV
Text/Data: JSON (top-level metadata keys), XML (comments, PIs, metadata elements), TXT (YAML frontmatter, email headers)
Archives: ZIP (batch processing of all supported types inside)
Dependencies: heic2any for HEIC conversion, exifr for EXIF, pdf-lib for PDF, jszip for OOXML/ZIP, mp3tag.js for MP3, mp4box for MP4
