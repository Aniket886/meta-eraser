

## Database Tables for Processing History & User Credits

### What We're Building
Two Supabase tables to replace localStorage-based history and add a credit system, with RLS policies and updated app code.

### Database Schema

**1. `processing_history` table**
- Columns: `id` (UUID PK), `user_id` (FK to auth.users), `file_name`, `file_type`, `file_size` (bigint), `fields_removed` (int), `cleaned_at` (timestamptz)
- RLS: Users can SELECT, INSERT, and DELETE their own rows only

**2. `user_credits` table**
- Columns: `id` (UUID PK), `user_id` (FK, unique), `balance` (int, default 5), `free_cleans_today` (int, default 0), `last_free_reset` (date), `updated_at`
- RLS: Users can SELECT, INSERT, and UPDATE their own row only
- Daily free cleans reset logic: if `last_free_reset < today`, reset `free_cleans_today` to 0

### Code Changes

| File | Change |
|------|--------|
| **Migration** | Create both tables with RLS policies |
| `src/lib/processing-history.ts` | Rewrite to use Supabase queries (async). `getHistory` → select, `addHistoryEntry` → insert, `clearHistory` → delete |
| **New** `src/lib/credits.ts` | `getCredits(userId)` — fetch/auto-create row, reset daily frees. `useCredit(userId)` — deduct credit. `hasCreditsAvailable(userId)` — check availability |
| `src/pages/Dashboard.tsx` | Check credits before cleaning, deduct on success, show credit balance badge |
| `src/pages/Profile.tsx` | Fetch history from Supabase via useEffect, display credit balance |

### Technical Notes
- Free tier: 5 cleans/day with account (per memory). Credits beyond that come from purchased balance.
- All history/credit functions become async — callers updated accordingly.
- Credit row auto-created on first use via upsert pattern.

