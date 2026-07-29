# OSB Mobile Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the OSB web client a working mobile experience — a persistent bottom tab bar, a usable mission terminal, and no broken layouts — without changing the desktop experience.

**Architecture:** Layout selection moves out of JavaScript and into CSS via a single Tailwind 4 custom breakpoint (`desktop`, 1200px), so phones get the correct layout in the first server-rendered paint instead of flashing the desktop tree. The only remaining JS branch is the Three.js canvas mount, gated by a new SSR-safe `useMediaQuery` hook. All navigation destinations come from one shared `navLinks` array consumed by both the desktop nav row and the new mobile tab bar.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind 4 (CSS-first, no config file), shadcn/ui, lucide-react, Three.js / @react-three/fiber.

**Spec:** `docs/superpowers/specs/2026-07-28-osb-mobile-experience-design.md`

## Global Constraints

- **Breakpoint:** `desktop` = **1200px**. Below it is the mobile shell. Never introduce a second definition of "mobile".
- **The 768px threshold in `DailyLoginRewardsModal` is unrelated** to the 1200px shell breakpoint and must be preserved exactly as 768.
- **Desktop (≥1200px) must not change visually.** Any task that alters desktop rendering is a defect, except the desktop nav row gaining a Ranking link (Task 3, intended).
- **TypeScript strict is on and `ignoreBuildErrors` is OFF** — type errors fail the build. `npx tsc --noEmit` must be clean at the end of every task.
- **No test framework may be added.** Verification is manual in Chrome plus the console snippet defined in Task 1.
- **Do not run `git commit` without Oscar's explicit say-so.** Commit steps below are written as ready-to-run, but each one is a checkpoint: show the staged diff and wait for approval. Praise is not approval.
- **Never write commit messages that reference Claude or AI assistance.**
- Follow existing conventions: `PascalCase.tsx` for components, `camelCase.ts` for hooks, `@/*` imports across features.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/components/navbar/MobileTabBar.tsx` | The fixed bottom navigation bar. Renders below 1200px only. |
| `src/hooks/useMediaQuery.ts` | SSR-safe media query subscription. Sole remaining JS layout signal. |

**Modified:**

| File | Change |
|---|---|
| `src/app/globals.css` | Add `--breakpoint-desktop`; replace `background-attachment: fixed` with a fixed pseudo-element layer |
| `src/app/layout.tsx` | Add `viewport` export with `viewportFit: "cover"` |
| `src/app/(main)/layout.tsx` | Render `MobileTabBar`; add bottom padding so it never covers content |
| `src/components/navbar/navLinks.ts` | Single source of truth; gains `icon` and the Ranking entry |
| `src/components/navbar/NavMenu.tsx` | `md:` → `desktop:` |
| `src/components/footer/Footer.tsx` | Compact single row below `desktop:` |
| `src/components/rewards/DailyLoginRewardsModal.tsx` | `useIsMobile()` → `useMediaQuery("(max-width: 767px)")` |
| `src/app/(main)/page.tsx` | CSS branching; canvas mount gate; drop `min-h` magic numbers; normalise tile heights |
| `src/components/missions/MissionPanel.tsx` | Mobile button row; desktop overlay hidden below breakpoint |
| `src/components/missions/MissionDetailsCard.tsx` | Header stacks below `sm` |
| `src/components/ranking/GlobalLeaderboard.tsx` | Truncate username; narrow rank column; clip decorative blob |
| `src/app/(main)/store/page.tsx` | Filter row stacks |
| `src/app/(main)/inventory/page.tsx` | Filter row stacks; heading scales |
| `src/app/(main)/hangar/page.tsx` | CTA card full-width and left-aligned below `desktop:` |
| `src/components/gameplay/ThreeGameplayCanvas.tsx` | `100vh` → `100dvh` |

**Deleted:**

| File | Reason |
|---|---|
| `src/hooks/useIsMobile.ts` | Both consumers migrate to `useMediaQuery` (Tasks 2 and 5) |

---

## Task 1: Breakpoint token, viewport meta, and iOS-safe backgrounds

**Files:**
- Modify: `src/app/globals.css:5-58` (`@theme inline` block) and `src/app/globals.css:210-309` (`.layout*` rules)
- Modify: `src/app/layout.tsx:1,25-31`

**Interfaces:**
- Consumes: nothing.
- Produces: the `desktop:` Tailwind variant (min-width 1200px), used by every later task. `env(safe-area-inset-bottom)` becomes resolvable, which Task 3 depends on.

- [ ] **Step 1: Add the breakpoint token**

In `src/app/globals.css`, inside the existing `@theme inline { ... }` block, add this line immediately after the `--font-mono: var(--font-geist-mono);` line:

```css
  --breakpoint-desktop: 1200px;
```

- [ ] **Step 2: Verify the variant compiles**

Start the dev server if it is not already running:

```bash
npm run dev
```

Temporarily add `desktop:bg-red-500` to the `<header>` element's className in `src/components/navbar/Navbar.tsx:11`, load `http://localhost:3000/` in a browser at full width, and confirm the navbar background turns red. Then **remove that class again**.

Expected: red at ≥1200px, unchanged below. If nothing happens, the token is in the wrong block — it must be inside `@theme inline`, not `:root`.

- [ ] **Step 3: Replace `background-attachment: fixed` with a fixed pseudo-element layer**

In `src/app/globals.css`, replace the whole block from `.layout {` through the `.layout--missions { ... }` rule with this. Note that `.layout--menu::before`, `.layout--menu > *`, and the `.layout--hangar .overlay, .layout--menu .overlay` rules that follow are **left exactly as they are** — do not touch them.

```css
.layout {
  min-height: 100svh;
  position: relative;
  isolation: isolate;
}

/* Fixed background layer. Replaces `background-attachment: fixed`, which is
   unreliable on iOS Safari. `.layout` has no transform, so a fixed-position
   pseudo-element resolves against the viewport as intended. */
.layout::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: var(--layout-bg, none);
  background-repeat: no-repeat;
  background-position: var(--layout-bg-pos, center);
  background-size: cover;
  pointer-events: none;
}

.layout--menu {
  position: relative;
  --layout-bg: url("/img/menu.png");
}
.layout--default {
  --layout-bg: url("/img/planets.jpg");
  --layout-bg-pos: top;
}
.layout--hangar {
  --layout-bg: url("/img/hangar.png");
}
.layout--missions {
  --layout-bg: url("/img/missions_2.png");
}
```

- [ ] **Step 4: Verify backgrounds still render on all four layout variants**

Visit each of these at full desktop width and confirm the background image is present and correctly positioned, and that the menu page still has its dark tint over the art:

- `http://localhost:3000/` → cockpit art, dark tint
- `http://localhost:3000/missions` → missions art
- `http://localhost:3000/hangar` → hangar art
- `http://localhost:3000/store` → planets art, anchored to top

Expected: visually identical to before this task. The stacking order is preserved because `.layout--menu::before` sits at `z-index: 1` and `.layout--menu > *` at `z-index: 2`, both above the new `::after` at `-1`.

- [ ] **Step 5: Add the viewport export**

In `src/app/layout.tsx`, change the type import on line 1 and add a `viewport` export directly below the existing `metadata` export:

```tsx
import type { Metadata, Viewport } from "next";
```

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on notched iPhones,
  // which MobileTabBar depends on.
  viewportFit: "cover",
};
```

- [ ] **Step 6: Verify the viewport meta tag**

Reload any page and run this in the browser console:

```js
document.querySelector('meta[name=viewport]').content
```

Expected output includes `viewport-fit=cover`.

- [ ] **Step 7: Save the overflow-check snippet for reuse**

This snippet is used in the verification step of every remaining task. Keep it to hand — **do not commit it to the repo**, since the spec forbids adding test infrastructure.

```js
// Paste into the browser console on any route.
// Passes when the page does not scroll horizontally.
(() => {
  const d = document.documentElement;
  const overflowing = [...document.querySelectorAll('*')]
    .filter(el => el.getBoundingClientRect().right > d.clientWidth + 1)
    .slice(0, 5)
    .map(el => el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 60));
  return {
    path: location.pathname,
    scrollWidth: d.scrollWidth,
    clientWidth: d.clientWidth,
    pass: d.scrollWidth <= d.clientWidth,
    firstOffenders: overflowing,
  };
})()
```

- [ ] **Step 8: Type check**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 9: Commit — checkpoint, requires approval**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(mobile): add desktop breakpoint, viewport-fit, iOS-safe backgrounds"
```

---

## Task 2: SSR-safe `useMediaQuery` hook

**Files:**
- Create: `src/hooks/useMediaQuery.ts`
- Modify: `src/components/rewards/DailyLoginRewardsModal.tsx:3,52`

**Interfaces:**
- Consumes: nothing.
- Produces: `useMediaQuery(query: string): boolean` — a client hook returning `false` during SSR and the live `matchMedia` result after hydration. Task 5 consumes it to gate the Three.js canvas.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useMediaQuery.ts`:

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query subscription.
 *
 * Returns `false` on the server and during the first client render, then the
 * real result. Use this ONLY when a JS answer is genuinely required — for
 * layout, prefer the `desktop:` Tailwind variant, which has no hydration gap.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 2: Migrate `DailyLoginRewardsModal`**

In `src/components/rewards/DailyLoginRewardsModal.tsx`, replace the import on line 3:

```tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";
```

and replace line 52:

```tsx
  const isMobile = useMediaQuery("(max-width: 767px)");
```

The `767px` value preserves the existing `useIsMobile()` default of 768 exactly. **It is not the 1200px shell breakpoint and must not be changed to match it.**

- [ ] **Step 3: Verify the rewards modal still switches to a carousel**

The modal chooses a carousel when `isMobile || safeRewards.length > MAX_GRID_REWARDS` (`DailyLoginRewardsModal.tsx:54`). With the app open and the daily rewards modal visible, resize the window across 768px and confirm the layout switches between grid and carousel exactly as before.

If the modal does not appear (already claimed today), verify by temporarily rendering it with `open` forced true, then revert.

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: clean. `useIsMobile.ts` still exists and is still imported by `(main)/page.tsx` — that is expected until Task 5.

- [ ] **Step 5: Commit — checkpoint, requires approval**

```bash
git add src/hooks/useMediaQuery.ts src/components/rewards/DailyLoginRewardsModal.tsx
git commit -m "feat(mobile): add SSR-safe useMediaQuery and migrate rewards modal"
```

---

## Task 3: Shared nav links and the mobile tab bar

This is the headline fix for the reported complaint: no navigation exists below 1200px today.

**Files:**
- Modify: `src/components/navbar/navLinks.ts` (whole file)
- Create: `src/components/navbar/MobileTabBar.tsx`
- Modify: `src/components/navbar/NavMenu.tsx:17`
- Modify: `src/app/(main)/layout.tsx`

**Interfaces:**
- Consumes: the `desktop:` variant from Task 1.
- Produces: `navLinks: NavLink[]` where `NavLink = { label: string; href: string; icon: LucideIcon }`, and a default-exported `MobileTabBar` component taking no props.

- [ ] **Step 1: Rewrite `navLinks.ts` as the single source of truth**

Replace the entire contents of `src/components/navbar/navLinks.ts`:

```ts
import { Backpack, LayoutGrid, Rocket, Store, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Single source of truth for primary navigation. Consumed by both NavMenu
 * (desktop row) and MobileTabBar (bottom bar), so the two can never drift.
 *
 * "Hangar" points at /missions deliberately — it preserves existing team
 * vocabulary. The /hangar route is the post-accept step (pick player, then
 * Play) reached from MissionPanel, not a top-level destination.
 */
export const navLinks: NavLink[] = [
  { label: "Menu", href: "/", icon: LayoutGrid },
  { label: "Hangar", href: "/missions", icon: Rocket },
  { label: "Store", href: "/store", icon: Store },
  { label: "Inventory", href: "/inventory", icon: Backpack },
  { label: "Ranking", href: "/ranking", icon: Trophy },
];
```

`Trophy` matches the icon already used for the Leaderboard floating button in `(main)/page.tsx`, so the two entry points read as the same destination.

- [ ] **Step 2: Create `MobileTabBar`**

Create `src/components/navbar/MobileTabBar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "./navLinks";

const MobileTabBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-primary-orange/50 bg-black/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] desktop:hidden"
    >
      <ul className="flex">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? "text-primary-orange" : "text-white/60"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
```

The `link.href === "/"` special case matters: without it, `pathname.startsWith("/")` is true on every route and Menu would always render as active.

- [ ] **Step 3: Point the desktop nav at the new breakpoint**

In `src/components/navbar/NavMenu.tsx:17`, change `hidden md:flex` to `hidden desktop:flex`:

```tsx
      className={`hidden desktop:flex items-center space-x-6 ${className}`}
```

Then make `NavMenu` consume the shared type rather than redeclaring its own shape. Add the import:

```tsx
import type { NavLink as NavLinkItem } from "./navLinks";
```

and replace the `links` field of `NavMenuProps`:

```tsx
  links: NavLinkItem[];
```

The old inline shape would still compile — `NavLink[]` is structurally assignable to it — but redeclaring the shape in two files is how the drift being fixed here started. The alias avoids colliding with the `NavLink` *component* already imported on line 2.

- [ ] **Step 4: Render the tab bar and reserve space for it**

In `src/app/(main)/layout.tsx`, add the import alongside the other component imports:

```tsx
import MobileTabBar from "@/components/navbar/MobileTabBar";
```

Then replace the returned layout tree's outer `<div>` and its contents:

```tsx
        <div className="flex flex-col min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] desktop:pb-0">
          <div className="lg:px-[5.625rem] flex-1">
            <div className="overlay" />
            <Navbar />
            <DailyLoginRewardsGate />
            {children}
          </div>
          <Footer />
        </div>
        <MobileTabBar />
```

`3.5rem` is 56px, matching the `h-14` tab links. The bar is `position: fixed` and therefore out of flow, so without this padding it would sit on top of the footer.

- [ ] **Step 5: Verify navigation works on mobile**

At a 390px-wide viewport, load `http://localhost:3000/missions`. Confirm:

1. A five-item bar is pinned to the bottom: MENU, HANGAR, STORE, INVENTORY, RANKING.
2. HANGAR is highlighted orange (because `/missions` is its href), the others are dimmed.
3. Tapping each tab navigates, and the highlight follows.
4. Scrolling to the bottom of the page shows the footer fully, not hidden behind the bar.
5. At ≥1200px the bar is gone and the desktop nav row is present — now with a fifth "Ranking" link.

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit
```

Expected: clean. If `NavMenu` reports a type error on `links`, fix `navLinks.ts` — the shared type is authoritative and must not be loosened to accommodate a consumer.

- [ ] **Step 7: Commit — checkpoint, requires approval**

```bash
git add src/components/navbar/navLinks.ts src/components/navbar/MobileTabBar.tsx src/components/navbar/NavMenu.tsx "src/app/(main)/layout.tsx"
git commit -m "feat(mobile): add bottom tab bar and share nav links with desktop"
```

---

## Task 4: Compact mobile footer

**Files:**
- Modify: `src/components/footer/Footer.tsx:13-40`

**Interfaces:**
- Consumes: the `desktop:` variant from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Make the footer compact below the breakpoint**

Replace the returned JSX of `src/components/footer/Footer.tsx` with:

```tsx
  return (
    <footer className="relative w-full bg-gradient-to-t from-black via-black/90 to-transparent text-white py-3 desktop:py-6">
      <div className="container mx-auto flex flex-row flex-wrap desktop:flex-nowrap justify-between items-center gap-3 desktop:gap-6 px-4">
        <div className="flex-shrink-0">
          <Image
            src="/img/logo_horizontal.svg"
            alt="Outer Sports Ballers"
            width={160}
            height={50}
            className="w-24 h-auto desktop:w-40"
          />
        </div>

        <Button className="hidden desktop:inline-flex bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-full px-6 py-2">
          SUPPORT
        </Button>

        <div className="flex items-center gap-4 text-cyan-400">
          <Instagram className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <X className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
          <Youtube className="w-5 h-5 desktop:w-6 desktop:h-6 cursor-pointer hover:text-cyan-300 transition-colors" />
        </div>

        <a
          href="#"
          className="desktop:hidden text-xs text-cyan-400 underline underline-offset-2"
        >
          Support
        </a>

        <div className="text-xs desktop:text-sm text-orange-32 flex items-center gap-1">
          <span>©</span> All rights reserved
        </div>
      </div>
    </footer>
  );
```

The full-size SUPPORT button is replaced below `desktop:` by a text link, so support stays reachable without a second large control competing with the tab bar.

- [ ] **Step 2: Verify the height drop**

At 390px width, load any route, scroll to the bottom, and run in the console:

```js
Math.round(document.querySelector('footer').getBoundingClientRect().height)
```

Expected: roughly 72–90, down from 244. At ≥1200px the footer must look exactly as it did before.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit — checkpoint, requires approval**

```bash
git add src/components/footer/Footer.tsx
git commit -m "feat(mobile): compact footer below desktop breakpoint"
```

---

## Task 5: Home — CSS branching, canvas gate, and layout math

**Files:**
- Modify: `src/app/(main)/page.tsx:17,30,41,42,140` and the surrounding JSX
- Delete: `src/hooks/useIsMobile.ts`

**Interfaces:**
- Consumes: `useMediaQuery` from Task 2; the `desktop:` variant from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Swap the hook import**

In `src/app/(main)/page.tsx`, replace line 17:

```tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";
```

and replace line 30:

```tsx
  const isDesktop = useMediaQuery("(min-width: 1200px)");
```

- [ ] **Step 2: Replace the JS ternary with CSS-gated wrappers**

The component currently reads `{isMobile ? ( <mobile tree/> ) : ( <desktop tree/> )}`. Replace that ternary with two sibling wrappers that keep **both trees in the markup**, toggled by CSS. Keep the contents of each tree exactly as they are today — only the wrappers change.

Replace `{isMobile ? (` and its opening `<>` with:

```tsx
      <div className="desktop:hidden">
```

Replace the `) : (` divider and its opening `<>` with:

```tsx
      </div>

      <div className="hidden desktop:block">
```

Replace the closing `</>` and `)}` at the end of the branch with:

```tsx
      </div>
```

- [ ] **Step 3: Gate the Three.js canvas**

Inside the new desktop wrapper, `<HomeScene />` must not mount on phones — CSS `hidden` still mounts a component, which would run Three.js invisibly and drain battery. Change it to:

```tsx
        {isDesktop && <HomeScene />}
```

This is the only remaining JS layout branch in the file, and it is safe: 3D content cannot paint before hydration regardless, so desktop loses nothing.

- [ ] **Step 4: Remove the hardcoded height math**

Replace the root element's className (currently `min-h-[calc(100dvh-104px-91.83px)]`):

```tsx
    <div className="relative mx-auto w-full overflow-auto rounded-2xl border-0 shadow thin-scroll">
```

The `91.83px` was a desktop footer measurement; the real mobile footer was 244px before Task 4 and is ~80px after, so the constant was wrong either way. `(main)/layout.tsx` already supplies `flex flex-col min-h-screen` with a `flex-1` child, so height comes from the flex chain and no pixel constants are needed.

- [ ] **Step 5: Normalise the tile heights**

Two of the four mobile tiles use `h-[72px]` and two use `h-18`. Both resolve to 72px in Tailwind 4, so this is a consistency fix with no visual change. Change the two `h-18` occurrences (the STORE and PROFILE tiles) to `h-[72px]`.

- [ ] **Step 6: Delete the obsolete hook**

```bash
rm src/hooks/useIsMobile.ts
```

- [ ] **Step 7: Verify no references to the deleted hook remain**

```bash
grep -rn "useIsMobile" src/
```

Expected: no output. If anything is returned, migrate it to `useMediaQuery` before continuing — the build will fail otherwise.

- [ ] **Step 8: Verify Home on both sides of the breakpoint**

At 390px: the four tiles render, the three floating buttons (events, leaderboard, notifications) are present, and no 3D canvas exists. Confirm with:

```js
document.querySelectorAll('canvas').length
```

Expected: `0` at 390px, `1` at ≥1200px.

At ≥1200px: the cockpit scene, avatar, exit control and floating column all render exactly as before.

Also confirm the first paint on mobile no longer flashes the desktop tree — hard-reload at 390px and watch the initial frame.

- [ ] **Step 9: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 10: Commit — checkpoint, requires approval**

```bash
git add "src/app/(main)/page.tsx" src/hooks/useIsMobile.ts
git commit -m "feat(mobile): move home layout branching to CSS and gate 3D canvas"
```

---

## Task 6: Mission terminal

**Files:**
- Modify: `src/components/missions/MissionPanel.tsx:109-116,150-198`
- Modify: `src/components/missions/MissionDetailsCard.tsx:32`

**Interfaces:**
- Consumes: the `desktop:` variant from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Remove the nested scroll container on mobile**

In `src/components/missions/MissionPanel.tsx`, replace the scrolling wrapper `<div>` (currently `max-h-[320px] overflow-y-auto custom-scroll-thin pr-1`):

```tsx
              <div className="desktop:max-h-[320px] desktop:overflow-y-auto custom-scroll-thin pr-1">
```

On phones the page scrolls naturally instead of trapping the list in a third nested scroll layer. Desktop keeps the capped, scrollable panel.

- [ ] **Step 2: Make the console art decorative and add mobile controls**

Replace the whole console block — the `<div className="w-full max-w-4xl mt-4 relative">` element and everything inside it, through its closing `</div>` — with the following.

**The desktop overlay markup and its translate values are copied verbatim and must not be altered.** They are correct because the container is capped at `max-w-4xl` (896px), which every viewport ≥1200px reaches, so the pixel offsets never drift on desktop.

```tsx
      <div className="w-full max-w-4xl mt-4 relative">
        <Image
          src="/img/missions/console_mission.svg"
          alt=""
          aria-hidden="true"
          width={1520}
          height={566}
          className="w-full h-auto select-none pointer-events-none"
        />

        {/* Desktop: controls overlaid on the painted console slots. */}
        <div className="absolute inset-0 hidden desktop:flex items-center">
          <div className="w-[22%] flex justify-center translate-x-25 -translate-y-5">
            <Image
              src="/img/missions/arrow_hover_left.svg"
              alt="Previous mission"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={handlePrev}
            />
          </div>

          <div className="w-[22%] flex justify-center translate-x-5 -translate-y-5">
            <Image
              src="/img/missions/arrow_hover_right.svg"
              alt="Next mission"
              width={300}
              height={300}
              className="w-[70%] h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={handleNext}
            />
          </div>

          <div className="flex-1 flex justify-center -translate-x-6 -translate-y-6">
            <Image
              src="/img/missions/button_hover_accept.svg"
              alt="Accept mission"
              width={600}
              height={600}
              className={`w-[65%] h-auto cursor-pointer hover:scale-105 transition-transform ${
                isAccepting ? "opacity-60 pointer-events-none" : ""
              }`}
              onClick={handleAccept}
            />
          </div>
        </div>
      </div>

      {/* Mobile: real buttons beneath the (now decorative) console art. */}
      <div className="mt-4 flex w-full max-w-4xl items-center gap-2 desktop:hidden">
        <button
          type="button"
          onClick={handlePrev}
          disabled={missions.length === 0}
          aria-label="Previous mission"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-primary-orange bg-orange-24 text-2xl leading-none text-primary-orange disabled:opacity-40"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={handleAccept}
          disabled={missions.length === 0 || isAccepting}
          className="h-11 flex-1 rounded-xl border border-[#ffd9a0] bg-gradient-to-b from-[#ff7a45] to-[#d63a12] text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_3px_12px_rgba(255,80,20,0.45)] disabled:opacity-40"
        >
          {isAccepting ? "Accepting..." : "Accept"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={missions.length === 0}
          aria-label="Next mission"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-primary-orange bg-orange-24 text-2xl leading-none text-primary-orange disabled:opacity-40"
        >
          ›
        </button>
      </div>
```

`h-11` is 44px, the accessible tap-target minimum. The `disabled` states surface a failure that is silent today: `handlePrev` and `handleNext` already early-return when the list is empty, with no visible feedback.

- [ ] **Step 3: Stack the mission detail header on narrow screens**

In `src/components/missions/MissionDetailsCard.tsx:32`, replace the header row's className:

```tsx
      <div className="flex flex-col sm:flex-row items-start justify-between gap-1 sm:gap-4 pr-6">
```

This stops the title wrapping to three lines beside the mission ID. The three-column requirements grid below it already collapses correctly via `sm:grid-cols-[...]`.

- [ ] **Step 4: Verify the mission terminal at 390px**

Load `http://localhost:3000/missions` at 390px width and confirm:

1. The console art renders with **no** controls overlaid on it.
2. A `‹` / **ACCEPT** / `›` row sits directly beneath the art, full width, each control at least 44px tall.
3. With missions available, ACCEPT navigates to `/hangar` on success.
4. With no missions available, all three buttons render visibly disabled.
5. The mission list scrolls with the page — no inner scrollbar.
6. The mission title does not wrap beside the mission ID.

At ≥1200px confirm the console looks **pixel-identical** to before this task, with controls sitting correctly in their painted slots.

- [ ] **Step 5: Run the overflow check**

Paste the Task 1 Step 7 snippet into the console at 390px and at 360px on `/missions`.

Expected: `pass: true` at both widths.

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 7: Commit — checkpoint, requires approval**

```bash
git add src/components/missions/MissionPanel.tsx src/components/missions/MissionDetailsCard.tsx
git commit -m "fix(mobile): usable mission terminal controls below desktop breakpoint"
```

---

## Task 7: Ranking

Two independent defects with two independent causes — do not conflate them.

**Files:**
- Modify: `src/components/ranking/GlobalLeaderboard.tsx:55,74,77,118,123,161`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Stop the page scrolling sideways**

The horizontal scroll on `/ranking` comes from the decorative blur blob at line 57 — it is `w-96` (384px) with `left-1/2 -translate-x-1/2`, so in a 375px viewport it spans −4px to 380px, and its parent does not clip.

In `src/components/ranking/GlobalLeaderboard.tsx:55`, add `overflow-x-hidden` to the root container:

```tsx
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
```

Do not shrink the blob — its size produces the intended glow.

- [ ] **Step 2: Narrow the rank column on mobile**

Line 74:

```tsx
                <TableHead className="w-14 md:w-[100px] text-center font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6">Rank</TableHead>
```

56px comfortably fits the `w-6` crown and medal icons.

- [ ] **Step 3: Reduce the right padding on mobile**

Line 77:

```tsx
                <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6 pr-4 md:pr-8">Total XP</TableHead>
```

Line 161:

```tsx
                  <TableCell className="text-right py-5 pr-4 md:pr-8">
```

- [ ] **Step 4: Truncate the username**

This is what actually forces the table wider than the viewport. Line 118 — add `min-w-0` so the flex child is allowed to shrink:

```tsx
                      <div className="flex flex-col min-w-0">
```

Line 119-124 — add `truncate` to the username span:

```tsx
                        <span className={cn(
                          "font-bold text-lg tracking-tight group-hover:text-white transition-colors truncate",
                          user.rank <= 3 ? "text-white" : "text-zinc-400"
                        )}>
                          {user.username}
                        </span>
```

Note the containing `<div className="flex items-center gap-4">` at line 98 also needs `min-w-0` for the truncation to take effect through both flex levels:

```tsx
                    <div className="flex items-center gap-4 min-w-0">
```

- [ ] **Step 5: Verify Total XP is visible without sideways scrolling**

Load `http://localhost:3000/ranking` at 390px. Confirm:

1. The **Total XP** column header and every score value are fully visible on screen.
2. Long usernames (e.g. `josenatividadcv_122`) truncate with an ellipsis rather than pushing the table wide.
3. The table no longer needs to be dragged sideways.

Then run in the console:

```js
(() => { const t = document.querySelector('table');
  return { table: Math.round(t.getBoundingClientRect().width),
           viewport: document.documentElement.clientWidth }; })()
```

Expected: table width ≤ viewport width.

- [ ] **Step 6: Run the overflow check**

Paste the Task 1 Step 7 snippet at 390px and 360px on `/ranking`.

Expected: `pass: true`. Before this task it returned `scrollWidth: 380, clientWidth: 375, pass: false`.

- [ ] **Step 7: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 8: Commit — checkpoint, requires approval**

```bash
git add src/components/ranking/GlobalLeaderboard.tsx
git commit -m "fix(mobile): show leaderboard scores and stop horizontal scroll"
```

---

## Task 8: Store and Inventory filter rows

**Files:**
- Modify: `src/app/(main)/store/page.tsx:73,84,99`
- Modify: `src/app/(main)/inventory/page.tsx:121,123` plus the four heading occurrences

**Interfaces:**
- Consumes: the `desktop:` variant from Task 1 (used only for the inventory heading).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Stack the Store filter row**

In `src/app/(main)/store/page.tsx`, replace the filter row container (line 73):

```tsx
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-3">
```

Replace the `SelectTrigger` className (line 84):

```tsx
          <SelectTrigger className="w-full sm:w-[300px] text-white bg-orange-dark cursor-pointer">
```

Replace the search wrapper (line 99):

```tsx
        <div className="relative w-full sm:w-[300px]">
```

- [ ] **Step 2: Stack the Inventory filter row**

In `src/app/(main)/inventory/page.tsx`, replace the filter row container (line 121):

```tsx
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between gap-3">
```

Replace the `SelectTrigger` className (line 123):

```tsx
          <SelectTrigger className="w-full sm:w-[300px] text-white bg-orange-dark cursor-pointer">
```

- [ ] **Step 3: Scale the Inventory heading**

The `text-5xl` heading spans nearly the full 390px and clips at 360px. It appears in **four** places in this file — the loading state, the error state, the empty state, and the loaded state. Change every occurrence of:

```tsx
        <p className="text-secondary text-5xl font-bold mt-14 mb-6">
```

to:

```tsx
        <p className="text-secondary text-3xl desktop:text-5xl font-bold mt-14 mb-6">
```

Verify all four were changed:

```bash
grep -c "text-3xl desktop:text-5xl" "src/app/(main)/inventory/page.tsx"
```

Expected: `4`.

- [ ] **Step 4: Verify at 360px and 390px**

On `/store`, confirm the type dropdown and the search field are stacked, each full width, with a visible gap. Before this task they squashed to 177px and 166px and touched edge-to-edge.

On `/inventory`, confirm the same for the dropdown and that "My inventory" fits comfortably on one line at 360px.

- [ ] **Step 5: Run the overflow check**

Paste the Task 1 Step 7 snippet at 360px and 390px on `/store` and `/inventory`.

Expected: `pass: true` on both.

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 7: Commit — checkpoint, requires approval**

```bash
git add "src/app/(main)/store/page.tsx" "src/app/(main)/inventory/page.tsx"
git commit -m "fix(mobile): stack store and inventory filter rows"
```

---

## Task 9: Hangar CTA and gameplay viewport height

**Files:**
- Modify: `src/app/(main)/hangar/page.tsx:81,82,98`
- Modify: `src/components/gameplay/ThreeGameplayCanvas.tsx:96`

**Interfaces:**
- Consumes: the `desktop:` variant from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Make the Hangar CTA card full-width and left-aligned on mobile**

In `src/app/(main)/hangar/page.tsx`, replace the CTA column wrapper (line 81):

```tsx
        <div className="md:col-start-3 md:row-start-1 flex justify-stretch desktop:justify-end">
```

Replace the card itself (line 82):

```tsx
          <div className="w-full desktop:max-w-[320px] rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 text-left desktop:text-right text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
```

Replace the helper text (line 98):

```tsx
              <p className="mt-2 text-[11px] text-slate-100/75 text-left desktop:text-right">
```

Right-aligned body text reads as a rendering fault in a narrow single column.

- [ ] **Step 2: Fix the gameplay canvas height**

In `src/components/gameplay/ThreeGameplayCanvas.tsx:96`, replace the Canvas style:

```tsx
        style={{ height: "100dvh", width: "100vw" }}
```

`100vh` on mobile browsers excludes the collapsible URL bar, so the canvas overflowed the visible area. `100dvh` tracks the dynamic viewport. The canvas takes no player input — it renders live box scores over a socket — so no touch controls are needed.

- [ ] **Step 3: Verify**

On `/hangar` at 390px: the CTA card spans the full column width, its heading and helper text are left-aligned, and the PLAY button is full width.

On `/game-play` at 390px: the canvas fills the viewport with no vertical overflow and no page scrollbar. Because the route needs `gameId` and `playerId` query params, reach it by accepting a mission and selecting a player, or load a URL with both params set.

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 5: Commit — checkpoint, requires approval**

```bash
git add "src/app/(main)/hangar/page.tsx" src/components/gameplay/ThreeGameplayCanvas.tsx
git commit -m "fix(mobile): hangar CTA layout and dynamic viewport height for gameplay"
```

---

## Task 10: Full verification sweep

No code changes unless a defect is found. This is the acceptance gate for the whole plan.

**Files:**
- Modify: only files where this sweep uncovers a defect.

**Interfaces:**
- Consumes: every preceding task.
- Produces: the evidence shown to Oscar for sign-off.

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: succeeds. `ignoreBuildErrors` is off, so any type error fails here.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no new warnings introduced by this work. Pre-existing warnings are acceptable.

- [ ] **Step 3: Overflow check across every route at every target width**

For each width in **360, 390, 768, 1200** and each route in `/`, `/missions`, `/hangar`, `/store`, `/inventory`, `/ranking`, `/profile`, run the Task 1 Step 7 snippet.

Expected: `pass: true` for all 28 combinations. Record any failure with its `firstOffenders` output and fix before proceeding.

- [ ] **Step 4: Navigation reachability**

At 390px, starting from `/missions`, reach every one of Store, Inventory, Ranking and Menu **without** passing through Home. This is the exact complaint that opened this work.

Then confirm Profile and Log out are both reachable from the avatar dropdown, and that the dropdown shows XP, coins and gems on mobile.

- [ ] **Step 5: Confirm desktop is unchanged**

At 1440px, walk all seven routes and compare against `git stash`-ed originals or pre-change screenshots. The **only** intended desktop difference in this entire plan is the new Ranking link in the nav row.

- [ ] **Step 6: Breakpoint boundary check**

Resize slowly across 1200px on `/` and `/missions`. Confirm exactly one layout swap at 1200 with no flicker, no duplicated navigation, and no period where both the tab bar and the desktop nav row are visible.

- [ ] **Step 7: Verify no orphaned code remains**

```bash
grep -rn "useIsMobile\|background-attachment" src/
```

Expected: no output.

- [ ] **Step 8: Capture before/after screenshots**

Capture all seven routes at 390px. Pair them with the "before" captures from the audit for the stakeholder who reported the issue.

- [ ] **Step 9: Final commit — checkpoint, requires approval**

Only if Step 3 or Step 5 required fixes:

```bash
git add -A
git commit -m "fix(mobile): resolve issues found in final verification sweep"
```

---

## Self-Review Notes

**Spec coverage** — every numbered audit finding maps to a task: #1 → Task 3; #2 → Task 6; #3a and #3b → Task 7; #4 → Task 8; #5 → Task 4; #6 → Tasks 2 and 5; #7 → Task 1. Supporting spec items also covered: viewport meta → Task 1; `MissionDetailsCard` → Task 6; hangar and gameplay → Task 9; verification protocol → Task 10.

**Deliberately excluded**, per the spec's Out of Scope section: the `inventory/page.tsx` early-return trap that strands users on an empty filter, gameplay touch controls (not applicable — spectator view), and the three known backend limitations.

**Ordering constraint** — `useIsMobile.ts` cannot be deleted until *both* consumers are migrated. Task 2 migrates the rewards modal; Task 5 migrates Home and performs the deletion. Running Task 5 before Task 2 will break the build.
