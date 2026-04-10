# MetaClean

![MetaClean logo](./public/metaclean-logo.png)

<div align="center">

### Strip metadata. Protect privacy. Keep the file.

Client-side metadata cleaner for images, documents, audio, video, text, and ZIP archives.

[![Vite](https://img.shields.io/badge/Vite-React%20App-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-18-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Custom%20UI-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Functions-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## Overview

MetaClean is a modern metadata removal app built to help users sanitize files before sharing them.

It supports:

- Images: `JPG`, `PNG`, `TIFF`, `HEIC`
- Documents: `PDF`, `DOCX`, `XLSX`, `PPTX`
- Media: `MP3`, `MP4`, `MOV`
- Structured text: `JSON`, `XML`, `TXT`
- Archives: `ZIP` batch processing

The core product direction is straightforward:

- inspect metadata
- remove what is removable
- preserve file usability
- download a clean version
- generate audit and PDF reports

---

## Why This Project Stands Out

- Privacy-first flow with on-device processing for core cleaning tasks
- Batch upload and multi-file cleaning
- ZIP archive scanning and nested clean workflow
- Audit reports showing what was found, removed, and kept
- PDF export for reporting
- PWA support for installable, app-like usage
- Credits-based usage model with free daily cleans
- Admin tooling for credit management

---

## Product Snapshot

### Home Experience

- Hero-led landing page with instant upload
- Quick explanation of supported file types
- Three-step flow: upload, clean, download

### Dashboard

- Drag-and-drop upload area
- Scan status per file
- Clean single files or entire batches
- Download cleaned files, audit reports, and PDF reports
- Expiry/retention visibility for uploaded files

### Privacy Controls

- Metadata-aware cleaning workflow
- Structural fields are preserved where removal would break the file
- PWA mode avoids attaching account-based report identity details

### Platform Layer

- Supabase-backed auth and credit sync
- Edge functions for account deletion and AI report insights

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, Radix UI, shadcn-style components, Lucide |
| State/Data | React Query, React Hook Form |
| Backend Services | Supabase |
| File Processing | `exifr`, `pdf-lib`, `jszip`, `mp3tag.js`, `mp4box`, `heic2any`, `jspdf` |
| Testing | Vitest, Testing Library |

---

## Local Setup

### Prerequisites

- Node.js `20+` recommended
- npm `10+`

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Run lint

```bash
npm run lint
```

Note: the project currently builds and tests successfully, but lint still has existing violations in the codebase that should be cleaned up separately.

---

## Project Structure

```text
meta-eraser/
├─ public/                  # icons, manifest, public assets
├─ src/
│  ├─ components/           # app UI and reusable components
│  ├─ hooks/                # auth, toast, device hooks
│  ├─ integrations/         # Supabase client
│  ├─ lib/                  # metadata parsing, cleaning, reports, credits
│  ├─ pages/                # landing, dashboard, profile, settings, admin
│  └─ test/                 # Vitest setup and tests
├─ supabase/
│  └─ functions/            # edge functions
├─ package.json
└─ vite.config.ts
```

---

## Core Capabilities

### File metadata extraction

The app identifies removable and non-removable metadata across supported file formats and surfaces that difference to the user.

### Safe cleaning workflow

Files are cleaned while preserving structural information where necessary, so the output remains usable.

### Reporting

The app can generate:

- per-file audit summaries
- batch audit downloads
- PDF reports
- optional AI-enhanced report insights through Supabase edge functions

### Installable app behavior

MetaClean includes PWA assets and utilities so the app can behave more like a native tool on supported devices.

---

## Current Engineering Notes

- `npm audit` is clean with `0` vulnerabilities in the current dependency graph
- production build passes
- tests pass
- bundle size is still relatively large and should be optimized later
- lint issues remain in the current codebase

---

## Suggested Next Improvements

- resolve current ESLint violations
- split heavy file-processing dependencies into smaller lazy-loaded chunks
- expand test coverage beyond the placeholder example test
- add a proper `.env.example` and deployment notes
- document Supabase schema and edge function setup

---

## Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Status

This repository is active and already has a meaningful product surface. The README now reflects the actual app rather than placeholder Lovable scaffolding.
