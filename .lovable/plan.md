# Fiverr-Style Redesign — Site Shell + Homepage

Keep all existing colors, routes, data, and business logic. Only presentation (Layout + Index) and a couple of shared card primitives change.

## Design direction

Fiverr's visual signature, translated to Techrola:
- Clean white app shell, generous whitespace, thin 1px borders instead of heavy shadows
- Sticky top nav: logo · main links · search · right-side actions
- Massive editorial hero headline with an inline rotating word, oversized search bar with a dark pill "Search" button
- "Popular" tag row directly under the search
- Trusted-by strip
- Horizontally scrollable category tiles (icon + label, thin border, hover lift)
- Section blocks: left-aligned bold headline + right "See more" link + horizontal card rail
- Cards: image top, 2-line title, small meta row, price/CTA on the right — no gradient chrome

Colors stay as-is (blue `221 83% 53%`, green `152 69% 41%`, amber `45 93% 47%`). Fiverr uses black for primary CTAs; we'll use the existing `foreground` token so it reads as near-black in light mode and adapts in dark mode. No new palette, no new fonts — Plus Jakarta Sans (display) + Inter (body) already fit this aesthetic.

## Scope

### 1. `src/components/Layout.tsx` (header only)
- Replace the pill-group desktop nav with a Fiverr-style horizontal nav: logo left, primary links inline with lower weight, an inline compact search field appearing after scroll, right side = wallet chip + notification + avatar + logout
- Remove the muted rounded background behind the nav; use plain header with a 1px bottom border on scroll (drop the current glass-strong feel toward crisper white)
- Mobile header: keep logo + wallet + menu button, but tighten spacing and switch to a clean sheet menu (keep existing bottom nav untouched)

### 2. `src/pages/Index.tsx` — full homepage rebuild
Sections top → bottom:

1. **Hero** — white background, huge headline "Find the right **[scheme | internship | interview | job]**, right away." with a rotating word. Below it a full-width search bar (rounded, thin border, dark pill "Search" button). "Popular:" chips row (PM schemes, Scholarships, Mock interview, Resume, Internships). Right side of hero on desktop: a soft product mock illustration using `heroStudents` in a rounded frame with subtle amber accent.
2. **Trusted strip** — small "Trusted by students across India" + a muted logo/stat row (users count, schemes count, states covered — pulled from existing counters if present, else static copy).
3. **Category tiles rail** — horizontally scrollable row of ~8 tiles (Central Schemes, State Schemes, Scholarships, Internships, AI Tools, Mock Interview, Career Program, Reports). Each = icon in tinted square + label, thin border, hover lift.
4. **"Popular schemes" rail** — section header + horizontal card rail using existing scheme data + a shared `SchemeCardFiverr` presentational card (image, tag, 2-line title, ministry meta, "View" CTA).
5. **"Students AI Tools" rail** — same card pattern, links into `/ai-tools`.
6. **"Career Program" band** — keep existing content but restyled: white card with left copy + right step list, thin border, single amber accent.
7. **Blog rail** — reuse `HomeBlogSection` styles or wrap it in the new section header pattern.
8. Keep footer + Career CTA band + mobile bottom nav as-is.

Business logic, data fetching, routes, subscription gates, and analytics calls stay untouched — only JSX/classes change.

### 3. New shared presentational components (no logic)
- `src/components/home/SectionHeader.tsx` — `{title, href}` with right-side "See all →"
- `src/components/home/CategoryTile.tsx` — icon + label tile
- `src/components/home/SchemeCardFiverr.tsx` — receives the same scheme shape currently rendered on Index and outputs the new card

## Out of scope
- No changes to Dashboard, Admin, Auth, Career Program page internals, AI tool pages
- No changes to `index.css` tokens, `tailwind.config.ts`, fonts, or dark-mode palette
- No changes to Supabase, edge functions, or any data logic
- Footer stays as-is

## Technical notes
- Existing `HERO_SLIDES` array in `Index.tsx` is retired for the hero; it can still feed the "Popular schemes" rail if useful, otherwise deleted
- Rotating hero word: simple `useEffect` + `setInterval` swapping from a local array, `AnimatePresence` if `framer-motion` already installed, otherwise a CSS keyframe fade
- All new UI uses existing semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-accent`) — no hardcoded hex

## Verification
After the edits, capture the homepage at 390px and 1280px via Playwright, confirm:
- Hero renders with rotating word and search
- Category rail scrolls horizontally on mobile
- No console errors, no missing images, no broken links
- Header stays sticky and readable on scroll in both themes
