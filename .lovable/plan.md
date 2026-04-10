

## Mobile/PWA UI Audit Results and Fix Plan

### What looks good (no changes needed)
- Home page: hero, features grid, steps, CTA, footer — all properly aligned
- Pricing page: cards stack vertically, text centered, no overflow
- Install page: cards stack vertically, instructions readable
- Auth page: login form centered and well-sized
- Footer: compact 2-column layout works well
- Navbar: logo + hamburger, mobile menu opens cleanly
- Mobile menu: links and buttons properly spaced

### Issue found: Settings page preset buttons overflow

On the Settings page at 390px width, the preset buttons (with badge + description text) extend beyond the screen edge, causing horizontal scrolling. The text "Strip everything — maximum..." gets clipped.

### Fix

**File: `src/pages/Settings.tsx`** (lines 111-118)

Change the preset buttons from inline horizontal layout to full-width stacked layout on mobile:
- Make each preset button `w-full` on mobile, with text wrapping enabled
- Use `flex-col` for the button content on small screens so the badge sits above the description
- Alternatively, stack the buttons vertically with `flex-col md:flex-row` on the container and truncate/wrap the description text

This is a single-file, ~5 line change.

