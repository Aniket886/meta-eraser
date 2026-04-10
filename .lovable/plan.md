

## Plan: Enforce Admin Role-Based Access

### What changes

1. **Create `useAdminCheck` hook** (`src/hooks/useAdminCheck.ts`)
   - Queries `user_roles` table via Supabase to check if current user has `admin` role
   - Returns `{ isAdmin, loading }`

2. **Create `AdminRoute` component** (`src/components/AdminRoute.tsx`)
   - Wraps `ProtectedRoute` logic + admin check
   - Shows spinner while loading, redirects non-admins to `/dashboard` with a toast

3. **Update `src/App.tsx`**
   - Replace `<ProtectedRoute><Admin /></ProtectedRoute>` with `<AdminRoute><Admin /></AdminRoute>`

4. **Update `src/pages/Admin.tsx`**
   - Remove mock data, fetch real users from Supabase (profiles + user_credits + user_roles)

### Technical details

The `useAdminCheck` hook queries:
```ts
supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single()
```

`AdminRoute` redirects unauthorized users to `/dashboard` and shows a "Not authorized" toast. This is a client-side guard backed by RLS on the server side (the `has_role` function you already created).

