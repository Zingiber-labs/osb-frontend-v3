# Cinematic HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain top strip on the game screen with a cinematic heads-up display (corner panels with slashed bars, mission title card, play ticker, restyled result screen) over a full-bleed scene, without touching the engine, feeds, renderer or the scenario bridge.

**Architecture:** A `components/hud/` folder of small React + Tailwind components absolutely positioned over the canvas, fed by the existing `ScenarioState`. Two hooks supply what the state lacks: `usePlayLog` subscribes to the feed for the last four labeled plays, and `useMissionCard` turns state transitions into timed cards through a pure `cardFor` function. The running game renders in a fixed full-viewport layer, which covers the site header. The result overlay is restyled and gains a true in-place Replay by remounting the canvas.

**Tech Stack:** Vite 8, React 19, TypeScript 6 strict, Tailwind 4 (CSS-first `@theme`), tw-animate-css, `@fontsource-variable/orbitron`, Vitest 5 + React Testing Library (jsdom).

Spec: `docs/superpowers/specs/2026-11-03-cinematic-hud-design.md`.

## Global Constraints

- TypeScript strict with `erasableSyntaxOnly` (no enums, no constructor parameter properties) and `verbatimModuleSyntax` (`import type` for types); `noUnusedLocals`/`noUnusedParameters` fail the build.
- Engine (`features/gameplay/engine/`), feeds, renderer, `hooks/useScenario.ts`, the sandbox and the rules page do not change.
- Palette tokens, verbatim: mine `#38bdf8`, gold `#fbbf24`, theirs `#f43f5e`, chrome `#64748b` (same values as `CALLOUT_COLORS` in the renderer).
- Typeface: `@fontsource-variable/orbitron` exposed as `--font-display` (`font-display` utility) for labels, headings and large numbers; Geist stays for body text. Labels uppercase, wide tracking, `tabular-nums` for numbers.
- Bars: hull = 20 segments of 5 points, shield = 3 segments; hull turns rose below 25 %.
- Timings: panels fade in 400 ms; mission card 4000 ms at tip-off, 3000 ms for objective met, period change and final; value-change glow 300 ms.
- The score element keeps `data-testid="score"` and the text `${home.abbreviation} ${home} - ${away} ${away.abbreviation}`; hull keeps `role="progressbar"` with `aria-label="hull"`; the result screen keeps the text "MISSION SUCCESS" / "MISSION FAILED" (existing page test contract).
- `prefers-reduced-motion`: use Tailwind's `motion-safe:` variant on every animation and transition class so reduced motion gets none.
- Every HUD element is `pointer-events-none` except the Exit button and the result screen buttons.
- Commits: Oscar authorizes per-task commits for this phase (confirmed at execution start); messages never mention Claude or AI assistance. Branch `feat/cinematic-hud` from master 44d77e6.
- Visual checks: `npm run dev` (port 5173), screenshots via Claude in Chrome or `agent-browser screenshot <absolute path>` (never `wait --load networkidle`).

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/index.css` (modified) | Orbitron import, `--font-display`, HUD color tokens |
| `src/features/gameplay/components/hud/format.ts` (new) | `periodLabel`, `formatClock`, `STAT_LABEL` (moved from `Hud.tsx`) |
| `src/features/gameplay/components/hud/SegmentBar.tsx` (new) | Slanted segment bar with progressbar semantics |
| `src/features/gameplay/components/hud/useFlashOnChange.ts` (new) | `true` for 300 ms after a value changes |
| `src/features/gameplay/components/hud/ClockPanel.tsx` (new) | Period, clock, LIVE dot, Exit button |
| `src/features/gameplay/components/hud/ScorePanel.tsx` (new) | NBA score, my player's line |
| `src/features/gameplay/components/hud/StatusPanel.tsx` (new) | Hull and shield bars |
| `src/features/gameplay/components/hud/CountersPanel.tsx` (new) | Kills and combo |
| `src/features/gameplay/components/hud/usePlayLog.ts` (new) | Last four labeled plays from the feed |
| `src/features/gameplay/components/hud/PlayTicker.tsx` (new) | Chips |
| `src/features/gameplay/components/hud/missionCard.ts` (new) | Pure `cardFor(prev, next, ctx)` |
| `src/features/gameplay/components/hud/useMissionCard.ts` (new) | Timed card from state transitions |
| `src/features/gameplay/components/hud/MissionCard.tsx` (new) | Card presentation |
| `src/features/gameplay/components/hud/HudOverlay.tsx` (new) | Places everything; replaces `Hud.tsx` |
| `src/features/gameplay/components/ResultOverlay.tsx` (modified) | Cinematic result, Replay + Back to setup |
| `src/features/gameplay/components/GamePlayPage.tsx` (modified) | Fixed full-bleed layer, exit, in-place replay |
| `src/features/gameplay/components/Hud.tsx` (deleted) | |
| `CLAUDE.md`, `README.md` (modified) | HUD notes |

---

### Task 1: Font, tokens and the segment bar

**Files:**
- Modify: `package.json`, `src/index.css`
- Create: `src/features/gameplay/components/hud/format.ts`
- Create: `src/features/gameplay/components/hud/SegmentBar.tsx`
- Create: `src/features/gameplay/components/hud/SegmentBar.test.tsx`
- Create: `src/features/gameplay/components/hud/format.test.ts`

**Interfaces:**
- Produces: `periodLabel(period: number): string` (`Q1`..`Q4`, `OT1`...), `formatClock(secondsLeft: number): string` (`m:ss`), `STAT_LABEL: Record<MissionStat, string>`; `<SegmentBar label value max segments low? tone? />` rendering `role="progressbar"` with `aria-label={label}`, `aria-valuemin={0}`, `aria-valuemax={max}`, `aria-valuenow={value}`, each segment `data-filled="true"|"false"`; Tailwind utilities `font-display`, `text-hud-mine`, `bg-hud-mine`, `text-hud-gold`, `text-hud-theirs`, `text-hud-chrome`, `border-hud-chrome`.

- [ ] **Step 1: Install the font and add tokens**

```bash
npm install @fontsource-variable/orbitron
```

In `src/index.css`, after `@import "@fontsource-variable/geist";` add `@import "@fontsource-variable/orbitron";`, and inside the `@theme inline { ... }` block add:

```css
  --font-display: 'Orbitron Variable', sans-serif;
  --color-hud-mine: #38bdf8;
  --color-hud-gold: #fbbf24;
  --color-hud-theirs: #f43f5e;
  --color-hud-chrome: #64748b;
```

- [ ] **Step 2: Write the failing tests**

`src/features/gameplay/components/hud/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatClock, periodLabel, STAT_LABEL } from "./format";

describe("format", () => {
  it("labels regulation periods and overtime", () => {
    expect(periodLabel(1)).toBe("Q1");
    expect(periodLabel(4)).toBe("Q4");
    expect(periodLabel(5)).toBe("OT1");
    expect(periodLabel(6)).toBe("OT2");
  });

  it("formats the clock as m:ss", () => {
    expect(formatClock(720)).toBe("12:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
  });

  it("has a label per mission stat", () => {
    expect(STAT_LABEL).toEqual({ pts: "PTS", blk: "BLK", stl: "STL" });
  });
});
```

`src/features/gameplay/components/hud/SegmentBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SegmentBar } from "./SegmentBar";

const filled = (c: HTMLElement) => c.querySelectorAll('[data-filled="true"]').length;
const empty = (c: HTMLElement) => c.querySelectorAll('[data-filled="false"]').length;

describe("SegmentBar", () => {
  it("exposes progressbar semantics and fills proportionally, rounding up", () => {
    const { container } = render(<SegmentBar label="hull" value={62} max={100} segments={20} />);
    const bar = screen.getByRole("progressbar", { name: "hull" });
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(filled(container)).toBe(13);
    expect(empty(container)).toBe(7);
  });

  it("keeps one segment lit at the hull floor and none at zero", () => {
    const a = render(<SegmentBar label="hull" value={1} max={100} segments={20} />);
    expect(filled(a.container)).toBe(1);
    a.unmount();
    const b = render(<SegmentBar label="shield" value={0} max={3} segments={3} />);
    expect(filled(b.container)).toBe(0);
    expect(empty(b.container)).toBe(3);
  });

  it("marks the low state", () => {
    const { container } = render(<SegmentBar label="hull" value={20} max={100} segments={20} low />);
    expect(container.firstElementChild).toHaveAttribute("data-low", "true");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/components/hud`
Expected: FAIL, modules `./format` and `./SegmentBar` not found.

- [ ] **Step 4: Write `format.ts`**

```ts
import type { MissionStat } from "@/features/gameplay/engine/types";

export const STAT_LABEL: Record<MissionStat, string> = { pts: "PTS", blk: "BLK", stl: "STL" };

export function periodLabel(period: number): string {
  return period <= 4 ? `Q${period}` : `OT${period - 4}`;
}

export function formatClock(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = Math.floor(secondsLeft % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
```

- [ ] **Step 5: Write `SegmentBar.tsx`**

```tsx
export type BarTone = "mine" | "gold" | "theirs";

type Props = {
  label: string;
  value: number;
  max: number;
  segments: number;
  low?: boolean;
  tone?: BarTone;
  /** Extra classes on the wrapper, for one-off flashes. */
  className?: string;
};

const TONE_FILL: Record<BarTone, string> = {
  mine: "bg-hud-mine shadow-[0_0_6px_#38bdf8]",
  gold: "bg-hud-gold shadow-[0_0_6px_#fbbf24]",
  theirs: "bg-hud-theirs shadow-[0_0_6px_#f43f5e]",
};

/** Row of slanted segments; lost segments stay as dim outlines. */
export function SegmentBar({ label, value, max, segments, low = false, tone = "mine", className = "" }: Props) {
  const lit = Math.min(segments, Math.max(0, Math.ceil((value / max) * segments)));
  const fill = low ? TONE_FILL.theirs : TONE_FILL[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-low={low ? "true" : "false"}
      className={`flex gap-[3px] ${className}`}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            data-filled={on ? "true" : "false"}
            className={`h-3 w-1.5 -skew-x-[20deg] md:w-2 motion-safe:transition-colors motion-safe:duration-300 ${on ? fill : "border border-hud-chrome/60 bg-transparent"}`}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/components/hud`
Expected: PASS, 6 tests. Also `npx tsc -p tsconfig.app.json --noEmit` clean and `npm run build` succeeds (proves the CSS tokens compile).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/index.css src/features/gameplay/components/hud/format.ts src/features/gameplay/components/hud/format.test.ts src/features/gameplay/components/hud/SegmentBar.tsx src/features/gameplay/components/hud/SegmentBar.test.tsx
git commit -m "feat(hud): display font, HUD color tokens and the slashed segment bar"
```

---

### Task 2: Corner panels

**Files:**
- Create: `src/features/gameplay/components/hud/useFlashOnChange.ts`
- Create: `src/features/gameplay/components/hud/ClockPanel.tsx`
- Create: `src/features/gameplay/components/hud/ScorePanel.tsx`
- Create: `src/features/gameplay/components/hud/StatusPanel.tsx`
- Create: `src/features/gameplay/components/hud/CountersPanel.tsx`
- Create: `src/features/gameplay/components/hud/panels.test.tsx`

**Interfaces:**
- Consumes: Task 1.
- Produces: `useFlashOnChange(value: unknown, ms = 300): boolean`; `<ClockPanel clock onExit />`, `<ScorePanel clock game myTeamId stats />`, `<StatusPanel hull shield />`, `<CountersPanel kills combo />`. Each panel's root has `data-hud-panel="clock|score|status|counters"`. The Exit button is `<button>` named "Exit" with `pointer-events-auto`.

- [ ] **Step 1: Write the failing tests**

`src/features/gameplay/components/hud/panels.test.tsx`:

```tsx
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games } from "@/fixtures/games";
import { ClockPanel } from "./ClockPanel";
import { CountersPanel } from "./CountersPanel";
import { ScorePanel } from "./ScorePanel";
import { StatusPanel } from "./StatusPanel";
import { useFlashOnChange } from "./useFlashOnChange";

const game = games[0];

describe("useFlashOnChange", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is false initially, true right after a change, false 300 ms later", () => {
    const { result, rerender } = renderHook(({ v }) => useFlashOnChange(v), { initialProps: { v: 1 } });
    expect(result.current).toBe(false);
    rerender({ v: 2 });
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(false);
  });
});

describe("ClockPanel", () => {
  it("shows period, clock and a working exit button", () => {
    const onExit = vi.fn();
    render(<ClockPanel clock={{ period: 5, secondsLeft: 65, home: 0, away: 0 }} onExit={onExit} />);
    expect(screen.getByText("OT1")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("ScorePanel", () => {
  it("keeps the score text contract and colors my team", () => {
    render(<ScorePanel clock={{ period: 1, secondsLeft: 700, home: 48, away: 52 }} game={game} myTeamId={game.away.id} stats={{ pts: 12, blk: 1, stl: 2, tov: 3 }} />);
    expect(screen.getByTestId("score").textContent).toBe(`${game.home.abbreviation} 48 - 52 ${game.away.abbreviation}`);
    expect(screen.getByText(game.away.abbreviation).closest("span")).toHaveClass("text-hud-mine");
    expect(screen.getByText(game.home.abbreviation).closest("span")).not.toHaveClass("text-hud-mine");
    expect(screen.getByText(/PTS 12/)).toBeInTheDocument();
    expect(screen.getByText(/TOV 3/)).toBeInTheDocument();
  });
});

describe("StatusPanel", () => {
  it("renders hull and shield bars and flags a low hull", () => {
    const { container } = render(<StatusPanel hull={20} shield={2} />);
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("progressbar", { name: "shield" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("data-low", "true");
    expect(container.querySelectorAll('[data-filled="true"]').length).toBe(4 + 2);
  });

  it("does not flag a healthy hull", () => {
    render(<StatusPanel hull={25} shield={0} />);
    expect(screen.getByRole("progressbar", { name: "hull" })).toHaveAttribute("data-low", "false");
  });
});

describe("CountersPanel", () => {
  it("shows kills and combo", () => {
    render(<CountersPanel kills={7} combo={3} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/components/hud/panels.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `useFlashOnChange.ts`**

```ts
import { useEffect, useRef, useState } from "react";

/** True for `ms` after `value` changes (not on mount). Drives the glow on score and counter changes. */
export function useFlashOnChange(value: unknown, ms = 300): boolean {
  const [flash, setFlash] = useState(false);
  const last = useRef(value);
  useEffect(() => {
    if (Object.is(last.current, value)) return;
    last.current = value;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return flash;
}
```

- [ ] **Step 4: Write the four panels**

`ClockPanel.tsx`:

```tsx
import type { Clock } from "@/features/gameplay/engine/types";
import { formatClock, periodLabel } from "./format";

type Props = { clock: Clock; onExit: () => void };

export function ClockPanel({ clock, onExit }: Props) {
  return (
    <div data-hud-panel="clock" className="flex flex-col gap-1 border-l border-t border-hud-chrome/70 pl-3 pt-2">
      <div className="flex items-baseline gap-3 font-display">
        <span className="text-xs tracking-[0.3em] text-hud-chrome">{periodLabel(clock.period)}</span>
        <span className="text-2xl tabular-nums tracking-wider text-slate-100">{formatClock(clock.secondsLeft)}</span>
        <span className="flex items-center gap-1 text-[10px] tracking-[0.3em] text-hud-theirs">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-hud-theirs motion-safe:animate-pulse" />
          LIVE
        </span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="pointer-events-auto w-fit border border-hud-chrome/60 px-2 py-0.5 font-display text-[10px] tracking-[0.3em] text-hud-chrome hover:border-hud-mine hover:text-hud-mine"
      >
        EXIT
      </button>
    </div>
  );
}
```

`ScorePanel.tsx`:

```tsx
import type { Clock, MyPlayerStats } from "@/features/gameplay/engine/types";
import type { RecordedGame } from "@/features/gameplay/feeds/types";
import { useFlashOnChange } from "./useFlashOnChange";

type Props = { clock: Clock; game: RecordedGame; myTeamId: string; stats: MyPlayerStats };

export function ScorePanel({ clock, game, myTeamId, stats }: Props) {
  const flash = useFlashOnChange(`${clock.home}-${clock.away}`);
  const team = (id: string) => (id === myTeamId ? "text-hud-mine" : "text-slate-400");
  return (
    <div data-hud-panel="score" className="flex flex-col items-end gap-1 border-r border-t border-hud-chrome/70 pr-3 pt-2 text-right">
      <span className="font-display text-[10px] tracking-[0.3em] text-hud-chrome">SCORE</span>
      <div
        data-testid="score"
        className={`font-display text-2xl tabular-nums tracking-wider text-slate-100 motion-safe:transition-[text-shadow] motion-safe:duration-300 ${flash ? "[text-shadow:0_0_12px_#38bdf8]" : ""}`}
      >
        <span className={team(game.home.id)}>{game.home.abbreviation}</span> {clock.home} - {clock.away} <span className={team(game.away.id)}>{game.away.abbreviation}</span>
      </div>
      <div className="hidden text-xs tabular-nums tracking-widest text-slate-300 md:block">
        PTS {stats.pts} · BLK {stats.blk} · STL {stats.stl} · TOV {stats.tov}
      </div>
    </div>
  );
}
```

`StatusPanel.tsx`:

```tsx
import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import { SegmentBar } from "./SegmentBar";
import { useFlashOnChange } from "./useFlashOnChange";

type Props = { hull: number; shield: number };

export const HULL_SEGMENTS = 20;

export function StatusPanel({ hull, shield }: Props) {
  const low = hull / HULL_MAX < 0.25;
  const shieldFlash = useFlashOnChange(shield);
  return (
    <div data-hud-panel="status" className="flex flex-col gap-2 border-b border-l border-hud-chrome/70 pb-2 pl-3">
      <div className="flex items-center gap-3">
        <span className="w-14 font-display text-[10px] tracking-[0.3em] text-hud-chrome">HULL</span>
        <SegmentBar label="hull" value={hull} max={HULL_MAX} segments={HULL_SEGMENTS} low={low} />
        <span className={`w-8 font-display text-sm tabular-nums ${low ? "text-hud-theirs" : "text-slate-100"}`}>{hull}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-14 font-display text-[10px] tracking-[0.3em] text-hud-chrome">SHIELD</span>
        <SegmentBar label="shield" value={shield} max={SHIELD_MAX} segments={SHIELD_MAX} className={shieldFlash ? "brightness-200" : ""} />
      </div>
    </div>
  );
}
```

`CountersPanel.tsx`:

```tsx
import { useFlashOnChange } from "./useFlashOnChange";

type Props = { kills: number; combo: number };

export function CountersPanel({ kills, combo }: Props) {
  const killFlash = useFlashOnChange(kills);
  return (
    <div data-hud-panel="counters" className="flex items-end gap-6 border-b border-r border-hud-chrome/70 pb-2 pr-3 text-right font-display">
      <div className="flex flex-col items-end">
        <span className="text-[10px] tracking-[0.3em] text-hud-chrome">KILLS</span>
        <span className={`text-2xl tabular-nums text-slate-100 ${killFlash ? "[text-shadow:0_0_12px_#38bdf8]" : ""}`}>{kills}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] tracking-[0.3em] text-hud-chrome">COMBO</span>
        {/* Keyed so a new combo value replays the zoom; a reset to 0 dims. */}
        <span key={combo} className={`text-2xl tabular-nums ${combo > 0 ? "text-hud-gold motion-safe:animate-in motion-safe:zoom-in-125 motion-safe:duration-300" : "text-slate-500"}`}>
          x{combo}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/components/hud`
Expected: PASS, 12 tests. `npx tsc -p tsconfig.app.json --noEmit` clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/components/hud
git commit -m "feat(hud): clock, score, status and counters panels"
```

---

### Task 3: Play ticker

**Files:**
- Create: `src/features/gameplay/components/hud/usePlayLog.ts`
- Create: `src/features/gameplay/components/hud/usePlayLog.test.ts`
- Create: `src/features/gameplay/components/hud/PlayTicker.tsx`

**Interfaces:**
- Consumes: `Feed` (`feed.onEvent(cb)` returns an unsubscribe), `GameEvent`, `createTestFeed` from `feeds/testFeed.ts`, `at()` from `engine/testUtils.ts`.
- Produces: `type PlayTone = "mine" | "charged" | "theirs"`, `type PlayEntry = { id: number; label: string; tone: PlayTone }`, `usePlayLog(feed: Feed | null, limit = 4): PlayEntry[]`, `toneFor(event: GameEvent): PlayTone | null` (null for events without a side), `<PlayTicker entries />`.

- [ ] **Step 1: Write the failing test**

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { at } from "@/features/gameplay/engine/testUtils";
import { createTestFeed } from "@/features/gameplay/feeds/testFeed";
import { toneFor, usePlayLog } from "./usePlayLog";

describe("toneFor", () => {
  it("colors my plays cyan, my player's scores gold, theirs rose, and ignores sideless events", () => {
    expect(toneFor({ kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at() })).toBe("mine");
    expect(toneFor({ kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() })).toBe("charged");
    expect(toneFor({ kind: "block", side: "mine", byMyPlayer: true, at: at() })).toBe("mine");
    expect(toneFor({ kind: "steal", side: "theirs", byMyPlayer: false, at: at() })).toBe("theirs");
    expect(toneFor({ kind: "period", period: 2, at: at() })).toBeNull();
    expect(toneFor({ kind: "final", at: at() })).toBeNull();
  });
});

describe("usePlayLog", () => {
  it("keeps the last four labeled plays, newest last, and skips unlabeled events", () => {
    const feed = createTestFeed();
    const { result } = renderHook(() => usePlayLog(feed));
    act(() => {
      feed.emit({ kind: "tipoff", at: at() });
      feed.emit({ kind: "score", side: "mine", points: 3, byMyPlayer: true, label: "MORANT +3", at: at() });
      feed.emit({ kind: "block", side: "theirs", byMyPlayer: false, at: at() }); // no label
      feed.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, label: "IND +2", at: at() });
      feed.emit({ kind: "steal", side: "mine", byMyPlayer: false, label: "BANE STEAL", at: at() });
      feed.emit({ kind: "turnover", side: "theirs", byMyPlayer: false, label: "IND TURNOVER", at: at() });
      feed.emit({ kind: "score", side: "mine", points: 1, byMyPlayer: false, label: "JACKSON +1", at: at() });
    });
    expect(result.current.map((e) => e.label)).toEqual(["IND +2", "BANE STEAL", "IND TURNOVER", "JACKSON +1"]);
    expect(result.current.map((e) => e.tone)).toEqual(["theirs", "mine", "theirs", "mine"]);
    const ids = result.current.map((e) => e.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("starts empty again when the feed changes and unsubscribes from the old one", () => {
    const a = createTestFeed();
    const b = createTestFeed();
    const { result, rerender } = renderHook(({ feed }) => usePlayLog(feed), { initialProps: { feed: a } });
    act(() => a.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: false, label: "X +2", at: at() }));
    expect(result.current).toHaveLength(1);
    rerender({ feed: b });
    expect(result.current).toHaveLength(0);
    act(() => a.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: false, label: "Y +2", at: at() }));
    expect(result.current).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/gameplay/components/hud/usePlayLog.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `usePlayLog.ts`**

```ts
import { useEffect, useRef, useState } from "react";
import type { GameEvent } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";

export type PlayTone = "mine" | "charged" | "theirs";
export type PlayEntry = { id: number; label: string; tone: PlayTone };

/** Same coloring as the renderer's callouts: my player's scores are the charged (gold) shots. */
export function toneFor(event: GameEvent): PlayTone | null {
  if (!("side" in event)) return null;
  if (event.side === "theirs") return "theirs";
  return event.kind === "score" && event.byMyPlayer ? "charged" : "mine";
}

/** The last `limit` labeled plays from the feed, oldest first. Resets when the feed changes. */
export function usePlayLog(feed: Feed | null, limit = 4): PlayEntry[] {
  const [entries, setEntries] = useState<PlayEntry[]>([]);
  const nextId = useRef(1);
  useEffect(() => {
    setEntries([]);
    if (!feed) return;
    return feed.onEvent((event) => {
      const tone = toneFor(event);
      if (!tone || !("label" in event) || !event.label) return;
      const entry: PlayEntry = { id: nextId.current++, label: event.label, tone };
      setEntries((prev) => [...prev, entry].slice(-limit));
    });
  }, [feed, limit]);
  return entries;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/gameplay/components/hud/usePlayLog.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write `PlayTicker.tsx`**

```tsx
import type { PlayEntry, PlayTone } from "./usePlayLog";

const TONE: Record<PlayTone, string> = {
  mine: "border-hud-mine/70 text-hud-mine",
  charged: "border-hud-gold/70 text-hud-gold",
  theirs: "border-hud-theirs/70 text-hud-theirs",
};

/** Last plays as chips, newest on the right; the oldest fades. Hidden below md. */
export function PlayTicker({ entries }: { entries: PlayEntry[] }) {
  return (
    <div data-hud-panel="ticker" aria-label="recent plays" className="hidden items-center gap-2 md:flex">
      {entries.map((e, i) => (
        <span
          key={e.id}
          className={`border px-2 py-0.5 text-xs font-semibold tracking-wider motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-300 ${TONE[e.tone]}`}
          style={{ opacity: 0.4 + (0.6 * (i + 1)) / entries.length }}
        >
          {e.label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Type-check and commit**

Run: `npx tsc -p tsconfig.app.json --noEmit` → clean.

```bash
git add src/features/gameplay/components/hud/usePlayLog.ts src/features/gameplay/components/hud/usePlayLog.test.ts src/features/gameplay/components/hud/PlayTicker.tsx
git commit -m "feat(hud): play log hook and ticker chips"
```

---

### Task 4: Mission card

**Files:**
- Create: `src/features/gameplay/components/hud/missionCard.ts`
- Create: `src/features/gameplay/components/hud/missionCard.test.ts`
- Create: `src/features/gameplay/components/hud/useMissionCard.ts`
- Create: `src/features/gameplay/components/hud/useMissionCard.test.ts`
- Create: `src/features/gameplay/components/hud/MissionCard.tsx`

**Interfaces:**
- Consumes: `ScenarioState`, `createInitialState`, `STAT_LABEL`, `periodLabel` from Task 1.
- Produces: `type CardTone = "mine" | "gold" | "neutral"`, `type MissionCardData = { eyebrow: string; headline: string; subline?: string; tone: CardTone; ms: number }`, `type CardContext = { playerName: string; matchup: string }`, `cardFor(prev: ScenarioState, next: ScenarioState, ctx: CardContext): MissionCardData | null`, `useMissionCard(state: ScenarioState, ctx: CardContext): MissionCardData | null`, `<MissionCard card />`. Durations: `TIPOFF_MS = 4000`, `EVENT_MS = 3000`.

- [ ] **Step 1: Write the failing tests**

`missionCard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "@/features/gameplay/engine/reduce";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import { cardFor, EVENT_MS, TIPOFF_MS } from "./missionCard";

const ctx = { playerName: "Ja Morant", matchup: "MEM vs IND" };
const base = (over: Partial<ScenarioState> = {}): ScenarioState => ({ ...createInitialState({ stat: "pts", target: 20 }), ...over });

describe("cardFor", () => {
  it("announces the mission at tip-off", () => {
    const card = cardFor(base(), base({ status: "live" }), ctx);
    expect(card).toEqual({ eyebrow: "MISSION", headline: "20 PTS · JA MORANT", subline: "MEM vs IND", tone: "mine", ms: TIPOFF_MS });
  });

  it("celebrates the objective once, in gold, with the count", () => {
    const prev = base({ status: "live" });
    const next = base({ status: "live", mission: { stat: "pts", target: 20, met: true }, myPlayerStats: { pts: 21, blk: 0, stl: 0, tov: 0 } });
    expect(cardFor(prev, next, ctx)).toEqual({ eyebrow: "OBJECTIVE", headline: "OBJECTIVE COMPLETE", subline: "21 / 20 PTS", tone: "gold", ms: EVENT_MS });
    expect(cardFor(next, { ...next, myPlayerStats: { pts: 23, blk: 0, stl: 0, tov: 0 } }, ctx)).toBeNull();
  });

  it("announces a period change with progress", () => {
    const prev = base({ status: "live", myPlayerStats: { pts: 14, blk: 0, stl: 0, tov: 0 } });
    const next = { ...prev, clock: { ...prev.clock, period: 3 } };
    expect(cardFor(prev, next, ctx)).toEqual({ eyebrow: "PERIOD", headline: "Q3", subline: "14 / 20 PTS", tone: "neutral", ms: EVENT_MS });
  });

  it("announces the final", () => {
    const prev = base({ status: "live", myPlayerStats: { pts: 18, blk: 0, stl: 0, tov: 0 } });
    expect(cardFor(prev, { ...prev, status: "lost" }, ctx)).toEqual({ eyebrow: "FINAL", headline: "FINAL", subline: "18 / 20 PTS", tone: "neutral", ms: EVENT_MS });
  });

  it("returns null for unrelated changes", () => {
    const prev = base({ status: "live" });
    expect(cardFor(prev, { ...prev, hull: 90 }, ctx)).toBeNull();
    expect(cardFor(prev, { ...prev, clock: { ...prev.clock, secondsLeft: 600, home: 2 } }, ctx)).toBeNull();
  });
});
```

`useMissionCard.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/features/gameplay/engine/reduce";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import { EVENT_MS, TIPOFF_MS } from "./missionCard";
import { useMissionCard } from "./useMissionCard";

const ctx = { playerName: "Ja Morant", matchup: "MEM vs IND" };
const initial = createInitialState({ stat: "pts", target: 20 });

describe("useMissionCard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows nothing at first, the mission card at tip-off, then hides it after its duration", () => {
    const { result, rerender } = renderHook(({ state }) => useMissionCard(state, ctx), { initialProps: { state: initial } });
    expect(result.current).toBeNull();
    rerender({ state: { ...initial, status: "live" } });
    expect(result.current?.headline).toBe("20 PTS · JA MORANT");
    act(() => vi.advanceTimersByTime(TIPOFF_MS - 1));
    expect(result.current).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
  });

  it("replaces a visible card with a newer one and restarts the timer", () => {
    const live: ScenarioState = { ...initial, status: "live" };
    const { result, rerender } = renderHook(({ state }) => useMissionCard(state, ctx), { initialProps: { state: initial } });
    rerender({ state: live });
    act(() => vi.advanceTimersByTime(1000));
    rerender({ state: { ...live, mission: { ...live.mission, met: true }, myPlayerStats: { pts: 20, blk: 0, stl: 0, tov: 0 } } });
    expect(result.current?.headline).toBe("OBJECTIVE COMPLETE");
    act(() => vi.advanceTimersByTime(EVENT_MS - 1));
    expect(result.current?.headline).toBe("OBJECTIVE COMPLETE");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/components/hud/missionCard.test.ts src/features/gameplay/components/hud/useMissionCard.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `missionCard.ts`**

```ts
import type { ScenarioState } from "@/features/gameplay/engine/types";
import { periodLabel, STAT_LABEL } from "./format";

export type CardTone = "mine" | "gold" | "neutral";
export type MissionCardData = { eyebrow: string; headline: string; subline?: string; tone: CardTone; ms: number };
export type CardContext = { playerName: string; matchup: string };

export const TIPOFF_MS = 4000;
export const EVENT_MS = 3000;

const progress = (s: ScenarioState) => `${s.myPlayerStats[s.mission.stat]} / ${s.mission.target} ${STAT_LABEL[s.mission.stat]}`;

/** Which card a state transition deserves, if any. Pure; the hook owns the timer. */
export function cardFor(prev: ScenarioState, next: ScenarioState, ctx: CardContext): MissionCardData | null {
  if (prev.status === "pending" && next.status === "live") {
    return {
      eyebrow: "MISSION",
      headline: `${next.mission.target} ${STAT_LABEL[next.mission.stat]} · ${ctx.playerName.toUpperCase()}`,
      subline: ctx.matchup,
      tone: "mine",
      ms: TIPOFF_MS,
    };
  }
  if (next.status === "live" && !prev.mission.met && next.mission.met) {
    return { eyebrow: "OBJECTIVE", headline: "OBJECTIVE COMPLETE", subline: progress(next), tone: "gold", ms: EVENT_MS };
  }
  if ((next.status === "won" || next.status === "lost") && prev.status === "live") {
    return { eyebrow: "FINAL", headline: "FINAL", subline: progress(next), tone: "neutral", ms: EVENT_MS };
  }
  if (next.status === "live" && next.clock.period !== prev.clock.period) {
    return { eyebrow: "PERIOD", headline: periodLabel(next.clock.period), subline: progress(next), tone: "neutral", ms: EVENT_MS };
  }
  return null;
}
```

- [ ] **Step 4: Write `useMissionCard.ts`**

```ts
import { useEffect, useRef, useState } from "react";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import { cardFor, type CardContext, type MissionCardData } from "./missionCard";

/** Turns state transitions into a timed card. A newer card replaces the current one and restarts its timer. */
export function useMissionCard(state: ScenarioState, ctx: CardContext): MissionCardData | null {
  const [card, setCard] = useState<MissionCardData | null>(null);
  const prev = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const next = cardFor(prev.current, state, ctx);
    prev.current = state;
    if (!next) return;
    setCard(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCard(null), next.ms);
    // ctx may be a fresh object each render; cardFor(prev, prev) is null, so a re-run without a state change is harmless.
  }, [state, ctx]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return card;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/components/hud`
Expected: PASS (6 + 6 + 3 + 7 = 22 tests so far in the folder).

- [ ] **Step 6: Write `MissionCard.tsx`**

```tsx
import type { CardTone, MissionCardData } from "./missionCard";

const TONE: Record<CardTone, string> = { mine: "text-hud-mine", gold: "text-hud-gold", neutral: "text-slate-100" };

/** Top-center card. Always mounted (aria-live region); content animates in while a card is set. */
export function MissionCard({ card }: { card: MissionCardData | null }) {
  return (
    <div aria-live="polite" className="flex flex-col items-center text-center font-display">
      {card ? (
        <div key={card.headline} className="flex flex-col items-center gap-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500">
          <span className="text-[10px] tracking-[0.4em] text-hud-chrome">{card.eyebrow}</span>
          <span className={`text-3xl tracking-[0.2em] md:text-4xl ${TONE[card.tone]} [text-shadow:0_0_18px_rgba(0,0,0,0.9)]`}>{card.headline}</span>
          {card.subline ? <span className="hidden text-xs tracking-[0.3em] text-slate-300 md:block">{card.subline}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Type-check and commit**

Run: `npx tsc -p tsconfig.app.json --noEmit` → clean.

```bash
git add src/features/gameplay/components/hud/missionCard.ts src/features/gameplay/components/hud/missionCard.test.ts src/features/gameplay/components/hud/useMissionCard.ts src/features/gameplay/components/hud/useMissionCard.test.ts src/features/gameplay/components/hud/MissionCard.tsx
git commit -m "feat(hud): mission card from state transitions"
```

---

### Task 5: Overlay, full-bleed page, exit and in-place replay

**Files:**
- Create: `src/features/gameplay/components/hud/HudOverlay.tsx`
- Modify: `src/features/gameplay/components/GamePlayPage.tsx`
- Modify: `src/features/gameplay/components/ResultOverlay.tsx`
- Modify: `src/features/gameplay/components/GamePlayPage.test.tsx`
- Delete: `src/features/gameplay/components/Hud.tsx`

**Interfaces:**
- Consumes: every panel from Tasks 2 to 4; `findTeamId`, `games`, `createReplayFeed`, `useScenario`, `ScenarioCanvas`, `SetupPanel`.
- Produces: `<HudOverlay state game myTeamId playerName feed onExit />`; `<ResultOverlay state mission onReplay onExit />`; `GamePlayPage` renders the running game inside `<section className="fixed inset-0 z-30 ...">`, keys the canvas by a run counter so Replay remounts the renderer, and exposes buttons named "Exit" (HUD), "Replay" and "Back to setup" (result).

- [ ] **Step 1: Update the page test**

Replace the first test's body after the start click with:

```tsx
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("progressbar", { name: /hull/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fire scout|pause|step/i })).toBeNull();
    // The mission card announces the target at tip-off.
    expect(screen.getByText(/1 PTS · /)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByText(/mission (success|failed)/i)).toBeInTheDocument();
    expect(syncState).toHaveBeenCalled();
    const last = game.plays[game.plays.length - 1];
    expect(screen.getByTestId("score").textContent).toBe(
      `${game.home.abbreviation} ${last.homeScore} - ${last.awayScore} ${game.away.abbreviation}`,
    );

    // Replay restarts the same game in place: result gone, HUD back, canvas remounted.
    fireEvent.click(screen.getByRole("button", { name: /^replay$/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText(/mission (success|failed)/i)).toBeNull();
    expect(screen.getByRole("progressbar", { name: /hull/i })).toHaveAttribute("aria-valuenow", "100");

    // Exit returns to the setup panel.
    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
```

Add a third test:

```tsx
  it("offers Back to setup on the result screen", async () => {
    const game = games[0];
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/game-play"]}>
          <GamePlayPage />
        </MemoryRouter>
      </StrictMode>,
    );
    fireEvent.change(screen.getByLabelText(/player/i), { target: { value: game.home.players[0].id } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/speed/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(63_000);
    });
    fireEvent.click(screen.getByRole("button", { name: /back to setup/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the page test to verify it fails**

Run: `npx vitest run src/features/gameplay/components/GamePlayPage.test.tsx`
Expected: FAIL (no Exit button, no mission card text, no Back to setup).

- [ ] **Step 3: Write `HudOverlay.tsx`**

```tsx
import type { ScenarioState } from "@/features/gameplay/engine/types";
import type { Feed, RecordedGame } from "@/features/gameplay/feeds/types";
import { ClockPanel } from "./ClockPanel";
import { CountersPanel } from "./CountersPanel";
import { MissionCard } from "./MissionCard";
import { PlayTicker } from "./PlayTicker";
import { ScorePanel } from "./ScorePanel";
import { StatusPanel } from "./StatusPanel";
import { useMissionCard } from "./useMissionCard";
import { usePlayLog } from "./usePlayLog";

type Props = {
  state: ScenarioState;
  game: RecordedGame;
  myTeamId: string;
  playerName: string;
  feed: Feed | null;
  onExit: () => void;
};

/** Cinematic heads-up display: four corners plus center lanes, over the scene. Only Exit takes pointer events. */
export function HudOverlay({ state, game, myTeamId, playerName, feed, onExit }: Props) {
  const entries = usePlayLog(feed);
  const card = useMissionCard(state, { playerName, matchup: `${game.home.abbreviation} vs ${game.away.abbreviation}` });
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 md:p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[400ms]">
      <div className="absolute left-3 top-3 md:left-6 md:top-6">
        <ClockPanel clock={state.clock} onExit={onExit} />
      </div>
      <div className="absolute right-3 top-3 md:right-6 md:top-6">
        <ScorePanel clock={state.clock} game={game} myTeamId={myTeamId} stats={state.myPlayerStats} />
      </div>
      <div className="absolute inset-x-0 top-[12%] flex justify-center">
        <MissionCard card={card} />
      </div>
      <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6">
        <StatusPanel hull={state.hull} shield={state.shield} />
      </div>
      <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6">
        <CountersPanel kills={state.enemiesDestroyed} combo={state.combo} />
      </div>
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <PlayTicker entries={entries} />
      </div>
      <p className="sr-only">
        MISSION {state.mission.stat.toUpperCase()} {state.myPlayerStats[state.mission.stat]} / {state.mission.target}
        {state.mission.met ? " met" : ""}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `ResultOverlay.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import type { MissionConfig, ScenarioState } from "@/features/gameplay/engine/types";
import { STAT_LABEL } from "./hud/format";

type Props = { state: ScenarioState; mission: MissionConfig; onReplay: () => void; onExit: () => void };

export function ResultOverlay({ state, mission, onReplay, onExit }: Props) {
  const won = state.status === "won";
  const stats = state.myPlayerStats;
  const cells: [string, string | number][] = [
    ["KILLS", state.enemiesDestroyed],
    ["HULL", state.hull],
    ["PTS", stats.pts],
    ["BLK + STL", stats.blk + stats.stl],
  ];
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="flex flex-col items-center gap-5 border-y border-hud-chrome/60 px-10 py-8 text-center font-display">
        <span className="text-[10px] tracking-[0.5em] text-hud-chrome">{won ? "MISSION" : "MISSION"}</span>
        <h2 className={`text-4xl tracking-[0.2em] md:text-5xl ${won ? "text-hud-mine" : "text-hud-theirs"}`}>
          {won ? "MISSION SUCCESS" : "MISSION FAILED"}
        </h2>
        <p className="text-sm tracking-[0.3em] text-slate-300">
          {stats[mission.stat]} / {mission.target} {STAT_LABEL[mission.stat]}
        </p>
        <dl className="flex gap-8">
          {cells.map(([k, v]) => (
            <div key={k} className="flex flex-col items-center">
              <dt className="text-[10px] tracking-[0.3em] text-hud-chrome">{k}</dt>
              <dd className="text-2xl tabular-nums text-slate-100">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-3 font-sans">
          <Button onClick={onReplay}>Replay</Button>
          <Button variant="outline" onClick={onExit}>Back to setup</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `GamePlayPage.tsx`**

Replace the imports of `Hud` with `HudOverlay`, add a run counter and a restart, and render the running game in a fixed layer:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { MissionConfig } from "@/features/gameplay/engine/types";
import { createReplayFeed, findTeamId } from "@/features/gameplay/feeds/replayFeed";
import { useScenario } from "@/features/gameplay/hooks/useScenario";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { findGame, games } from "@/fixtures/games";
import { HudOverlay } from "./hud/HudOverlay";
import { ResultOverlay } from "./ResultOverlay";
import { ScenarioCanvas } from "./ScenarioCanvas";
import { SetupPanel } from "./SetupPanel";
import type { StartConfig } from "./types";

// Upper bound on waiting for the animation queue, so a stuck animation can never hide the result forever.
const RESULT_MAX_WAIT_MS = 8000;
const DEFAULT_MISSION: MissionConfig = { stat: "pts", target: 20 };

export function GamePlayPage() {
  const [params] = useSearchParams();
  const gameIdParam = params.get("gameId");
  const playerIdParam = params.get("playerId");
  const urlError = gameIdParam && !findGame(gameIdParam) ? `No recorded game with id "${gameIdParam}". Pick one below.` : null;

  const [config, setConfig] = useState<StartConfig | null>(null);
  const [renderer, setRenderer] = useState<RendererPort | null>(null);
  // Bumped on Replay so the canvas (and its renderer) remount with a fresh scene.
  const [runKey, setRunKey] = useState(0);

  const game = config ? findGame(config.gameId) : undefined;
  const feed = useMemo(
    () => (config && game ? createReplayFeed(game, { myPlayerId: config.playerId, speed: config.speed }) : null),
    [config, game],
  );
  const mission = config?.mission ?? DEFAULT_MISSION;
  const state = useScenario(feed, mission, renderer);
  const [showResult, setShowResult] = useState(false);
  const finished = state.status === "won" || state.status === "lost";
  useEffect(() => {
    if (!finished) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cap = new Promise<void>((resolve) => { timer = setTimeout(resolve, RESULT_MAX_WAIT_MS); });
    const idle = renderer ? renderer.whenIdle() : cap;
    void Promise.race([idle, cap]).then(() => {
      if (!cancelled) setShowResult(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [finished, renderer]);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  useEffect(() => {
    if (!feed || !renderer) return;
    feed.start();
    return () => feed.pause();
  }, [feed, renderer]);

  const exit = () => {
    feed?.stop();
    setShowResult(false);
    setConfig(null);
    setRenderer(null);
  };

  const replay = () => {
    if (!config) return;
    feed?.stop();
    setShowResult(false);
    setRenderer(null);
    setRunKey((k) => k + 1);
    // A new object makes useMemo build a fresh feed for the same game and player.
    setConfig({ ...config });
  };

  if (!config || !game) {
    return (
      <section className="flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Game Play</h1>
        <SetupPanel games={games} initialGameId={gameIdParam ?? undefined} initialPlayerId={playerIdParam ?? undefined} error={urlError} onStart={setConfig} />
      </section>
    );
  }

  const myTeamId = findTeamId(game, config.playerId);
  const playerName = [...game.home.players, ...game.away.players].find((p) => p.id === config.playerId)?.name ?? "";

  return (
    <section className="fixed inset-0 z-30 flex flex-col bg-slate-950">
      <h1 className="sr-only">Game Play</h1>
      <HudOverlay state={state} game={game} myTeamId={myTeamId} playerName={playerName} feed={feed} onExit={exit} />
      <ScenarioCanvas key={runKey} onReady={handleReady} />
      {showResult ? <ResultOverlay state={state} mission={mission} onReplay={replay} onExit={exit} /> : null}
    </section>
  );
}
```

Delete `src/features/gameplay/components/Hud.tsx`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/components`
Expected: PASS (page tests 3, panel/hook tests 22, SetupPanel tests unchanged). Then `npm test` in full and `npx tsc -p tsconfig.app.json --noEmit` clean. The page test's `/1 PTS · /` assertion depends on the mission card being mounted at tip-off; if the roster player's name renders differently, match on the eyebrow `MISSION` text instead and say so in the report.

- [ ] **Step 7: Look at it**

`npm run dev`, open `http://localhost:5173/game-play`, start the recorded game at speed 64, screenshot at window widths 1920, 1280 and 800 into `.superpowers/sdd/screens/hud-<width>.png`. Check: header hidden, four corner panels with brackets, mission card at tip-off, ticker chips appearing after plays, hull bar turning rose when low, result screen with both buttons, Replay restarts with a fresh scene (ship visible again), Exit returns to setup with the nav visible. At 800 px the player line, matchup and ticker are hidden and nothing overlaps.

- [ ] **Step 8: Commit**

```bash
git add src/features/gameplay/components
git commit -m "feat(hud): cinematic overlay over a full-bleed scene, exit, in-place replay and result screen"
```

---

### Task 6: Docs, ledger and gate

**Files:**
- Modify: `CLAUDE.md`, `README.md`
- Modify: `.superpowers/sdd/progress.md` (ignored)

- [ ] **Step 1: `CLAUDE.md`**

Add to the Architecture list, after the renderer bullet:

> - `features/gameplay/components/hud/` is the heads-up display: small React + Tailwind panels placed by `HudOverlay.tsx` over the canvas, fed by `ScenarioState`. `usePlayLog` subscribes to the feed for the ticker; `useMissionCard` turns state transitions into timed cards through the pure `cardFor` (`missionCard.ts`). Display font is Orbitron (`font-display`), colors are the `hud-*` tokens in `index.css` and match the renderer's callout colors. The running game renders in a fixed full-viewport layer (the header is covered, not removed); Exit and the result buttons are the only interactive HUD elements.

In Conventions, change the tests bullet's "renderer is checked manually" sentence to also say "HUD panels and hooks are unit-tested with Testing Library".

- [ ] **Step 2: `README.md`**

Add a short "HUD" paragraph under the features or design section: corner panels, mission card, ticker, result screen; Orbitron; where the code lives.

- [ ] **Step 3: Ledger and gate**

Append to `.superpowers/sdd/progress.md`: phase name, branch, what shipped, deferred items (portrait layout, hull segment flicker is a color transition rather than a flicker, ticker hidden below md, sound).

Run and paste the summary:

```bash
npx tsc -b && npm run lint && npm test && npm run build
```

Expected: tsc clean, lint with the 3 known warnings, all tests green (118 existing + 23 new = 141), build ok.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: cinematic HUD notes"
```

Then dispatch the whole-branch review and use superpowers:finishing-a-development-branch. Merge and push are Oscar's calls.
