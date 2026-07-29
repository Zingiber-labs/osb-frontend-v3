# OSB Mobile Experience — Design

**Date:** 2026-07-28
**Repo:** `outer-sports-baller-v3`
**Status:** Approved, ready for implementation planning

## Problem

A stakeholder reported two mobile defects against the client at `app.dockinfrax.com`:

1. The mission terminal renders badly on phones — controls sit off their painted slots.
2. There is no navigation menu. Reaching any section requires returning to Home first.

A full audit at 390×844 in Chrome confirmed both and found four more breakages. All are in scope.

## Audit findings

Every item below was reproduced in-browser at 390×844 against a running dev server.

| # | Defect | Evidence |
|---|---|---|
| 1 | No mobile navigation | `NavMenu.tsx:17` is `hidden md:flex` with no mobile fallback. Only `/` has a menu (its four tiles). |
| 2 | Mission console controls drift off the art | `MissionPanel.tsx:160,172,185` position controls over a fluid `w-full h-auto` SVG using fixed pixel translates (`translate-x-25`, `-translate-y-5`, `-translate-x-6`). The offsets are correct only while the container sits at its `max-w-4xl` cap of 896px; below that the art shrinks and the offsets do not. At 390px the left arrow leaves the frame and ACCEPT overhangs its pad. Confirmed visually. |
| 3a | Leaderboard hides scores behind a sideways scroll | `/ranking` table measures 400px inside a 375px viewport. `GlobalLeaderboard.tsx:70` already wraps it in `overflow-x-auto`, so the page does not break — but Total XP sits outside the visible area and users must scroll the table sideways to see it, with no affordance saying so. Cause is an untruncated username forcing table width, not column count (`:76` already hides "Level & Rank" below `md`). |
| 3b | `/ranking` scrolls horizontally | Separate cause from 3a: the decorative blur blob at `GlobalLeaderboard.tsx:57` is `w-96` (384px) with `left-1/2 -translate-x-1/2`, so in a 375px viewport it spans −4px to 380px. Its parent has no clipping. This is what makes `scrollWidth` 380 > `clientWidth` 375. |
| 4 | Filter rows collide | Store and Inventory place two `w-[300px]` controls in `flex justify-between` with no gap. Measured at 375px: 177px and 166px, touching edge-to-edge. |
| 5 | Footer consumes 244px on every page | `Footer.tsx` stacks `flex-col` below `sm`. That is 29% of an 844px screen, repeated on every route. |
| 6 | Desktop-tree flash on phones | `useIsMobile` initialises to `false`, so mobile server-renders the desktop tree and swaps after hydration. Home compounds this with `min-h-[calc(100dvh-104px-91.83px)]`, hardcoding a 91.83px footer that is actually 244px on mobile. |
| 7 | `background-attachment: fixed` | All four `.layout--*` rules in `globals.css` use it. Unreliable on iOS Safari; likeliest cause of the "giant background, content squeezed at top" appearance in the stakeholder screenshot. |

## Decisions

| Question | Decision |
|---|---|
| Scope | Full mobile pass — all seven findings, not just the two reported. |
| Navigation pattern | Fixed bottom tab bar. |
| Home on mobile | Keep the existing four tiles; the tab bar is the shortcut layer for when the user is deep in another section. |
| Mission console | Art stays as decoration below the breakpoint; real buttons beneath it. Desktop overlay unchanged in appearance. |
| Breakpoint | 1200px, expressed in CSS as a Tailwind custom breakpoint — not the JS hook. |
| Verification | Manual, in Chrome, at four widths. No test infrastructure added. |

### Rationale for the 1200px breakpoint

The repo currently holds two conflicting definitions of "mobile": `md` (768px) hides `NavMenu`, while `useIsMobile(1200)` swaps Home. 1200 wins because the desktop layout genuinely needs it — the cockpit scene positions hotspots by percentage and the desktop navbar (logo + four links + bell + balances pill) needs roughly 900px. Standardising down to 768 would trade a phone bug for a tablet bug.

### Rationale for the tab bar

Home already ships exactly four mobile tiles, so the destination set is small and fixed — the shape a tab bar fits. It puts every section one tap from the mission terminal, where the complaint originated, and gives Ranking a real home instead of the floating button it hides behind today.

## Architecture

**CSS-first, single markup tree.** Layout selection moves out of JavaScript and into CSS, so the correct layout is present in the first server-rendered paint.

Add to the `@theme` block in `globals.css`:

```css
--breakpoint-desktop: 1200px;
```

This yields a `desktop:` variant across the codebase. Below it is the mobile shell; at or above it is today's desktop layout. This single token replaces both the `md:` in `NavMenu` and the `useIsMobile(1200)` call in Home.

**Correction (found during implementation): there is no JS exception.** This section originally claimed `HomeScene` had to be gated in JS because `desktop:hidden` would still mount it and run Three.js on phones. That was wrong. `HomeScene` contains no Three.js at all — it is a plain `<svg className="scene-svg">` with positioned hotspot images. Three.js lives only in `ThreeGameplayCanvas` on `/game-play` and in `src/hooks/three/*`, none of which Home touches.

Because the component is inexpensive, Home is gated **purely in CSS** with no JS branch:

- Both trees stay in the markup, toggled by the `desktop:` variant.
- `HomeScene` renders server-side, so the cockpit appears in the desktop first paint. Measured before and after: with the JS gate the scene was absent at first paint and appeared only after hydration; without it, it is present at first paint.
- On phones the scene stays in the DOM but is `display: none`, so the browser never fetches its hotspot images.

`useMediaQuery` therefore has exactly one consumer in the codebase — `DailyLoginRewardsModal`, choosing carousel vs grid.

### New files

| File | Role |
|---|---|
| `src/components/navbar/MobileTabBar.tsx` | Fixed bottom bar, five tabs, active state from `usePathname()`, `desktop:hidden`, `env(safe-area-inset-bottom)` bottom padding |
| `src/hooks/useMediaQuery.ts` | SSR-safe media query via `useSyncExternalStore`. Replaces `useIsMobile.ts`, which is deleted. |

`useIsMobile` has two consumers, and **both** must migrate before it can be deleted:

1. `(main)/page.tsx:30` — `useIsMobile(1200)`. Layout branching moves to CSS; only the `HomeScene` canvas mount keeps a JS gate, via `useMediaQuery`.
2. `components/rewards/DailyLoginRewardsModal.tsx:52` — `useIsMobile()`, defaulting to **768**, choosing carousel vs grid. This is legitimate JS branching (it selects a component, not a layout) and becomes `useMediaQuery("(max-width: 767px)")`. Its 768 threshold is deliberate and must not be folded into the new 1200 breakpoint — the two decisions are unrelated.

### Tab bar contents

`MENU` (`/`) · `HANGAR` (`/missions`) · `STORE` (`/store`) · `INVENTORY` (`/inventory`) · `RANKING` (`/ranking`)

Profile and Log out stay in the avatar dropdown, which already renders a mobile-only balances block at `UserProfile.tsx:172`.

The `HANGAR → /missions` label is deliberate: it preserves existing team vocabulary. `/hangar` is the post-accept step (pick player, then Play), reached from `MissionPanel.tsx:67`, and is not a top-level destination.

### Modified files — shell

- **`src/components/navbar/navLinks.ts`** — becomes the single source of truth. Gains an `icon` per entry and the missing Ranking link. Consumed by both `NavMenu` (desktop) and `MobileTabBar`, ending the drift where the nav lists four links and Home lists a different four.
- **`src/app/(main)/layout.tsx`** — renders `<MobileTabBar />`; content wrapper gains bottom padding so the bar never covers content.
- **`src/components/footer/Footer.tsx`** — below `desktop:`, one horizontal row holding the logo, the three social icons, and the copyright line, with the SUPPORT button kept but reduced to text-link size; target height ~72px versus today's 244px. Full existing layout above the breakpoint. Two heavy bottom elements would otherwise collide with the tab bar.
- **`src/app/layout.tsx`** — add Next's `viewport` export with `viewportFit: "cover"`. Required for `env(safe-area-inset-*)` to resolve on notched iPhones. The existing `width=device-width, initial-scale=1` is correct and stays.
- **`src/app/globals.css`** — add the breakpoint token; convert `background-attachment: fixed` on the four `.layout--*` rules to a fixed-position `::before` layer.

## Per-page changes

### Mission terminal — `MissionPanel.tsx`

- Below `desktop:`: console SVG becomes `pointer-events-none` decoration. The three overlaid `<Image>` controls are replaced by a button row beneath it — `‹` (44×44), **ACCEPT** (`flex-1`, 44px tall), `›` (44×44).
- **Desktop is left completely untouched.** The console's container is `w-full max-w-4xl`, and at any viewport ≥1200px the available width always exceeds 896px, so `max-w-4xl` caps it at exactly 896px. The pixel translates are therefore stable across every desktop width including ultrawide — they only break once the container drops below 896px, which cannot happen above the breakpoint. Converting them to percentages would add regression risk for no benefit, so the desktop overlay keeps its current markup and values verbatim.
- Controls become real `<button>` elements: `disabled` when `missions.length === 0` (today the handlers at `:44` and `:49` silently no-op) and given `aria-label`s. Existing accept-failure toast is unchanged.
- Remove the inner `max-h-[320px] overflow-y-auto` at `:111` below `desktop:` so the page scrolls naturally; three nested scroll layers is why the list feels stuck on touch. Desktop retains it.

### `MissionDetailsCard.tsx`

Two-column layout stacks below `sm`, so the mission title stops wrapping to three lines beside the mission ID.

### Ranking — `GlobalLeaderboard.tsx`

Two independent fixes:

**3a — bring Total XP into view.** The table is already inside `overflow-x-auto` at `:70`, so nothing is broken; the column is simply pushed out of sight. Narrow the table to fit instead:
- `min-w-0` on the username flex column and `truncate` on the username `<span>` at `:118-124` — this is what forces the extra width.
- Rank column `w-[100px]` at `:74` → `w-14 md:w-[100px]` (56px on mobile, enough for the `w-6` crown/medal icons).
- `pr-8` → `pr-4 md:pr-8` at `:77` and `:161`.

**3b — stop the page scrolling sideways.** Add `overflow-x-hidden` to the root container at `:55`. This clips the oversized decorative blob at `:57` and guards against any other decorative overflow on the page. Do not shrink the blob itself — its size is what produces the intended glow.

### Store — `store/page.tsx`

Filter row: `w-[300px]` → `w-full sm:w-[300px]` on both controls; container `flex justify-between` → `flex-col sm:flex-row gap-3`.

### Inventory — `inventory/page.tsx`

- Same filter row change.
- Heading `text-5xl` → `text-3xl desktop:text-5xl`. At `text-5xl` it spans nearly the full 390px and clips at 360.

### Home — `(main)/page.tsx`

- Drop `min-h-[calc(100dvh-104px-91.83px)]` entirely. The `(main)` layout already wraps content in `flex flex-col min-h-screen` with a `flex-1` child, so the height comes from the flex chain and no navbar/footer pixel constants are needed. This is what makes the wrong 91.83px assumption unrepresentable rather than merely corrected.
- Normalise all four tiles to `h-[72px]`; two currently use `h-18` (which resolves to 72px in Tailwind 4 anyway, so this is a consistency fix with no visual change).
- Branching moves from `useIsMobile(1200)` to CSS, with the `HomeScene` mount gated by `useMediaQuery` per the architecture section.

### Hangar — `hangar/page.tsx`

CTA card goes full-width and left-aligned below `desktop:`. Right-aligned body text reads as a defect in a narrow column.

### Gameplay — `ThreeGameplayCanvas.tsx`

`height: "100vh"` at `:96` → `100dvh`, so the phone URL bar stops causing overflow. The canvas is spectator-only — it renders live box scores over a socket and takes no player input — so no touch controls are required.

## Data flow and error handling

No new data fetching. The tab bar is pure client-side navigation derived from `usePathname()`. The only behavioural change is the disabled states on the mission controls, which surface an existing silent failure. All existing TanStack Query hooks, the BFF proxy path, and auth are untouched.

## Verification

Manual, in Chrome, per the agreed approach:

1. Every route at **360, 390, 768, and 1200** px.
2. Before/after screenshots at 390px for each route.
3. A scripted assertion that `document.documentElement.scrollWidth === clientWidth` on every route at 360 and 390 — the exact check that caught `/ranking`.
4. `npx tsc --noEmit` and `npm run build` clean, since `ignoreBuildErrors` is off.

No Vitest or Playwright is added. The repo has no test infrastructure and an E2E harness would need a login fixture against the BFF cookie flow — meaningful work that does not belong in this change.

## Out of scope

- **`inventory/page.tsx:104`** early-returns the "no items" state before rendering the filter, so filtering to a type with no items leaves the user unable to change the filter back. A real bug, but not a mobile one. Flagged, deliberately not fixed here.
- Touch controls for gameplay — not applicable; the canvas is spectator-only.
- The three known backend limitations in `CLAUDE.md` (no `/auth/refresh`, Google OAuth token-in-URL, no `redirectUrl` allowlist).
