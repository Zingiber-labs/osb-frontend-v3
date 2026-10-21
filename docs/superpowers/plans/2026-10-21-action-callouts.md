# Action Callouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a floating label at every ship action naming the basketball play that caused it (`MORANT +3`, `SIAKAM +2`, `JACKSON BLOCK`).

**Architecture:** The replay feed formats a `label` from the play's player and rosters; the engine copies it onto the action as `caption` without formatting; the renderer draws a Pixi `Text` at the action's position that floats and fades for 1500 ms, concurrently with the action animation.

**Tech Stack:** TypeScript, Vitest, PixiJS 8 `Text`.

Spec: `docs/superpowers/specs/2026-10-21-action-callouts-design.md`

## Global Constraints

- Project root `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario`, branch `feat/ship-scenario-mvp`; per-task commits authorized; never mention Claude or AI in commit messages.
- Engine stays pure (no React, no Pixi, no string formatting of labels); feeds import no React or Pixi; only `renderer/` imports Pixi.
- Mapping rules and animation durations unchanged. Callouts must not be awaited by the action queue.
- Label format (verbatim from spec): `<WHO> <WHAT>` where WHO is the player's last name in upper case (ignoring suffixes Jr., Sr., II, III, IV) or the team abbreviation when the play has no player; WHAT is `+1`, `+2`, `+3`, `BLOCK`, `STEAL`, `TURNOVER`.
- Caption colors: cyan `0x38bdf8` for my team, gold `0xfbbf24` for a charged fire (my chosen player), red `0xf43f5e` for the opponent. Callout lifetime 1500 ms, rises 24 px, fades over the last 40 percent.
- Existing tests use `toEqual` on action objects; omit the `caption` key entirely when the event has no label so those tests keep passing.
- Dev server probably running on 5173 (hot reload); reuse it for browser checks.

---

### Task 1: Labels on events, captions on actions

**Files:**
- Modify: `src/features/gameplay/engine/types.ts`, `src/features/gameplay/engine/reduce.ts`, `src/features/gameplay/feeds/replayFeed.ts`
- Test: `src/features/gameplay/engine/reduce.caption.test.ts`, `src/features/gameplay/feeds/replayFeed.test.ts` (add cases)

**Interfaces:**
- Produces: `GameEvent` variants `score | block | steal | turnover` gain `label?: string`; `ShipAction` variants `fire | hit | shieldUp | fizzle | stall | enemyMalfunction` gain `caption?: string`; `formatLabel(name: string | undefined, teamAbbr: string, what: string): string` exported from `replayFeed.ts`.

- [ ] **Step 1: Failing engine test**

Create `src/features/gameplay/engine/reduce.caption.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("reduce: captions", () => {
  it("copies the event label onto fire, hit, shieldUp, fizzle, stall and enemyMalfunction", () => {
    const s = createInitialState(mission);
    expect(reduce(s, { kind: "score", side: "mine", points: 3, byMyPlayer: true, label: "MORANT +3", at: at() }).actions[0])
      .toEqual({ type: "fire", size: "cruiser", charged: true, caption: "MORANT +3" });
    expect(reduce(s, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, label: "SIAKAM +2", at: at() }).actions[0])
      .toEqual({ type: "hit", points: 2, absorbed: false, caption: "SIAKAM +2" });
    expect(reduce(s, { kind: "block", side: "mine", byMyPlayer: false, label: "JACKSON BLOCK", at: at() }).actions[0])
      .toEqual({ type: "shieldUp", caption: "JACKSON BLOCK" });
    expect(reduce(s, { kind: "steal", side: "theirs", byMyPlayer: false, label: "SIAKAM STEAL", at: at() }).actions[0])
      .toEqual({ type: "fizzle", caption: "SIAKAM STEAL" });
    expect(reduce(s, { kind: "turnover", side: "mine", byMyPlayer: false, label: "MORANT TURNOVER", at: at() }).actions[0])
      .toEqual({ type: "stall", caption: "MORANT TURNOVER" });
    expect(reduce(s, { kind: "turnover", side: "theirs", byMyPlayer: false, label: "IND TURNOVER", at: at() }).actions[0])
      .toEqual({ type: "enemyMalfunction", caption: "IND TURNOVER" });
  });

  it("omits the caption key when the event has no label", () => {
    const { actions } = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at() });
    expect("caption" in actions[0]).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- src/features/gameplay/engine/reduce.caption.test.ts`
Expected: FAIL (type error on `label`, or `caption` missing from actions).

- [ ] **Step 3: Engine types and reducer**

In `src/features/gameplay/engine/types.ts` change the four event variants and six action variants:

```ts
export type GameEvent =
  | { kind: "tipoff"; at: Clock }
  | { kind: "score"; side: Side; points: Points; byMyPlayer: boolean; label?: string; at: Clock }
  | { kind: "block"; side: Side; byMyPlayer: boolean; label?: string; at: Clock }
  | { kind: "steal"; side: Side; byMyPlayer: boolean; label?: string; at: Clock }
  | { kind: "turnover"; side: Side; byMyPlayer: boolean; label?: string; at: Clock }
  | { kind: "period"; period: number; at: Clock }
  | { kind: "final"; at: Clock };

export type ShipAction =
  | { type: "fire"; size: EnemySize; charged: boolean; caption?: string }
  | { type: "hit"; points: Points; absorbed: boolean; caption?: string }
  | { type: "shieldUp"; caption?: string }
  | { type: "fizzle"; caption?: string }
  | { type: "stall"; caption?: string }
  | { type: "enemyMalfunction"; caption?: string }
  | { type: "objectiveComplete" }
  | { type: "warpOut" }
  | { type: "explode" };
```

In `src/features/gameplay/engine/reduce.ts` add above `reduce`:

```ts
/** Adds the event's label as a caption without introducing an undefined key. */
function captioned<A extends ShipAction>(action: A, label: string | undefined): A {
  return label ? { ...action, caption: label } : action;
}
```

and wrap the six pushes: `actions.push(captioned({ type: "fire", size: ENEMY_BY_POINTS[event.points], charged: event.byMyPlayer }, event.label));`, both `hit` pushes, `shieldUp`, `fizzle`, `stall`, `enemyMalfunction`. `objectiveComplete`, `warpOut`, `explode` unchanged.

- [ ] **Step 4: Run engine tests**

Run: `npm test -- src/features/gameplay/engine`
Expected: PASS (all previous tests plus 2 new).

- [ ] **Step 5: Failing feed tests**

Append to `src/features/gameplay/feeds/replayFeed.test.ts`:

```ts
import { formatLabel } from "./replayFeed";
import type { RecordedGame } from "./types";

describe("labels", () => {
  it("formats last name and play, ignoring suffixes, or the team when there is no player", () => {
    expect(formatLabel("Ja Morant", "MEM", "+3")).toBe("MORANT +3");
    expect(formatLabel("Jaren Jackson Jr.", "MEM", "BLOCK")).toBe("JACKSON BLOCK");
    expect(formatLabel("Robert Williams III", "MEM", "STEAL")).toBe("WILLIAMS STEAL");
    expect(formatLabel(undefined, "IND", "TURNOVER")).toBe("IND TURNOVER");
  });

  it("labels score, block, steal and turnover events from the rosters", () => {
    const [, score, block, , turnover] = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    expect(score).toMatchObject({ kind: "score", label: "ONE +2" });
    expect(block).toMatchObject({ kind: "block", label: "TWO BLOCK" });
    expect(turnover).toMatchObject({ kind: "turnover", label: "TWO TURNOVER" });
  });

  it("falls back to the team abbreviation for a team turnover", () => {
    const game: RecordedGame = {
      ...testGame,
      plays: [{ order: 0, period: 1, clockSeconds: 700, homeScore: 0, awayScore: 0, kind: "turnover", teamId: "A", playerIds: [] }],
    };
    const [, turnover] = buildTimeline(game, "h1", 1).map((i) => i.event);
    expect(turnover).toMatchObject({ kind: "turnover", side: "theirs", label: "AWY TURNOVER" });
  });

  it("leaves period and final without labels", () => {
    const events = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    for (const e of events) if (e.kind === "period" || e.kind === "final" || e.kind === "tipoff") expect("label" in e).toBe(false);
  });
});
```

(Place the two new imports at the top of the file with the existing ones.)

- [ ] **Step 6: Run to see them fail**

Run: `npm test -- src/features/gameplay/feeds/replayFeed.test.ts`
Expected: FAIL, `formatLabel` is not exported / labels missing.

- [ ] **Step 7: Feed labels**

In `src/features/gameplay/feeds/replayFeed.ts`:

```ts
const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

export function formatLabel(name: string | undefined, teamAbbr: string, what: string): string {
  if (!name) return `${teamAbbr} ${what}`;
  const parts = name.trim().split(/\s+/);
  let last = parts[parts.length - 1] ?? "";
  if (SUFFIXES.has(last.toLowerCase()) && parts.length > 1) last = parts[parts.length - 2];
  return `${last.toUpperCase()} ${what}`;
}

type Lookup = { names: Map<string, string>; abbr: Map<string, string> };

function buildLookup(game: RecordedGame): Lookup {
  const names = new Map<string, string>();
  const abbr = new Map<string, string>();
  for (const team of [game.home, game.away]) {
    abbr.set(team.id, team.abbreviation);
    for (const p of team.players) names.set(p.id, p.name);
  }
  return { names, abbr };
}

function labelFor(play: RecordedPlay, lookup: Lookup): string | undefined {
  const what = play.kind === "score" ? (play.points ? `+${play.points}` : undefined) : play.kind === "block" ? "BLOCK" : play.kind === "steal" ? "STEAL" : play.kind === "turnover" ? "TURNOVER" : undefined;
  if (!what) return undefined;
  const name = play.playerIds.map((id) => lookup.names.get(id)).find((n): n is string => Boolean(n));
  const teamAbbr = (play.teamId && lookup.abbr.get(play.teamId)) || "TEAM";
  return formatLabel(name, teamAbbr, what);
}
```

Change `toEvent(play, myTeamId, myPlayerId)` to `toEvent(play, myTeamId, myPlayerId, lookup)` and set `label` on the four variants:

```ts
    case "score":
      return play.points ? { kind: "score", side, points: play.points, byMyPlayer, label: labelFor(play, lookup), at } : null;
    case "block":
    case "steal":
    case "turnover":
      return { kind: play.kind, side, byMyPlayer, label: labelFor(play, lookup), at };
```

In `buildTimeline`, create `const lookup = buildLookup(game);` once and pass it to `toEvent`.

- [ ] **Step 8: Run all tests and type-check**

Run: `npm test` (expect 78 + 2 + 4 = 84), `npx tsc -b`.

- [ ] **Step 9: Commit**

```bash
git add src/features/gameplay/engine src/features/gameplay/feeds
git commit -m "feat(gameplay): label events with the player and play, carry captions on actions"
```

---

### Task 2: Renderer callouts and debug samples

**Files:**
- Create: `src/features/gameplay/renderer/callout.ts`
- Modify: `src/features/gameplay/renderer/animations.ts`, `src/features/gameplay/components/DebugPanel.tsx`, `CLAUDE.md`

**Interfaces:**
- Produces: `callout(world: World, x: number, y: number, text: string, color: number): void` and `CALLOUT_COLORS = { mine, charged, theirs }`.

- [ ] **Step 1: Callout helper**

Create `src/features/gameplay/renderer/callout.ts`:

```ts
import { Text } from "pixi.js";
import { easeOut, tween } from "./tween";
import type { World } from "./world";

export const CALLOUT_COLORS = { mine: 0x38bdf8, charged: 0xfbbf24, theirs: 0xf43f5e } as const;
const LIFETIME_MS = 1500;
const RISE_PX = 24;

/** Floating label at an action. Fire-and-forget: never awaited by the action queue. */
export function callout(world: World, x: number, y: number, text: string, color: number): void {
  const label = new Text({
    text,
    style: {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      fontSize: 16,
      fontWeight: "800",
      fill: color,
      stroke: { color: 0x05060f, width: 4 },
      letterSpacing: 1,
    },
  });
  label.anchor.set(0.5, 1);
  label.position.set(x, y);
  world.effects.addChild(label);
  void tween(world.app.ticker, LIFETIME_MS, (p) => {
    label.y = y - RISE_PX * easeOut(p);
    label.alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  }).then(() => label.destroy());
}
```

- [ ] **Step 2: Hook callouts into the animations**

In `animations.ts`:
- Import `callout, CALLOUT_COLORS` from `./callout`.
- Change signatures to take the caption: `fire(world, size, charged, caption?)`, `hit(world, points, absorbed, caption?)`, `shieldUp(world, caption?)`, `fizzle(world, caption?)`, `stall(world, caption?)`, `enemyMalfunction(world, caption?)`, and pass `action.caption` in `runAnimation`.
- `fire`: right after `shot.destroy()` (the shot has landed): `if (caption) callout(world, enemy.x, enemy.y - 30, caption, charged ? CALLOUT_COLORS.charged : CALLOUT_COLORS.mine);`
- `hit`: right after `shot.destroy()`: `if (caption) callout(world, ship.x + 70, ship.y - 30, caption, CALLOUT_COLORS.theirs);`
- `shieldUp`: at the start: `if (caption) callout(world, world.ship.x, world.ship.y - 50, caption, CALLOUT_COLORS.mine);`
- `fizzle`: at the start: `if (caption) callout(world, ship.x + 40 + world.width * 0.12, ship.y - 20, caption, CALLOUT_COLORS.theirs);`
- `stall`: at the start: `if (caption) callout(world, ship.x, ship.y - 50, caption, CALLOUT_COLORS.mine);`
- `enemyMalfunction`: right after detaching the enemy: `if (caption) callout(world, enemy.x, enemy.y - 30, caption, CALLOUT_COLORS.theirs);`

- [ ] **Step 3: Debug samples**

In `DebugPanel.tsx` give the samples captions: fire scout `"MORANT +1"`, fire fighter `"MORANT +2"`, fire cruiser charged `"COWARD +3"`, hit 3 `"SIAKAM +3"`, hit absorbed `"SIAKAM +2"`, shieldUp `"JACKSON BLOCK"`, fizzle `"SIAKAM STEAL"`, stall `"MORANT TURNOVER"`, enemyMalfunction `"IND TURNOVER"`.

- [ ] **Step 4: Docs**

In `CLAUDE.md`'s renderer bullet add: "Every action can carry a `caption` (set by the feed as `label`); `renderer/callout.ts` floats it at the action for 1.5 s without blocking the queue."

- [ ] **Step 5: Verify**

`npm test` (84), `npx tsc -b`, `npm run build`. Browser (dev server on 5173, `agent-browser`, `snapshot -i` first, no networkidle wait, absolute screenshot paths, close at the end): start a replay with player `4903027`, speed 16; watch ~30 s and take two screenshots (`callout-01.png`, `callout-02.png`) showing labels next to an explosion and next to a hit; then Pause and press `fire cruiser charged`, `hit 3`, `shieldUp` quickly and screenshot (`callout-03.png`). Read the PNGs: labels must be legible (dark stroke) and positioned at the action, in the right colors (cyan / gold / red). Report console output.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/renderer src/features/gameplay/components/DebugPanel.tsx CLAUDE.md
git commit -m "feat(renderer): floating callouts naming the play behind each ship action"
```

---

## Self-review

Spec §2 feed → Task 1 Step 7; engine → Task 1 Step 3; renderer table → Task 2 Step 2 positions; colors and lifetime → `callout.ts`; §3 tests → Task 1 Steps 1 and 5, manual check Task 2 Step 5. No placeholders. Types: `label?` on four events and `caption?` on six actions match between Task 1 and Task 2's `action.caption` reads; `formatLabel` signature consistent between implementation and tests.
