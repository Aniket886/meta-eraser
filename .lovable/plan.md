

## User Profile Page — Implementation Plan

### What We're Building
A new `/profile` page with two sections:
1. **Account Settings** — display name, email, avatar initials, and ability to update display name and password
2. **Processing History** — a table showing past file cleanings (stored locally for now since Supabase tables aren't set up yet)

### Technical Approach

**1. Create `src/pages/Profile.tsx`**
- Uses `useAuth()` to get current user data
- **Account card**: Shows avatar (initials circle), email (read-only), display name (editable), and a change password section
- Update display name via `supabase.auth.updateUser({ data: { display_name } })`
- Change password via `supabase.auth.updateUser({ password })`
- **Processing history card**: For now, reads from localStorage (same pattern as settings). Later, this can be backed by a Supabase `processing_history` table
- Styled with existing `glass`, `animate-fade-in-up`, `stagger-*` classes

**2. Update routing**
- Add `/profile` route in `App.tsx`, wrapped in `<ProtectedRoute>`
- Import the new `Profile` page

**3. Update Navbar**
- Add a "Profile" link in the user section (when logged in) — clicking the user name/email navigates to `/profile`

**4. Processing history storage**
- Create a small helper in `src/lib/processing-history.ts` that saves/loads cleaned file records to localStorage
- Hook into Dashboard's `handleClean` to log entries: `{ fileName, fileType, fileSize, cleanedAt, fieldsRemoved }`
- Profile page reads and displays this history in a table

### Files Changed
- **New**: `src/pages/Profile.tsx`, `src/lib/processing-history.ts`
- **Modified**: `src/App.tsx` (add route), `src/components/Navbar.tsx` (add profile link), `src/pages/Dashboard.tsx` (log history on clean)

