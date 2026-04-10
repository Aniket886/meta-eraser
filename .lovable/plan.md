
# MetaClean — Full-Stack Metadata Removal Tool

## Design System
- **Palette**: Midnight Indigo — `#0a0a1a` background, `#141432` cards, `#1e1e5a` surfaces, `#4f46e5` primary accent
- **Typography**: Space Grotesk headings, DM Sans body
- **Style**: Dark theme, rounded corners (12px), subtle glow effects on primary elements, glassmorphism cards
- **Layout**: Hero + grid pattern

## Pages

### 1. Landing Page
- Hero section with headline ("Strip metadata. Protect your privacy."), animated file upload zone, and CTA
- Feature grid: supported file types (JPG, PNG, PDF, DOCX), speed, privacy focus
- How-it-works 3-step flow (Upload → Clean → Download)
- Pricing section (credits-based pay-per-use)
- Footer with links

### 2. Pricing Page
- Pay-per-use credit system: buy credit packs (e.g., 10 credits for $X, 50 for $Y, 100 for $Z)
- Each file clean costs 1 credit
- Free tier: 3 free cleans per day (no account needed) or 5/day with account
- Stripe integration for purchasing credits

### 3. Dashboard (authenticated users)
- Credit balance display
- Upload zone (drag & drop + click)
- File processing queue showing: file name, type, status (uploading → scanning → ready)
- For each file: expandable metadata preview (before), clean button, download cleaned file
- Warning badges on files with non-removable metadata
- Processing history

### 4. Admin Panel
- User management table (list users, credit balances, usage)
- System stats: total files processed, files pending cleanup, storage usage
- Ability to grant credits to users
- File cleanup status monitor

## Auth
- Supabase Auth: email/password signup & login
- Protected routes for dashboard and admin
- Role-based access via `user_roles` table (user/admin)

## Database Schema
- `profiles` — user_id, display_name, credits_balance, created_at
- `user_roles` — user_id, role (admin/user)
- `file_jobs` — id, user_id, original_filename, file_type, status (pending/scanning/scanned/cleaning/cleaned/failed), original_storage_path, cleaned_storage_path, metadata_before (JSONB), metadata_after (JSONB), warnings (JSONB), created_at, expires_at
- `credit_transactions` — id, user_id, amount, type (purchase/usage/grant), description, created_at

## Storage
- Supabase Storage bucket `uploads` for original files
- Supabase Storage bucket `cleaned` for processed files
- RLS policies scoped to file owner

## Edge Functions

### `upload-file`
- Validate file type (JPG, PNG, PDF, DOCX)
- Store to `uploads` bucket
- Create `file_jobs` record with status "pending"
- Deduct 1 credit

### `scan-metadata`
- Extract metadata based on file type (EXIF for images, PDF properties, DOCX properties)
- Store extracted metadata in `file_jobs.metadata_before`
- Identify non-removable metadata, store warnings
- Update status to "scanned"

### `clean-file`
- Remove all removable metadata from the file
- Store cleaned file in `cleaned` bucket
- Store remaining metadata in `metadata_after`
- Update status to "cleaned"

### `cleanup-expired`
- Scheduled/invoked function to delete files older than 1 hour
- Remove from both storage buckets
- Update job status to "expired"

## Key UX Details
- Drag & drop with visual feedback (border highlight, file icon preview)
- Real-time status updates during processing
- Metadata displayed in a clean table: field name, value, removable (yes/no)
- Warning banner shown when non-removable metadata exists
- Toast notifications for success/error states
- Responsive design for mobile use
