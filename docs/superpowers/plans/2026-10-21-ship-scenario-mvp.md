# OSB Ship Scenario MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new React app where a recorded NBA game, replayed fast, drives a 2D spaceship battle: my team scores → ship destroys an enemy, opponent scores → ship takes damage, my player's stats trigger specials, and the mission threshold decides win or loss at Final.

**Architecture:** Event-sourced. A feed adapter emits normalized `GameEvent`s. A pure TypeScript engine folds each event into `ScenarioState` and a list of `ShipAction`s. A PixiJS renderer drains the action queue and plays one animation per action. React hosts the canvas, the HUD, and the setup screen behind React Router.

**Tech Stack:** Vite, React 19, TypeScript strict, React Router 7 (`react-router` package, declarative mode), PixiJS 8, Tailwind 4 with shadcn/ui, Vitest, React Testing Library, tsx for the capture script.

Spec: `docs/superpowers/specs/2026-10-21-ship-scenario-mvp-design.md`

## Global Constraints

- Project root: `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario` (git repo already initialized, branch `master`). All paths below are relative to it. Run every command from this directory.
- Node 22, npm. Package manager is npm (`package-lock.json`).
- TypeScript strict on. `npm run build` is `tsc -b && vite build`; type errors fail the build.
- Pin `react-router@7`. Do not install `react-router-dom` and do not use React Router 8.
- shadcn/ui primitives are added with `npx shadcn@latest add <component>`; never hand-write Radix wrappers; never hand-edit `src/components/ui/*`.
- Tailwind 4 CSS-first config: no `tailwind.config.js`. Styles come from `@import "tailwindcss";` in `src/index.css`.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for hooks, utils, engine, feeds. Imports across features use the `@/` alias (`src/`).
- Engine (`src/features/gameplay/engine/`) must not import React or `pixi.js`. Feeds (`src/features/gameplay/feeds/`) must not import React or `pixi.js`.
- Mapping constants (verbatim from spec): hull starts 100, floors at 1 before Final; hull damage 2 / 4 / 6 for 1 / 2 / 3 points; shield max 3 charges, one charge absorbs one opponent score entirely; combo resets on any opponent score and on my player's turnover.
- Animation durations (ms, verbatim from spec): fire 600, hit 500, shieldUp 400, fizzle 400, stall 1000, enemyMalfunction 800, objectiveComplete 1200, warpOut 2000, explode 2000. Gap between animations 150.
- Replay default speed 16.
- Commits: Oscar authorizes commits explicitly. If this session has not been told commits are authorized, skip every "Commit" step, leave the work uncommitted, and report the intended commit message instead. Never mention Claude or AI in commit messages.
- Out of scope (do not build): live feeds, period and run events, timeouts, fouls, bonus, player control, real art, sound, auth, any other OSB screen.

---

## File map

| Path | Responsibility |
|---|---|
| `vite.config.ts` | Vite + React + Tailwind plugins, `@` alias, Vitest config |
| `src/main.tsx` | Mounts `BrowserRouter` + `AppRoutes` |
| `src/app/router.tsx` | Declarative routes: `/` redirect, `/game-play`, `*` |
| `src/app/Layout.tsx` | Root layout: nav placeholder + `Outlet` |
| `src/app/NotFoundPage.tsx` | 404 page |
| `src/test/setup.ts` | jest-dom matchers for Vitest |
| `src/features/gameplay/engine/types.ts` | `GameEvent`, `ScenarioState`, `ShipAction`, `MissionConfig` |
| `src/features/gameplay/engine/mapping.ts` | Tunable constants: hull, shield, damage, enemy sizes |
| `src/features/gameplay/engine/reduce.ts` | `createInitialState`, `reduce` |
| `src/features/gameplay/engine/testUtils.ts` | `at()` clock helper for tests |
| `src/features/gameplay/feeds/types.ts` | `Feed` interface, `RecordedGame`, `RecordedPlay` |
| `src/features/gameplay/feeds/replayFeed.ts` | `buildTimeline`, `createReplayFeed` |
| `src/features/gameplay/feeds/testFeed.ts` | Manual feed for hook and page tests |
| `src/features/gameplay/feeds/testGame.ts` | Tiny `RecordedGame` fixture for unit tests |
| `scripts/espnToRecordedGame.ts` | Pure ESPN summary → `RecordedGame` conversion |
| `scripts/record-game.ts` | CLI: fetch ESPN summary, write fixture |
| `scripts/__fixtures__/espn-sample.json` | Hand-written ESPN-shaped sample for the conversion test |
| `src/fixtures/games/<id>.json` | Shipped recorded game |
| `src/fixtures/games/index.ts` | `games: RecordedGame[]` registry |
| `src/features/gameplay/renderer/RendererPort.ts` | `RendererPort` interface, `NULL_RENDERER` |
| `src/features/gameplay/renderer/ActionQueue.ts` | Sequential action drain with gap |
| `src/features/gameplay/renderer/tween.ts` | Ticker-driven tween returning a Promise |
| `src/features/gameplay/renderer/world.ts` | Builds Pixi layers, ship, starfield, meteorites, enemy spawner |
| `src/features/gameplay/renderer/animations.ts` | One animation per `ShipAction` |
| `src/features/gameplay/renderer/ScenarioRenderer.ts` | Pixi `Application` owner implementing `RendererPort` |
| `src/features/gameplay/hooks/useScenario.ts` | Bridge: feed → reduce → renderer → React state |
| `src/features/gameplay/components/GamePlayPage.tsx` | Route page: setup → scenario → result |
| `src/features/gameplay/components/SetupPanel.tsx` | Game, player, mission, speed pickers |
| `src/features/gameplay/components/Hud.tsx` | Hull, shield, combo, score, clock, mission |
| `src/features/gameplay/components/ScenarioCanvas.tsx` | Canvas host, mounts renderer, HUD-only fallback |
| `src/features/gameplay/components/ResultOverlay.tsx` | Won / lost overlay |
| `src/features/gameplay/components/DebugPanel.tsx` | Dev-only: fire any action, pause, step |

---

### Task 1: Scaffold the app, tooling, and router

**Files:**
- Create: `vite.config.ts`, `src/main.tsx`, `src/index.css`, `src/test/setup.ts`, `src/app/router.tsx`, `src/app/Layout.tsx`, `src/app/NotFoundPage.tsx`, `src/features/gameplay/components/GamePlayPage.tsx`
- Modify: `package.json`, `tsconfig.json`, `tsconfig.app.json`
- Test: `src/app/router.test.tsx`

**Interfaces:**
- Produces: `AppRoutes` component (`src/app/router.tsx`); `GamePlayPage` placeholder that renders an `<h1>Game Play</h1>` (Task 11 replaces its body but keeps that heading); the `@/` alias; `npm test`.

- [ ] **Step 1: Scaffold Vite into the existing folder**

The folder already holds `docs/` and `.git/`, so scaffold into a sibling temp folder and move the files in.

```bash
cd "C:\Users\Oscar Cordero\projects\zingi"
npm create vite@latest osb-tmp-scaffold -- --template react-ts
cp -r osb-tmp-scaffold/. osb-ship-scenario/
rm -rf osb-tmp-scaffold
cd osb-ship-scenario
rm -f src/App.tsx src/App.css src/assets/react.svg
```

Expected: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx` now exist next to `docs/`.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install react-router@7 pixi.js
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom tailwindcss @tailwindcss/vite tsx
```

Expected: no peer-dependency errors. `npm ls react-router` shows a 7.x version.

- [ ] **Step 3: Configure Vite, Vitest, alias, Tailwind**

Replace `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Replace `src/index.css`:

```css
@import "tailwindcss";

html, body, #root {
  height: 100%;
}
body {
  margin: 0;
  background: #020617;
}
```

In `tsconfig.json` add inside `compilerOptions` (create the object if the template only has `files`/`references`):

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

In `tsconfig.app.json` add inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] },
"resolveJsonModule": true
```

In `package.json` add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest",
"record-game": "tsx scripts/record-game.ts"
```

- [ ] **Step 4: Initialize shadcn and add Button**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button
```

If `init` prompts, choose: style New York, base color Neutral, CSS variables yes. Expected: `components.json` exists, `src/components/ui/button.tsx` exists, `src/index.css` gained the shadcn theme block (keep the `@import "tailwindcss";` line first; keep the `html, body, #root` rules from Step 3).

- [ ] **Step 5: Write the failing router test**

Create `src/app/router.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "./router";

describe("AppRoutes", () => {
  it("redirects / to /game-play", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /game play/i })).toBeInTheDocument();
  });

  it("renders the not-found page for unknown paths", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /not found/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- src/app/router.test.tsx`
Expected: FAIL, "Failed to resolve import ./router".

- [ ] **Step 7: Write the router, layout, pages, and entry point**

Create `src/app/Layout.tsx`:

```tsx
import { NavLink, Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-2">
        <span className="font-bold tracking-widest">OSB</span>
        <nav className="flex gap-3 text-sm">
          <NavLink
            to="/game-play"
            className={({ isActive }) => (isActive ? "text-cyan-300" : "text-slate-400")}
          >
            Game Play
          </NavLink>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
```

Create `src/app/NotFoundPage.tsx`:

```tsx
export function NotFoundPage() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-slate-400">There is nothing at this address.</p>
    </section>
  );
}
```

Create `src/features/gameplay/components/GamePlayPage.tsx` (placeholder, replaced in Task 11):

```tsx
export function GamePlayPage() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold">Game Play</h1>
    </section>
  );
}
```

Create `src/app/router.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router";
import { GamePlayPage } from "@/features/gameplay/components/GamePlayPage";
import { Layout } from "./Layout";
import { NotFoundPage } from "./NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/game-play" replace />} />
        <Route path="game-play" element={<GamePlayPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { AppRoutes } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 8: Run the test and the type check**

Run: `npm test -- src/app/router.test.tsx`
Expected: PASS, 2 tests.

Run: `npx tsc -b`
Expected: no output (no errors).

Run: `npm run dev` briefly and open http://localhost:5173. Expected: redirected to `/game-play`, dark page with "OSB" header and "Game Play" heading. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite app with router, tailwind, shadcn, vitest"
```

---

### Task 2: Engine types, initial state, and score events

**Files:**
- Create: `src/features/gameplay/engine/types.ts`, `src/features/gameplay/engine/mapping.ts`, `src/features/gameplay/engine/reduce.ts`, `src/features/gameplay/engine/testUtils.ts`
- Test: `src/features/gameplay/engine/reduce.score.test.ts`

**Interfaces:**
- Produces: every engine type below; `createInitialState(mission: MissionConfig): ScenarioState`; `reduce(state: ScenarioState, event: GameEvent): ReduceResult`; `at(overrides?: Partial<Clock>): Clock` test helper; constants `HULL_MAX`, `HULL_MIN`, `SHIELD_MAX`, `ENEMY_BY_POINTS`, `HULL_DAMAGE_BY_POINTS`.

- [ ] **Step 1: Write the types and mapping constants**

Create `src/features/gameplay/engine/types.ts`:

```ts
export type Side = "mine" | "theirs";

export type Points = 1 | 2 | 3;

export type Clock = {
  period: number;      // 1-4, 5+ = overtime
  secondsLeft: number; // seconds left in the period
  home: number;
  away: number;
};

export type GameEvent =
  | { kind: "tipoff"; at: Clock }
  | { kind: "score"; side: Side; points: Points; byMyPlayer: boolean; at: Clock }
  | { kind: "block"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "steal"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "turnover"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "period"; period: number; at: Clock }
  | { kind: "final"; at: Clock };

export type MissionStat = "pts" | "blk" | "stl";

export type MissionConfig = { stat: MissionStat; target: number };

export type ScenarioStatus = "pending" | "live" | "won" | "lost";

export type MyPlayerStats = { pts: number; blk: number; stl: number; tov: number };

export type ScenarioState = {
  hull: number;             // 1..100
  shield: number;           // 0..3
  combo: number;
  enemiesDestroyed: number;
  myPlayerStats: MyPlayerStats;
  mission: MissionConfig & { met: boolean };
  clock: Clock;
  status: ScenarioStatus;
};

export type EnemySize = "scout" | "fighter" | "cruiser";

export type ShipAction =
  | { type: "fire"; size: EnemySize; charged: boolean }
  | { type: "hit"; points: Points; absorbed: boolean }
  | { type: "shieldUp" }
  | { type: "fizzle" }
  | { type: "stall" }
  | { type: "enemyMalfunction" }
  | { type: "objectiveComplete" }
  | { type: "warpOut" }
  | { type: "explode" };

export type ReduceResult = { state: ScenarioState; actions: ShipAction[] };
```

Create `src/features/gameplay/engine/mapping.ts`:

```ts
import type { EnemySize, Points } from "./types";

export const HULL_MAX = 100;
export const HULL_MIN = 1;
export const SHIELD_MAX = 3;

export const ENEMY_BY_POINTS: Record<Points, EnemySize> = {
  1: "scout",
  2: "fighter",
  3: "cruiser",
};

export const HULL_DAMAGE_BY_POINTS: Record<Points, number> = {
  1: 2,
  2: 4,
  3: 6,
};
```

Create `src/features/gameplay/engine/testUtils.ts`:

```ts
import type { Clock } from "./types";

export function at(overrides: Partial<Clock> = {}): Clock {
  return { period: 1, secondsLeft: 720, home: 0, away: 0, ...overrides };
}
```

- [ ] **Step 2: Write the failing score tests**

Create `src/features/gameplay/engine/reduce.score.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("createInitialState", () => {
  it("starts with full hull, no shield, pending status", () => {
    const state = createInitialState(mission);
    expect(state).toEqual({
      hull: 100,
      shield: 0,
      combo: 0,
      enemiesDestroyed: 0,
      myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
      mission: { stat: "pts", target: 20, met: false },
      clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
      status: "pending",
    });
  });
});

describe("reduce: my team scores", () => {
  it("fires at a fighter for 2 points and counts the kill", () => {
    const { state, actions } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at({ home: 2 }),
    });
    expect(actions).toEqual([{ type: "fire", size: "fighter", charged: false }]);
    expect(state.enemiesDestroyed).toBe(1);
    expect(state.hull).toBe(100);
    expect(state.myPlayerStats.pts).toBe(0);
  });

  it("maps 1 point to scout and 3 points to cruiser", () => {
    const one = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 1, byMyPlayer: false, at: at() });
    const three = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 3, byMyPlayer: false, at: at() });
    expect(one.actions[0]).toEqual({ type: "fire", size: "scout", charged: false });
    expect(three.actions[0]).toEqual({ type: "fire", size: "cruiser", charged: false });
  });

  it("charges the shot, raises combo, and tracks points when my player scores", () => {
    const { state, actions } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at({ home: 3 }),
    });
    expect(actions).toEqual([{ type: "fire", size: "cruiser", charged: true }]);
    expect(state.combo).toBe(1);
    expect(state.myPlayerStats.pts).toBe(3);
  });

  it("updates the clock from the event", () => {
    const { state } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at({ period: 2, secondsLeft: 300, home: 40, away: 38 }),
    });
    expect(state.clock).toEqual({ period: 2, secondsLeft: 300, home: 40, away: 38 });
  });
});

describe("reduce: opponent scores", () => {
  it("damages the hull by 2/4/6 and resets the combo", () => {
    let state = { ...createInitialState(mission), combo: 4 };
    let r = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at({ away: 3 }) });
    expect(r.actions).toEqual([{ type: "hit", points: 3, absorbed: false }]);
    expect(r.state.hull).toBe(94);
    expect(r.state.combo).toBe(0);

    state = r.state;
    r = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at({ away: 5 }) });
    expect(r.state.hull).toBe(90);

    r = reduce(r.state, { kind: "score", side: "theirs", points: 1, byMyPlayer: false, at: at({ away: 6 }) });
    expect(r.state.hull).toBe(88);
  });

  it("never drops the hull below 1", () => {
    const state = { ...createInitialState(mission), hull: 3 };
    const { state: next } = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(next.hull).toBe(1);
  });

  it("does not change my player's stats when the opponent scores", () => {
    const { state } = reduce(createInitialState(mission), { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() });
    expect(state.myPlayerStats).toEqual({ pts: 0, blk: 0, stl: 0, tov: 0 });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/engine/reduce.score.test.ts`
Expected: FAIL, "Failed to resolve import ./reduce".

- [ ] **Step 4: Write the reducer with score handling**

Create `src/features/gameplay/engine/reduce.ts`:

```ts
import { ENEMY_BY_POINTS, HULL_DAMAGE_BY_POINTS, HULL_MAX, HULL_MIN } from "./mapping";
import type { GameEvent, MissionConfig, ReduceResult, ScenarioState, ShipAction } from "./types";

export function createInitialState(mission: MissionConfig): ScenarioState {
  return {
    hull: HULL_MAX,
    shield: 0,
    combo: 0,
    enemiesDestroyed: 0,
    myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
    mission: { stat: mission.stat, target: mission.target, met: false },
    clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
    status: "pending",
  };
}

export function reduce(state: ScenarioState, event: GameEvent): ReduceResult {
  if (state.status === "won" || state.status === "lost") {
    return { state, actions: [] };
  }

  const actions: ShipAction[] = [];
  const next: ScenarioState = { ...state, clock: event.at };

  switch (event.kind) {
    case "score": {
      if (event.side === "mine") {
        next.enemiesDestroyed += 1;
        if (event.byMyPlayer) {
          next.combo += 1;
          next.myPlayerStats = { ...next.myPlayerStats, pts: next.myPlayerStats.pts + event.points };
        }
        actions.push({ type: "fire", size: ENEMY_BY_POINTS[event.points], charged: event.byMyPlayer });
      } else {
        next.combo = 0;
        if (next.shield > 0) {
          next.shield -= 1;
          actions.push({ type: "hit", points: event.points, absorbed: true });
        } else {
          next.hull = Math.max(HULL_MIN, next.hull - HULL_DAMAGE_BY_POINTS[event.points]);
          actions.push({ type: "hit", points: event.points, absorbed: false });
        }
      }
      break;
    }
    default:
      break;
  }

  return { state: next, actions };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/features/gameplay/engine/reduce.score.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/engine
git commit -m "feat(engine): scenario types and score event reduction"
```

---

### Task 3: Shield, blocks, steals, and turnovers

**Files:**
- Modify: `src/features/gameplay/engine/reduce.ts`
- Test: `src/features/gameplay/engine/reduce.defense.test.ts`

**Interfaces:**
- Consumes: Task 2 types, `reduce`, `createInitialState`, `at`, `SHIELD_MAX`.
- Produces: `reduce` handling `block`, `steal`, `turnover`, and shield absorption on `score theirs`.

- [ ] **Step 1: Write the failing defense tests**

Create `src/features/gameplay/engine/reduce.defense.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("reduce: blocks and steals", () => {
  it("adds a shield charge and raises the shield on my team's block", () => {
    const { state, actions } = reduce(createInitialState(mission), { kind: "block", side: "mine", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "shieldUp" }]);
    expect(state.shield).toBe(1);
    expect(state.myPlayerStats.blk).toBe(0);
  });

  it("caps the shield at 3 charges", () => {
    let state = createInitialState(mission);
    for (let i = 0; i < 5; i += 1) {
      state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: false, at: at() }).state;
    }
    expect(state.shield).toBe(3);
  });

  it("tracks my player's blocks and steals", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: true, at: at() }).state;
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.myPlayerStats).toEqual({ pts: 0, blk: 1, stl: 2, tov: 0 });
  });

  it("fizzles my shot on the opponent's block or steal without touching state", () => {
    const start = createInitialState(mission);
    const block = reduce(start, { kind: "block", side: "theirs", byMyPlayer: false, at: at() });
    const steal = reduce(start, { kind: "steal", side: "theirs", byMyPlayer: false, at: at() });
    expect(block.actions).toEqual([{ type: "fizzle" }]);
    expect(steal.actions).toEqual([{ type: "fizzle" }]);
    expect(block.state.shield).toBe(0);
    expect(block.state.hull).toBe(100);
  });
});

describe("reduce: shield absorbs opponent scores", () => {
  it("spends one charge and leaves the hull untouched", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "hit", points: 3, absorbed: true }]);
    expect(next.hull).toBe(100);
    expect(next.shield).toBe(1);
  });

  it("damages the hull once the charges are gone", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    state = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "hit", points: 2, absorbed: false }]);
    expect(next.hull).toBe(96);
    expect(next.shield).toBe(0);
  });
});

describe("reduce: turnovers", () => {
  it("stalls the ship on my team's turnover", () => {
    const state = { ...createInitialState(mission), combo: 3 };
    const { state: next, actions } = reduce(state, { kind: "turnover", side: "mine", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "stall" }]);
    expect(next.combo).toBe(3);
    expect(next.myPlayerStats.tov).toBe(0);
  });

  it("resets the combo and counts the turnover when it is my player's", () => {
    const state = { ...createInitialState(mission), combo: 3 };
    const { state: next, actions } = reduce(state, { kind: "turnover", side: "mine", byMyPlayer: true, at: at() });
    expect(actions).toEqual([{ type: "stall" }]);
    expect(next.combo).toBe(0);
    expect(next.myPlayerStats.tov).toBe(1);
  });

  it("makes the enemy malfunction on the opponent's turnover", () => {
    const { state, actions } = reduce(createInitialState(mission), { kind: "turnover", side: "theirs", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "enemyMalfunction" }]);
    expect(state.hull).toBe(100);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/engine/reduce.defense.test.ts`
Expected: FAIL. The block test receives `[]` instead of `[{ type: "shieldUp" }]`.

- [ ] **Step 3: Add block, steal, and turnover handling**

Replace `src/features/gameplay/engine/reduce.ts` with:

```ts
import { ENEMY_BY_POINTS, HULL_DAMAGE_BY_POINTS, HULL_MAX, HULL_MIN, SHIELD_MAX } from "./mapping";
import type { GameEvent, MissionConfig, ReduceResult, ScenarioState, ShipAction } from "./types";

export function createInitialState(mission: MissionConfig): ScenarioState {
  return {
    hull: HULL_MAX,
    shield: 0,
    combo: 0,
    enemiesDestroyed: 0,
    myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
    mission: { stat: mission.stat, target: mission.target, met: false },
    clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
    status: "pending",
  };
}

export function reduce(state: ScenarioState, event: GameEvent): ReduceResult {
  if (state.status === "won" || state.status === "lost") {
    return { state, actions: [] };
  }

  const actions: ShipAction[] = [];
  const next: ScenarioState = { ...state, clock: event.at };

  switch (event.kind) {
    case "score": {
      if (event.side === "mine") {
        next.enemiesDestroyed += 1;
        if (event.byMyPlayer) {
          next.combo += 1;
          next.myPlayerStats = { ...next.myPlayerStats, pts: next.myPlayerStats.pts + event.points };
        }
        actions.push({ type: "fire", size: ENEMY_BY_POINTS[event.points], charged: event.byMyPlayer });
      } else {
        next.combo = 0;
        if (next.shield > 0) {
          next.shield -= 1;
          actions.push({ type: "hit", points: event.points, absorbed: true });
        } else {
          next.hull = Math.max(HULL_MIN, next.hull - HULL_DAMAGE_BY_POINTS[event.points]);
          actions.push({ type: "hit", points: event.points, absorbed: false });
        }
      }
      break;
    }
    case "block":
    case "steal": {
      if (event.side === "mine") {
        next.shield = Math.min(SHIELD_MAX, next.shield + 1);
        if (event.byMyPlayer) {
          const stats = { ...next.myPlayerStats };
          if (event.kind === "block") stats.blk += 1;
          else stats.stl += 1;
          next.myPlayerStats = stats;
        }
        actions.push({ type: "shieldUp" });
      } else {
        actions.push({ type: "fizzle" });
      }
      break;
    }
    case "turnover": {
      if (event.side === "mine") {
        if (event.byMyPlayer) {
          next.combo = 0;
          next.myPlayerStats = { ...next.myPlayerStats, tov: next.myPlayerStats.tov + 1 };
        }
        actions.push({ type: "stall" });
      } else {
        actions.push({ type: "enemyMalfunction" });
      }
      break;
    }
    default:
      break;
  }

  return { state: next, actions };
}
```

- [ ] **Step 4: Run both engine test files**

Run: `npm test -- src/features/gameplay/engine`
Expected: PASS, 17 tests across 2 files.

- [ ] **Step 5: Commit**

```bash
git add src/features/gameplay/engine
git commit -m "feat(engine): shield charges, blocks, steals and turnovers"
```

---

### Task 4: Mission threshold, tipoff, period, and final

**Files:**
- Modify: `src/features/gameplay/engine/reduce.ts`
- Test: `src/features/gameplay/engine/reduce.mission.test.ts`

**Interfaces:**
- Consumes: Task 2 and 3.
- Produces: the complete `reduce`. Status transitions `pending → live → won | lost`; `objectiveComplete` once; `warpOut` / `explode` at `final`; events after `final` are ignored.

- [ ] **Step 1: Write the failing mission tests**

Create `src/features/gameplay/engine/reduce.mission.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

describe("reduce: game structure", () => {
  it("goes live on tipoff with no action", () => {
    const { state, actions } = reduce(createInitialState({ stat: "pts", target: 5 }), { kind: "tipoff", at: at() });
    expect(state.status).toBe("live");
    expect(actions).toEqual([]);
  });

  it("only updates the clock on a period change", () => {
    const start = reduce(createInitialState({ stat: "pts", target: 5 }), { kind: "tipoff", at: at() }).state;
    const { state, actions } = reduce(start, { kind: "period", period: 2, at: at({ period: 2, home: 28, away: 30 }) });
    expect(actions).toEqual([]);
    expect(state.clock.period).toBe(2);
    expect(state.hull).toBe(100);
  });
});

describe("reduce: mission threshold", () => {
  it("emits objectiveComplete once when my player reaches the target", () => {
    let state = createInitialState({ stat: "pts", target: 5 });
    let r = reduce(state, { kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(false);
    expect(r.actions.map((a) => a.type)).toEqual(["fire"]);

    r = reduce(r.state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["fire", "objectiveComplete"]);

    r = reduce(r.state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["fire"]);
  });

  it("supports block and steal missions", () => {
    let state = createInitialState({ stat: "blk", target: 1 });
    const r = reduce(state, { kind: "block", side: "mine", byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["shieldUp", "objectiveComplete"]);

    state = createInitialState({ stat: "stl", target: 2 });
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.mission.met).toBe(false);
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.mission.met).toBe(true);
  });

  it("ignores teammates' stats for the mission", () => {
    const { state } = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "score", side: "mine", points: 3, byMyPlayer: false, at: at() });
    expect(state.mission.met).toBe(false);
  });
});

describe("reduce: final", () => {
  it("wins and warps out when the mission was met", () => {
    let state = createInitialState({ stat: "pts", target: 2 });
    state = reduce(state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "final", at: at({ period: 4, secondsLeft: 0 }) });
    expect(next.status).toBe("won");
    expect(actions).toEqual([{ type: "warpOut" }]);
  });

  it("loses and explodes when the mission was not met", () => {
    const { state, actions } = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "final", at: at({ period: 4, secondsLeft: 0 }) });
    expect(state.status).toBe("lost");
    expect(actions).toEqual([{ type: "explode" }]);
  });

  it("ignores every event after final", () => {
    const done = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "final", at: at() }).state;
    const { state, actions } = reduce(done, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(actions).toEqual([]);
    expect(state).toBe(done);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/engine/reduce.mission.test.ts`
Expected: FAIL. Tipoff status stays `"pending"`; mission tests get no `objectiveComplete`.

- [ ] **Step 3: Complete the reducer**

Replace `src/features/gameplay/engine/reduce.ts` with:

```ts
import { ENEMY_BY_POINTS, HULL_DAMAGE_BY_POINTS, HULL_MAX, HULL_MIN, SHIELD_MAX } from "./mapping";
import type { GameEvent, MissionConfig, ReduceResult, ScenarioState, ShipAction } from "./types";

export function createInitialState(mission: MissionConfig): ScenarioState {
  return {
    hull: HULL_MAX,
    shield: 0,
    combo: 0,
    enemiesDestroyed: 0,
    myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
    mission: { stat: mission.stat, target: mission.target, met: false },
    clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
    status: "pending",
  };
}

export function reduce(state: ScenarioState, event: GameEvent): ReduceResult {
  if (state.status === "won" || state.status === "lost") {
    return { state, actions: [] };
  }

  const actions: ShipAction[] = [];
  const next: ScenarioState = { ...state, clock: event.at };

  switch (event.kind) {
    case "tipoff": {
      next.status = "live";
      break;
    }
    case "period": {
      break;
    }
    case "score": {
      if (event.side === "mine") {
        next.enemiesDestroyed += 1;
        if (event.byMyPlayer) {
          next.combo += 1;
          next.myPlayerStats = { ...next.myPlayerStats, pts: next.myPlayerStats.pts + event.points };
        }
        actions.push({ type: "fire", size: ENEMY_BY_POINTS[event.points], charged: event.byMyPlayer });
      } else {
        next.combo = 0;
        if (next.shield > 0) {
          next.shield -= 1;
          actions.push({ type: "hit", points: event.points, absorbed: true });
        } else {
          next.hull = Math.max(HULL_MIN, next.hull - HULL_DAMAGE_BY_POINTS[event.points]);
          actions.push({ type: "hit", points: event.points, absorbed: false });
        }
      }
      break;
    }
    case "block":
    case "steal": {
      if (event.side === "mine") {
        next.shield = Math.min(SHIELD_MAX, next.shield + 1);
        if (event.byMyPlayer) {
          const stats = { ...next.myPlayerStats };
          if (event.kind === "block") stats.blk += 1;
          else stats.stl += 1;
          next.myPlayerStats = stats;
        }
        actions.push({ type: "shieldUp" });
      } else {
        actions.push({ type: "fizzle" });
      }
      break;
    }
    case "turnover": {
      if (event.side === "mine") {
        if (event.byMyPlayer) {
          next.combo = 0;
          next.myPlayerStats = { ...next.myPlayerStats, tov: next.myPlayerStats.tov + 1 };
        }
        actions.push({ type: "stall" });
      } else {
        actions.push({ type: "enemyMalfunction" });
      }
      break;
    }
    case "final": {
      break;
    }
  }

  if (!next.mission.met && next.myPlayerStats[next.mission.stat] >= next.mission.target) {
    next.mission = { ...next.mission, met: true };
    actions.push({ type: "objectiveComplete" });
  }

  if (event.kind === "final") {
    next.status = next.mission.met ? "won" : "lost";
    actions.push(next.mission.met ? { type: "warpOut" } : { type: "explode" });
  }

  return { state: next, actions };
}
```

- [ ] **Step 4: Run all engine tests and the type check**

Run: `npm test -- src/features/gameplay/engine`
Expected: PASS, 25 tests across 3 files.

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/gameplay/engine
git commit -m "feat(engine): mission threshold, tipoff, period and final handling"
```

---

### Task 5: Feed interface, fixture types, and replay adapter

**Files:**
- Create: `src/features/gameplay/feeds/types.ts`, `src/features/gameplay/feeds/replayFeed.ts`, `src/features/gameplay/feeds/testGame.ts`
- Test: `src/features/gameplay/feeds/replayFeed.test.ts`

**Interfaces:**
- Consumes: `GameEvent`, `Clock`, `Side`, `Points` from `@/features/gameplay/engine/types`.
- Produces:
  - `interface Feed { start(): void; stop(): void; pause(): void; step(): void; onEvent(cb: (e: GameEvent) => void): () => void }`
  - `RecordedGame`, `RecordedPlay`, `TeamRoster`, `RosterPlayer`, `PlayKind`
  - `findTeamId(game: RecordedGame, playerId: string): string` (throws if unknown)
  - `buildTimeline(game: RecordedGame, myPlayerId: string, speed: number): TimelineItem[]` where `TimelineItem = { event: GameEvent; delayMs: number }`
  - `createReplayFeed(game: RecordedGame, opts: { myPlayerId: string; speed?: number }): Feed`
  - `testGame: RecordedGame` with home team `"H"` (players `h1`, `h2`) and away team `"A"` (players `a1`, `a2`).

- [ ] **Step 1: Write the feed and fixture types**

Create `src/features/gameplay/feeds/types.ts`:

```ts
import type { GameEvent, Points } from "@/features/gameplay/engine/types";

export interface Feed {
  start(): void;
  stop(): void;
  pause(): void;
  step(): void;
  onEvent(cb: (e: GameEvent) => void): () => void;
}

export type RosterPlayer = { id: string; name: string };

export type TeamRoster = {
  id: string;
  name: string;
  abbreviation: string;
  players: RosterPlayer[];
};

export type PlayKind = "score" | "block" | "steal" | "turnover" | "period" | "final" | "other";

export type RecordedPlay = {
  order: number;
  period: number;
  clockSeconds: number; // seconds left in the period
  homeScore: number;
  awayScore: number;
  kind: PlayKind;
  points?: Points;
  teamId?: string;
  playerIds: string[];
};

export type RecordedGame = {
  id: string;
  date: string;
  home: TeamRoster;
  away: TeamRoster;
  plays: RecordedPlay[];
};
```

Create `src/features/gameplay/feeds/testGame.ts`:

```ts
import type { RecordedGame } from "./types";

export const testGame: RecordedGame = {
  id: "test-1",
  date: "2026-01-01T00:00:00Z",
  home: { id: "H", name: "Home Hawks", abbreviation: "HOM", players: [{ id: "h1", name: "Home One" }, { id: "h2", name: "Home Two" }] },
  away: { id: "A", name: "Away Aces", abbreviation: "AWY", players: [{ id: "a1", name: "Away One" }, { id: "a2", name: "Away Two" }] },
  plays: [
    { order: 0, period: 1, clockSeconds: 720, homeScore: 0, awayScore: 0, kind: "other", playerIds: [] },
    { order: 1, period: 1, clockSeconds: 700, homeScore: 2, awayScore: 0, kind: "score", points: 2, teamId: "H", playerIds: ["h1"] },
    { order: 2, period: 1, clockSeconds: 680, homeScore: 2, awayScore: 0, kind: "block", teamId: "A", playerIds: ["a2"] },
    { order: 3, period: 1, clockSeconds: 650, homeScore: 2, awayScore: 3, kind: "score", points: 3, teamId: "A", playerIds: ["a1"] },
    { order: 4, period: 1, clockSeconds: 640, homeScore: 2, awayScore: 3, kind: "turnover", teamId: "H", playerIds: ["h2"] },
    { order: 5, period: 2, clockSeconds: 720, homeScore: 2, awayScore: 3, kind: "period", playerIds: [] },
    { order: 6, period: 2, clockSeconds: 710, homeScore: 3, awayScore: 3, kind: "score", points: 1, teamId: "H", playerIds: ["h1"] },
    { order: 7, period: 4, clockSeconds: 0, homeScore: 3, awayScore: 3, kind: "final", playerIds: [] },
  ],
};
```

- [ ] **Step 2: Write the failing replay tests**

Create `src/features/gameplay/feeds/replayFeed.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameEvent } from "@/features/gameplay/engine/types";
import { buildTimeline, createReplayFeed, findTeamId } from "./replayFeed";
import { testGame } from "./testGame";

describe("findTeamId", () => {
  it("finds the team of a home or away player", () => {
    expect(findTeamId(testGame, "h2")).toBe("H");
    expect(findTeamId(testGame, "a1")).toBe("A");
  });

  it("throws for an unknown player", () => {
    expect(() => findTeamId(testGame, "zzz")).toThrow(/not on either roster/);
  });
});

describe("buildTimeline", () => {
  it("starts with tipoff and resolves side for a home player", () => {
    const kinds = buildTimeline(testGame, "h1", 1).map((i) => i.event.kind);
    expect(kinds).toEqual(["tipoff", "score", "block", "score", "turnover", "period", "score", "final"]);
    const [, first, block, second] = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    expect(first).toMatchObject({ kind: "score", side: "mine", points: 2, byMyPlayer: true });
    expect(block).toMatchObject({ kind: "block", side: "theirs", byMyPlayer: false });
    expect(second).toMatchObject({ kind: "score", side: "theirs", points: 3, byMyPlayer: false });
  });

  it("flips side for an away player", () => {
    const [, first, block] = buildTimeline(testGame, "a2", 1).map((i) => i.event);
    expect(first).toMatchObject({ side: "theirs", byMyPlayer: false });
    expect(block).toMatchObject({ side: "mine", byMyPlayer: true });
  });

  it("carries the clock and score on every event", () => {
    const [, first] = buildTimeline(testGame, "h1", 1);
    expect(first.event.at).toEqual({ period: 1, secondsLeft: 700, home: 2, away: 0 });
  });

  it("derives delays from the game clock divided by speed and zeroes them across periods", () => {
    const delays = buildTimeline(testGame, "h1", 10).map((i) => i.delayMs);
    // tipoff 0; play1 is 20s after the skipped "other" play; block 20s; score 30s; turnover 10s; period boundary 0; score 10s; final crosses periods 0
    expect(delays).toEqual([0, 2000, 2000, 3000, 1000, 0, 1000, 0]);
  });
});

describe("createReplayFeed", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function collect() {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    return { feed, events };
  }

  it("emits tipoff immediately on start and the next event after its delay", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(0);
    expect(events.map((e) => e.kind)).toEqual(["tipoff"]);
    vi.advanceTimersByTime(1999);
    expect(events).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score"]);
  });

  it("delivers everything by the end of the timeline", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(60_000);
    expect(events).toHaveLength(8);
    expect(events.at(-1)?.kind).toBe("final");
  });

  it("pauses, steps one event, and resumes", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(0);
    feed.pause();
    vi.advanceTimersByTime(10_000);
    expect(events).toHaveLength(1);
    feed.step();
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score"]);
    feed.start();
    vi.advanceTimersByTime(2000);
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score", "block"]);
  });

  it("stops delivering after stop and supports unsubscribe", () => {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const seen: string[] = [];
    const off = feed.onEvent((e) => seen.push(e.kind));
    feed.start();
    vi.advanceTimersByTime(0);
    off();
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(["tipoff"]);
    feed.stop();
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual(["tipoff"]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/feeds/replayFeed.test.ts`
Expected: FAIL, "Failed to resolve import ./replayFeed".

- [ ] **Step 4: Write the replay adapter**

Create `src/features/gameplay/feeds/replayFeed.ts`:

```ts
import type { Clock, GameEvent, Side } from "@/features/gameplay/engine/types";
import type { Feed, RecordedGame, RecordedPlay } from "./types";

export type TimelineItem = { event: GameEvent; delayMs: number };

export function findTeamId(game: RecordedGame, playerId: string): string {
  if (game.home.players.some((p) => p.id === playerId)) return game.home.id;
  if (game.away.players.some((p) => p.id === playerId)) return game.away.id;
  throw new Error(`Player ${playerId} is not on either roster of game ${game.id}`);
}

function toClock(play: RecordedPlay): Clock {
  return { period: play.period, secondsLeft: play.clockSeconds, home: play.homeScore, away: play.awayScore };
}

function toEvent(play: RecordedPlay, myTeamId: string, myPlayerId: string): GameEvent | null {
  const at = toClock(play);
  const side: Side = play.teamId === myTeamId ? "mine" : "theirs";
  const byMyPlayer = play.playerIds.includes(myPlayerId);
  switch (play.kind) {
    case "score":
      return play.points ? { kind: "score", side, points: play.points, byMyPlayer, at } : null;
    case "block":
    case "steal":
    case "turnover":
      return { kind: play.kind, side, byMyPlayer, at };
    case "period":
      return { kind: "period", period: play.period, at };
    case "final":
      return { kind: "final", at };
    default:
      return null;
  }
}

function gapSeconds(prev: RecordedPlay | undefined, cur: RecordedPlay): number {
  if (!prev || prev.period !== cur.period) return 0;
  return Math.max(0, prev.clockSeconds - cur.clockSeconds);
}

export function buildTimeline(game: RecordedGame, myPlayerId: string, speed: number): TimelineItem[] {
  const myTeamId = findTeamId(game, myPlayerId);
  const plays = [...game.plays].sort((a, b) => a.order - b.order);
  const first = plays[0];
  const tipoffAt: Clock = first ? toClock(first) : { period: 1, secondsLeft: 720, home: 0, away: 0 };
  const items: TimelineItem[] = [{ event: { kind: "tipoff", at: tipoffAt }, delayMs: 0 }];

  let pendingMs = 0;
  let prev: RecordedPlay | undefined;
  for (const play of plays) {
    pendingMs += (gapSeconds(prev, play) * 1000) / speed;
    prev = play;
    const event = toEvent(play, myTeamId, myPlayerId);
    if (!event) continue;
    items.push({ event, delayMs: Math.round(pendingMs) });
    pendingMs = 0;
  }
  return items;
}

export function createReplayFeed(game: RecordedGame, opts: { myPlayerId: string; speed?: number }): Feed {
  const timeline = buildTimeline(game, opts.myPlayerId, opts.speed ?? 16);
  const listeners = new Set<(e: GameEvent) => void>();
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const deliverNext = () => {
    const item = timeline[index];
    if (!item) {
      running = false;
      return;
    }
    index += 1;
    for (const l of listeners) l(item.event);
  };

  const schedule = () => {
    if (!running || index >= timeline.length) {
      running = false;
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      deliverNext();
      schedule();
    }, timeline[index].delayMs);
  };

  return {
    start() {
      if (running) return;
      running = true;
      schedule();
    },
    pause() {
      running = false;
      clearTimer();
    },
    stop() {
      running = false;
      clearTimer();
      index = timeline.length;
    },
    step() {
      clearTimer();
      deliverNext();
      if (running) schedule();
    },
    onEvent(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/features/gameplay/feeds/replayFeed.test.ts`
Expected: PASS, 10 tests.

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/feeds
git commit -m "feat(feeds): feed interface, recorded game types and replay adapter"
```

---

### Task 6: ESPN capture script and the shipped fixture

**Files:**
- Create: `scripts/espnToRecordedGame.ts`, `scripts/record-game.ts`, `scripts/__fixtures__/espn-sample.json`, `src/fixtures/games/index.ts`, `src/fixtures/games/<id>.json` (generated)
- Test: `scripts/espnToRecordedGame.test.ts`

**Interfaces:**
- Consumes: `RecordedGame`, `RecordedPlay`, `TeamRoster`, `RosterPlayer` from `src/features/gameplay/feeds/types.ts` (relative import from `scripts/`, the `@/` alias is not available there under tsx).
- Produces: `espnToRecordedGame(summary: EspnSummary): RecordedGame`, `parseClock(display: string): number`, `games: RecordedGame[]` registry at `@/fixtures/games`.

- [ ] **Step 1: Write the ESPN-shaped sample**

Create `scripts/__fixtures__/espn-sample.json`:

```json
{
  "header": {
    "id": "999",
    "competitions": [
      {
        "date": "2026-01-15T00:30Z",
        "competitors": [
          { "homeAway": "home", "team": { "id": "13", "displayName": "Los Angeles Lakers", "abbreviation": "LAL" } },
          { "homeAway": "away", "team": { "id": "9", "displayName": "Golden State Warriors", "abbreviation": "GS" } }
        ]
      }
    ]
  },
  "boxscore": {
    "players": [
      { "team": { "id": "13" }, "statistics": [ { "athletes": [ { "athlete": { "id": "p1", "displayName": "Laker One" } }, { "athlete": { "id": "p2", "displayName": "Laker Two" } } ] } ] },
      { "team": { "id": "9" }, "statistics": [ { "athletes": [ { "athlete": { "id": "w1", "displayName": "Warrior One" } } ] } ] }
    ]
  },
  "plays": [
    { "id": "1", "sequenceNumber": "1", "type": { "text": "Jumpball" }, "text": "Jumpball", "homeScore": 0, "awayScore": 0, "period": { "number": 1 }, "clock": { "displayValue": "12:00" }, "scoringPlay": false, "participants": [] },
    { "id": "2", "sequenceNumber": "2", "type": { "text": "Jump Shot" }, "text": "Laker One makes 18-foot jumper (Laker Two assists)", "homeScore": 2, "awayScore": 0, "period": { "number": 1 }, "clock": { "displayValue": "11:42" }, "scoringPlay": true, "shootingPlay": true, "scoreValue": 2, "team": { "id": "13" }, "participants": [ { "athlete": { "id": "p1" } }, { "athlete": { "id": "p2" } } ] },
    { "id": "3", "sequenceNumber": "3", "type": { "text": "Layup Shot" }, "text": "Warrior One misses driving layup (Laker Two blocks)", "homeScore": 2, "awayScore": 0, "period": { "number": 1 }, "clock": { "displayValue": "11:20" }, "scoringPlay": false, "shootingPlay": true, "scoreValue": 0, "team": { "id": "9" }, "participants": [ { "athlete": { "id": "w1" } }, { "athlete": { "id": "p2" } } ] },
    { "id": "4", "sequenceNumber": "4", "type": { "text": "Bad Pass\nTurnover" }, "text": "Laker One bad pass (Warrior One steals)", "homeScore": 2, "awayScore": 0, "period": { "number": 1 }, "clock": { "displayValue": "10:58" }, "scoringPlay": false, "team": { "id": "13" }, "participants": [ { "athlete": { "id": "p1" } }, { "athlete": { "id": "w1" } } ] },
    { "id": "5", "sequenceNumber": "5", "type": { "text": "Free Throw - 1 of 2" }, "text": "Warrior One makes free throw 1 of 2", "homeScore": 2, "awayScore": 1, "period": { "number": 1 }, "clock": { "displayValue": "10:40" }, "scoringPlay": true, "scoreValue": 1, "team": { "id": "9" }, "participants": [ { "athlete": { "id": "w1" } } ] },
    { "id": "6", "sequenceNumber": "6", "type": { "text": "End Period" }, "text": "End of the 1st Quarter", "homeScore": 2, "awayScore": 1, "period": { "number": 1 }, "clock": { "displayValue": "0.0" }, "scoringPlay": false, "participants": [] },
    { "id": "7", "sequenceNumber": "7", "type": { "text": "End Game" }, "text": "End of Game", "homeScore": 2, "awayScore": 1, "period": { "number": 4 }, "clock": { "displayValue": "0.0" }, "scoringPlay": false, "participants": [] }
  ]
}
```

- [ ] **Step 2: Write the failing conversion test**

Create `scripts/espnToRecordedGame.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sample from "./__fixtures__/espn-sample.json";
import { espnToRecordedGame, parseClock, type EspnSummary } from "./espnToRecordedGame";

describe("parseClock", () => {
  it("parses mm:ss and fractional seconds", () => {
    expect(parseClock("11:42")).toBe(702);
    expect(parseClock("0.8")).toBe(1);
    expect(parseClock("0.0")).toBe(0);
  });
});

describe("espnToRecordedGame", () => {
  const game = espnToRecordedGame(sample as EspnSummary);

  it("maps header and rosters", () => {
    expect(game.id).toBe("999");
    expect(game.date).toBe("2026-01-15T00:30Z");
    expect(game.home).toEqual({ id: "13", name: "Los Angeles Lakers", abbreviation: "LAL", players: [{ id: "p1", name: "Laker One" }, { id: "p2", name: "Laker Two" }] });
    expect(game.away.players).toEqual([{ id: "w1", name: "Warrior One" }]);
  });

  it("maps play kinds in order, splitting turnover+steal", () => {
    expect(game.plays.map((p) => p.kind)).toEqual(["other", "score", "block", "turnover", "steal", "score", "period", "final"]);
    expect(game.plays.map((p) => p.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("attributes a score to the shooter only", () => {
    expect(game.plays[1]).toMatchObject({ kind: "score", points: 2, teamId: "13", playerIds: ["p1"], clockSeconds: 702, homeScore: 2, awayScore: 0 });
  });

  it("credits a block to the defending team and the blocker", () => {
    expect(game.plays[2]).toMatchObject({ kind: "block", teamId: "13", playerIds: ["p2"] });
  });

  it("credits the turnover to the offender and the steal to the thief", () => {
    expect(game.plays[3]).toMatchObject({ kind: "turnover", teamId: "13", playerIds: ["p1"] });
    expect(game.plays[4]).toMatchObject({ kind: "steal", teamId: "9", playerIds: ["w1"] });
  });

  it("maps free throws to 1 point", () => {
    expect(game.plays[5]).toMatchObject({ kind: "score", points: 1, teamId: "9", playerIds: ["w1"] });
  });

  it("turns End Period into the start of the next period and End Game into final", () => {
    expect(game.plays[6]).toMatchObject({ kind: "period", period: 2, clockSeconds: 720, playerIds: [] });
    expect(game.plays[6].teamId).toBeUndefined();
    expect(game.plays[7]).toMatchObject({ kind: "final", period: 4, clockSeconds: 0 });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- scripts/espnToRecordedGame.test.ts`
Expected: FAIL, "Failed to resolve import ./espnToRecordedGame".

- [ ] **Step 4: Write the conversion and the CLI**

Create `scripts/espnToRecordedGame.ts`:

```ts
import type { Points } from "../src/features/gameplay/engine/types";
import type { PlayKind, RecordedGame, RecordedPlay, RosterPlayer, TeamRoster } from "../src/features/gameplay/feeds/types";

export type EspnCompetitor = {
  homeAway: "home" | "away";
  team: { id: string; displayName: string; abbreviation: string };
};

export type EspnPlay = {
  id: string;
  sequenceNumber: string;
  type: { text: string };
  text: string;
  homeScore: number;
  awayScore: number;
  period: { number: number };
  clock: { displayValue: string };
  scoringPlay: boolean;
  shootingPlay?: boolean;
  scoreValue?: number;
  team?: { id: string };
  participants?: { athlete: { id: string } }[];
};

export type EspnSummary = {
  header: { id: string; competitions: { date: string; competitors: EspnCompetitor[] }[] };
  boxscore: { players: { team: { id: string }; statistics: { athletes: { athlete: { id: string; displayName: string } }[] }[] }[] };
  plays: EspnPlay[];
};

export function parseClock(display: string): number {
  if (display.includes(":")) {
    const [m, s] = display.split(":").map(Number);
    return Math.round(m * 60 + s);
  }
  return Math.round(Number(display));
}

function rosterFor(summary: EspnSummary, teamId: string): RosterPlayer[] {
  const entry = summary.boxscore.players.find((p) => p.team.id === teamId);
  const byId = new Map<string, RosterPlayer>();
  for (const stat of entry?.statistics ?? []) {
    for (const a of stat.athletes) byId.set(a.athlete.id, { id: a.athlete.id, name: a.athlete.displayName });
  }
  return [...byId.values()];
}

function periodLength(period: number): number {
  return period >= 5 ? 300 : 720;
}

export function espnToRecordedGame(summary: EspnSummary): RecordedGame {
  const comp = summary.header.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) throw new Error("summary is missing a home or away competitor");

  const toRoster = (c: EspnCompetitor): TeamRoster => ({
    id: c.team.id,
    name: c.team.displayName,
    abbreviation: c.team.abbreviation,
    players: rosterFor(summary, c.team.id),
  });
  const otherTeam = (teamId: string | undefined) => (teamId === home.team.id ? away.team.id : home.team.id);

  const plays: RecordedPlay[] = [];
  let order = 0;
  const push = (p: EspnPlay, kind: PlayKind, extra: Partial<RecordedPlay> = {}) => {
    plays.push({
      order: order++,
      period: p.period.number,
      clockSeconds: parseClock(p.clock.displayValue),
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      kind,
      teamId: p.team?.id,
      playerIds: (p.participants ?? []).map((x) => x.athlete.id),
      ...extra,
    });
  };

  for (const p of summary.plays) {
    const typeText = p.type.text.toLowerCase();
    const text = p.text.toLowerCase();
    const participants = (p.participants ?? []).map((x) => x.athlete.id);

    if (typeText === "end game") {
      push(p, "final", { playerIds: [], teamId: undefined });
      continue;
    }
    if (typeText === "end period") {
      const nextPeriod = p.period.number + 1;
      push(p, "period", { period: nextPeriod, clockSeconds: periodLength(nextPeriod), playerIds: [], teamId: undefined });
      continue;
    }
    if (p.scoringPlay && p.scoreValue && p.scoreValue >= 1 && p.scoreValue <= 3) {
      push(p, "score", { points: p.scoreValue as Points, playerIds: participants.slice(0, 1) });
      continue;
    }
    if (typeText.includes("turnover")) {
      push(p, "turnover", { playerIds: participants.slice(0, 1) });
      if (text.includes("steals")) {
        push(p, "steal", { teamId: otherTeam(p.team?.id), playerIds: participants.slice(1, 2) });
      }
      continue;
    }
    if (p.shootingPlay && !p.scoringPlay && text.includes("blocks")) {
      push(p, "block", { teamId: otherTeam(p.team?.id), playerIds: participants.slice(1, 2) });
      continue;
    }
    push(p, "other");
  }

  return { id: summary.header.id, date: comp.date, home: toRoster(home), away: toRoster(away), plays };
}
```

Create `scripts/record-game.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { espnToRecordedGame, type EspnSummary } from "./espnToRecordedGame";

const eventId = process.argv[2];
if (!eventId) {
  console.error("usage: npm run record-game -- <espnEventId>");
  process.exit(1);
}

const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`ESPN responded ${res.status} for ${url}`);
  process.exit(1);
}
const summary = (await res.json()) as EspnSummary;
if (!summary.plays?.length) {
  console.error("summary has no plays; pick a completed game id from the ESPN scoreboard");
  process.exit(1);
}

const game = espnToRecordedGame(summary);
await mkdir("src/fixtures/games", { recursive: true });
const out = `src/fixtures/games/${game.id}.json`;
await writeFile(out, JSON.stringify(game, null, 2));
console.log(`wrote ${out}: ${game.plays.length} plays, ${game.home.abbreviation} vs ${game.away.abbreviation}`);
```

- [ ] **Step 5: Run the conversion test**

Run: `npm test -- scripts/espnToRecordedGame.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Record the shipped game**

```bash
npm run record-game -- 401809958
```

Expected: `wrote src/fixtures/games/401809958.json: <N> plays, ...` with N in the hundreds. If ESPN returns 400/404 or "no plays", find a completed game id instead:

```bash
curl -s "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20251022" | grep -o '"id":"[0-9]*","uid"' | head -3
```

Use one of those ids and record it. Whatever id is used, it becomes `<id>` below.

Sanity-check the fixture:

```bash
node -e "const g=require('./src/fixtures/games/<id>.json');const k={};for(const p of g.plays)k[p.kind]=(k[p.kind]||0)+1;console.log(g.home.abbreviation,g.away.abbreviation,k)"
```

Expected: counts for `score` (150 to 250), `block`, `steal`, `turnover`, `period` (3 or more), `final` (1), `other`.

- [ ] **Step 7: Write the fixture registry**

Create `src/fixtures/games/index.ts` (replace `<id>` with the recorded id):

```ts
import type { RecordedGame } from "@/features/gameplay/feeds/types";
import recorded from "./<id>.json";

export const games: RecordedGame[] = [recorded as RecordedGame];

export function findGame(id: string | null | undefined): RecordedGame | undefined {
  return games.find((g) => g.id === id);
}
```

Run: `npx tsc -b`
Expected: no errors (the JSON cast handles the `kind` string widening).

- [ ] **Step 8: Commit**

```bash
git add scripts src/fixtures
git commit -m "feat(fixtures): espn capture script and recorded game fixture"
```

---

### Task 7: Scenario tests over the shipped fixture

**Files:**
- Test: `src/features/gameplay/engine/scenarios.test.ts`

**Interfaces:**
- Consumes: `games` from `@/fixtures/games`, `buildTimeline` from feeds, `createInitialState`, `reduce`.

- [ ] **Step 1: Write the scenario tests**

These derive their expectations from the fixture, so they hold for any recorded game.

Create `src/features/gameplay/engine/scenarios.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { games } from "@/fixtures/games";
import { buildTimeline } from "@/features/gameplay/feeds/replayFeed";
import { createInitialState, reduce } from "./reduce";
import type { MissionConfig, ScenarioState, ShipAction } from "./types";

const game = games[0];

function topScorer(): { id: string; pts: number } {
  const tally = new Map<string, number>();
  for (const p of game.plays) {
    if (p.kind !== "score" || !p.points) continue;
    for (const id of p.playerIds) tally.set(id, (tally.get(id) ?? 0) + p.points);
  }
  const [id, pts] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  return { id, pts };
}

function run(myPlayerId: string, mission: MissionConfig) {
  let state = createInitialState(mission);
  const actions: ShipAction[] = [];
  const trace: { before: ScenarioState; after: ScenarioState; actions: ShipAction[] }[] = [];
  for (const item of buildTimeline(game, myPlayerId, 1)) {
    const r = reduce(state, item.event);
    trace.push({ before: state, after: r.state, actions: r.actions });
    actions.push(...r.actions);
    state = r.state;
  }
  return { state, actions, trace };
}

describe("full replay of the shipped fixture", () => {
  const star = topScorer();

  it("has a usable star scorer", () => {
    expect(star.pts).toBeGreaterThanOrEqual(10);
  });

  it("wins with warpOut when the mission is met mid-game, objective fires exactly once", () => {
    const { state, actions } = run(star.id, { stat: "pts", target: Math.ceil(star.pts / 2) });
    expect(state.status).toBe("won");
    expect(state.myPlayerStats.pts).toBe(star.pts);
    expect(actions.at(-1)).toEqual({ type: "warpOut" });
    const objectiveIdx = actions.findIndex((a) => a.type === "objectiveComplete");
    expect(actions.filter((a) => a.type === "objectiveComplete")).toHaveLength(1);
    expect(objectiveIdx).toBeGreaterThan(0);
    expect(objectiveIdx).toBeLessThan(actions.length - 1);
  });

  it("loses with explode when the mission is never met", () => {
    const { state, actions } = run(star.id, { stat: "pts", target: star.pts + 1 });
    expect(state.status).toBe("lost");
    expect(actions.at(-1)).toEqual({ type: "explode" });
    expect(actions.some((a) => a.type === "objectiveComplete")).toBe(false);
  });

  it("fires once per my-team score and keeps the hull at or above 1", () => {
    const { state, actions, trace } = run(star.id, { stat: "pts", target: 999 });
    const myTeamId = game.home.players.some((p) => p.id === star.id) ? game.home.id : game.away.id;
    const myScores = game.plays.filter((p) => p.kind === "score" && p.points && p.teamId === myTeamId).length;
    expect(actions.filter((a) => a.type === "fire")).toHaveLength(myScores);
    expect(state.enemiesDestroyed).toBe(myScores);
    for (const step of trace) expect(step.after.hull).toBeGreaterThanOrEqual(1);
  });

  it("absorbs opponent scores while shield charges exist", () => {
    const { trace } = run(star.id, { stat: "pts", target: 999 });
    const absorbed = trace.filter((s) => s.actions.some((a) => a.type === "hit" && a.absorbed));
    const unabsorbed = trace.filter((s) => s.actions.some((a) => a.type === "hit" && !a.absorbed));
    expect(absorbed.length).toBeGreaterThan(0);
    for (const step of absorbed) {
      expect(step.before.shield).toBeGreaterThan(0);
      expect(step.after.shield).toBe(step.before.shield - 1);
      expect(step.after.hull).toBe(step.before.hull);
    }
    for (const step of unabsorbed) {
      expect(step.before.shield).toBe(0);
      expect(step.after.hull).toBeLessThanOrEqual(step.before.hull);
    }
  });
});
```

- [ ] **Step 2: Run the scenario tests**

Run: `npm test -- src/features/gameplay/engine/scenarios.test.ts`
Expected: PASS, 5 tests. If "absorbs opponent scores" fails because `absorbed.length` is 0, the fixture has no blocks or steals credited to the star's team before an opponent score, which means the capture mapping missed them: re-check Task 6 Step 4's `blocks` / `steals` text matching against the raw ESPN play texts for that game and fix the mapping, do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add src/features/gameplay/engine/scenarios.test.ts
git commit -m "test(engine): replay scenarios over the recorded fixture"
```

---

### Task 8: Action queue

**Files:**
- Create: `src/features/gameplay/renderer/RendererPort.ts`, `src/features/gameplay/renderer/ActionQueue.ts`
- Test: `src/features/gameplay/renderer/ActionQueue.test.ts`

**Interfaces:**
- Consumes: `ShipAction`, `ScenarioState`.
- Produces:
  - `interface RendererPort { enqueue(actions: ShipAction[]): void; syncState(state: ScenarioState): void }` and `NULL_RENDERER: RendererPort`
  - `class ActionQueue { constructor(run: ActionRunner, gapMs?: number, wait?: Waiter); enqueue(actions: ShipAction[]): void; clear(): void; get pending(): number; get busy(): boolean }` with `type ActionRunner = (a: ShipAction) => Promise<void>` and `type Waiter = (ms: number) => Promise<void>`.

- [ ] **Step 1: Write the port**

Create `src/features/gameplay/renderer/RendererPort.ts`:

```ts
import type { ScenarioState, ShipAction } from "@/features/gameplay/engine/types";

export interface RendererPort {
  enqueue(actions: ShipAction[]): void;
  syncState(state: ScenarioState): void;
}

export const NULL_RENDERER: RendererPort = {
  enqueue() {},
  syncState() {},
};
```

- [ ] **Step 2: Write the failing queue tests**

Create `src/features/gameplay/renderer/ActionQueue.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { ShipAction } from "@/features/gameplay/engine/types";
import { ActionQueue } from "./ActionQueue";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

const fire: ShipAction = { type: "fire", size: "scout", charged: false };
const stall: ShipAction = { type: "stall" };
const hit: ShipAction = { type: "hit", points: 2, absorbed: false };

describe("ActionQueue", () => {
  it("runs actions one at a time in order with a gap between them", async () => {
    const started: ShipAction[] = [];
    const pending: ReturnType<typeof deferred>[] = [];
    const run = vi.fn((a: ShipAction) => { started.push(a); const d = deferred(); pending.push(d); return d.promise; });
    const waits: ReturnType<typeof deferred>[] = [];
    const wait = vi.fn((_ms: number) => { const d = deferred(); waits.push(d); return d.promise; });

    const q = new ActionQueue(run, 150, wait);
    q.enqueue([fire, stall, hit]);
    await Promise.resolve();

    expect(started).toEqual([fire]);
    expect(q.pending).toBe(2);
    expect(q.busy).toBe(true);

    pending[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(wait).toHaveBeenCalledWith(150);
    expect(started).toEqual([fire]);

    waits[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual([fire, stall]);

    pending[1].resolve();
    await Promise.resolve();
    await Promise.resolve();
    waits[1].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual([fire, stall, hit]);

    pending[2].resolve();
    await Promise.resolve();
    await Promise.resolve();
    waits[2].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(q.busy).toBe(false);
    expect(q.pending).toBe(0);
  });

  it("keeps draining when one animation rejects", async () => {
    const seen: string[] = [];
    const run = vi.fn(async (a: ShipAction) => { seen.push(a.type); if (a.type === "fire") throw new Error("boom"); });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const q = new ActionQueue(run, 0, async () => {});
    q.enqueue([fire, stall]);
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(["fire", "stall"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("appends actions enqueued while draining and clear drops the rest", async () => {
    const seen: string[] = [];
    const first = deferred();
    const run = vi.fn((a: ShipAction) => { seen.push(a.type); return a.type === "fire" ? first.promise : Promise.resolve(); });
    const q = new ActionQueue(run, 0, async () => {});
    q.enqueue([fire]);
    q.enqueue([stall, hit]);
    expect(q.pending).toBe(2);
    q.clear();
    expect(q.pending).toBe(0);
    first.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(["fire"]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/renderer/ActionQueue.test.ts`
Expected: FAIL, "Failed to resolve import ./ActionQueue".

- [ ] **Step 4: Write the queue**

Create `src/features/gameplay/renderer/ActionQueue.ts`:

```ts
import type { ShipAction } from "@/features/gameplay/engine/types";

export type ActionRunner = (action: ShipAction) => Promise<void>;
export type Waiter = (ms: number) => Promise<void>;

const defaultWait: Waiter = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ActionQueue {
  private queue: ShipAction[] = [];
  private draining = false;

  constructor(
    private readonly run: ActionRunner,
    private readonly gapMs = 150,
    private readonly wait: Waiter = defaultWait,
  ) {}

  get pending(): number {
    return this.queue.length;
  }

  get busy(): boolean {
    return this.draining;
  }

  enqueue(actions: ShipAction[]): void {
    this.queue.push(...actions);
    void this.drain();
  }

  clear(): void {
    this.queue = [];
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const action = this.queue.shift()!;
        try {
          await this.run(action);
        } catch (err) {
          console.warn("ship animation failed", action, err);
        }
        await this.wait(this.gapMs);
      }
    } finally {
      this.draining = false;
    }
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/features/gameplay/renderer/ActionQueue.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/renderer
git commit -m "feat(renderer): renderer port and sequential action queue"
```

---

### Task 9: PixiJS renderer with placeholder art and animations

**Files:**
- Create: `src/features/gameplay/renderer/tween.ts`, `src/features/gameplay/renderer/world.ts`, `src/features/gameplay/renderer/animations.ts`, `src/features/gameplay/renderer/ScenarioRenderer.ts`

**Interfaces:**
- Consumes: `ActionQueue`, `RendererPort`, `ShipAction`, `ScenarioState`, `HULL_MAX`, `SHIELD_MAX`.
- Produces: `class ScenarioRenderer implements RendererPort { mount(canvas: HTMLCanvasElement): Promise<void>; destroy(): void; enqueue(actions): void; syncState(state): void }`; `runAnimation(world: World, action: ShipAction): Promise<void>`.

No automated tests. Verified manually in Task 12 through the debug panel.

- [ ] **Step 1: Write the tween helper**

Create `src/features/gameplay/renderer/tween.ts`:

```ts
import type { Ticker } from "pixi.js";

/** Runs `update(t)` with t from 0 to 1 over `ms` milliseconds on the ticker. */
export function tween(ticker: Ticker, ms: number, update: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (tk: Ticker) => {
      elapsed += tk.deltaMS;
      const t = Math.min(1, elapsed / ms);
      update(t);
      if (t >= 1) {
        ticker.remove(tick);
        resolve();
      }
    };
    ticker.add(tick);
  });
}

export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
```

- [ ] **Step 2: Write the world builder**

Create `src/features/gameplay/renderer/world.ts`:

```ts
import { Application, Container, Graphics } from "pixi.js";
import type { EnemySize } from "@/features/gameplay/engine/types";

export type World = {
  app: Application;
  width: number;
  height: number;
  starfield: Container;
  meteorites: Container;
  enemyLane: Container;
  shipLayer: Container;
  effects: Container;
  ship: Container;
  shipBase: { x: number; y: number };
  shieldRing: Graphics;
  smoke: Graphics;
  stars: { g: Graphics; speed: number }[];
  rocks: { g: Graphics; speed: number; spin: number }[];
};

const COLORS = {
  ship: 0x38bdf8,
  shield: 0x22d3ee,
  enemy: 0xf43f5e,
  bullet: 0xfde047,
  enemyBullet: 0xfb7185,
  star: 0xffffff,
  rock: 0x64748b,
  gold: 0xfbbf24,
};

export const ENEMY_RADIUS: Record<EnemySize, number> = { scout: 12, fighter: 20, cruiser: 32 };

function makeShip(): Container {
  const ship = new Container();
  const hull = new Graphics().poly([-22, -14, 26, 0, -22, 14, -12, 0]).fill(COLORS.ship);
  const flame = new Graphics().poly([-22, -5, -36, 0, -22, 5]).fill(0xf97316);
  ship.addChild(flame, hull);
  return ship;
}

export function buildWorld(app: Application): World {
  const width = app.screen.width;
  const height = app.screen.height;

  const starfield = new Container();
  const meteorites = new Container();
  const enemyLane = new Container();
  const shipLayer = new Container();
  const effects = new Container();
  app.stage.addChild(starfield, meteorites, enemyLane, shipLayer, effects);

  const stars = Array.from({ length: 80 }, () => {
    const g = new Graphics().circle(0, 0, Math.random() * 1.5 + 0.5).fill({ color: COLORS.star, alpha: 0.4 + Math.random() * 0.6 });
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    starfield.addChild(g);
    return { g, speed: 0.3 + Math.random() * 1.2 };
  });

  const rocks = Array.from({ length: 6 }, () => {
    const r = 8 + Math.random() * 14;
    const pts: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      const rr = r * (0.7 + Math.random() * 0.3);
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const g = new Graphics().poly(pts).fill(COLORS.rock);
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    meteorites.addChild(g);
    return { g, speed: 0.6 + Math.random() * 1.0, spin: (Math.random() - 0.5) * 0.02 };
  });

  const ship = makeShip();
  const shipBase = { x: width * 0.2, y: height / 2 };
  ship.position.set(shipBase.x, shipBase.y);

  const shieldRing = new Graphics().circle(0, 0, 40).stroke({ width: 3, color: COLORS.shield });
  shieldRing.alpha = 0;
  ship.addChild(shieldRing);

  const smoke = new Graphics().circle(-10, 0, 14).fill({ color: 0x475569 });
  smoke.alpha = 0;
  ship.addChild(smoke);

  shipLayer.addChild(ship);

  return { app, width, height, starfield, meteorites, enemyLane, shipLayer, effects, ship, shipBase, shieldRing, smoke, stars, rocks };
}

export function spawnEnemy(world: World, size: EnemySize): Graphics {
  const r = ENEMY_RADIUS[size];
  const enemy = new Graphics().poly([r, 0, -r, -r * 0.8, -r * 0.5, 0, -r, r * 0.8]).fill(COLORS.enemy);
  enemy.x = world.width * 0.8;
  enemy.y = world.height / 2 + (Math.random() - 0.5) * world.height * 0.4;
  world.enemyLane.addChild(enemy);
  return enemy;
}

export function bullet(world: World, radius: number, color = COLORS.bullet): Graphics {
  const b = new Graphics().circle(0, 0, radius).fill(color);
  world.effects.addChild(b);
  return b;
}

export { COLORS };
```

- [ ] **Step 3: Write the animations**

Create `src/features/gameplay/renderer/animations.ts`:

```ts
import { Graphics } from "pixi.js";
import type { ShipAction } from "@/features/gameplay/engine/types";
import { COLORS, bullet, spawnEnemy, type World } from "./world";
import { easeOut, tween } from "./tween";

const DURATION = {
  fire: 600,
  hit: 500,
  shieldUp: 400,
  fizzle: 400,
  stall: 1000,
  enemyMalfunction: 800,
  objectiveComplete: 1200,
  warpOut: 2000,
  explode: 2000,
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

async function fire(world: World, size: "scout" | "fighter" | "cruiser", charged: boolean) {
  const { app, ship } = world;
  const enemy = spawnEnemy(world, size);
  const shot = bullet(world, charged ? 7 : 3);
  const travel = DURATION.fire * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(ship.x + 26, enemy.x, t);
    shot.y = lerp(ship.y, enemy.y, t);
  });
  shot.destroy();
  const ring = charged ? new Graphics().circle(0, 0, 10).stroke({ width: 3, color: COLORS.bullet }) : null;
  if (ring) {
    ring.position.set(enemy.x, enemy.y);
    world.effects.addChild(ring);
  }
  await tween(app.ticker, DURATION.fire - travel, (t) => {
    enemy.scale.set(1 + t * (charged ? 1.4 : 0.8));
    enemy.alpha = 1 - t;
    if (ring) {
      ring.scale.set(1 + t * 6);
      ring.alpha = 1 - t;
    }
  });
  ring?.destroy();
  enemy.destroy();
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean) {
  const { app, ship, shieldRing, shipBase } = world;
  const shot = bullet(world, 2 + points, COLORS.enemyBullet);
  const startX = world.width * 0.85;
  const startY = ship.y + (Math.random() - 0.5) * 80;
  const travel = DURATION.hit * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(startX, ship.x, t);
    shot.y = lerp(startY, ship.y, t);
  });
  shot.destroy();
  if (absorbed) {
    const before = shieldRing.alpha;
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, before, t);
      shieldRing.scale.set(1 + (1 - t) * 0.2);
    });
    shieldRing.scale.set(1);
    return;
  }
  const amplitude = points * 3;
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = shipBase.x + Math.sin(t * 40) * amplitude * (1 - t);
    ship.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
  });
  ship.x = shipBase.x;
  ship.tint = 0xffffff;
}

async function shieldUp(world: World) {
  const { app, shieldRing } = world;
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const pulse = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(pulse);
  });
  shieldRing.scale.set(1);
}

async function fizzle(world: World) {
  const { app, ship } = world;
  const shot = bullet(world, 3);
  await tween(app.ticker, DURATION.fizzle, (t) => {
    shot.x = ship.x + 26 + t * world.width * 0.25;
    shot.y = ship.y + Math.sin(t * 12) * 6;
    shot.alpha = 1 - easeOut(t);
  });
  shot.destroy();
}

async function stall(world: World) {
  const { app, ship, shipBase } = world;
  await tween(app.ticker, DURATION.stall, (t) => {
    ship.rotation = Math.PI * 2 * easeOut(t);
    ship.x = shipBase.x - 20 * Math.sin(t * Math.PI);
  });
  ship.rotation = 0;
  ship.x = shipBase.x;
}

async function enemyMalfunction(world: World) {
  const enemy = spawnEnemy(world, "fighter");
  const startY = enemy.y;
  await tween(world.app.ticker, DURATION.enemyMalfunction, (t) => {
    enemy.y = startY - t * 220;
    enemy.rotation = t * 6;
    enemy.alpha = 1 - t;
  });
  enemy.destroy();
}

async function objectiveComplete(world: World) {
  const ring = new Graphics().circle(0, 0, 20).stroke({ width: 4, color: COLORS.gold });
  ring.position.set(world.ship.x, world.ship.y);
  world.effects.addChild(ring);
  await tween(world.app.ticker, DURATION.objectiveComplete, (t) => {
    ring.scale.set(1 + t * 8);
    ring.alpha = 1 - t;
  });
  ring.destroy();
}

async function warpOut(world: World) {
  const { app, ship, shipBase } = world;
  await tween(app.ticker, DURATION.warpOut, (t) => {
    ship.scale.x = 1 + t * 3;
    ship.x = shipBase.x + (world.width - shipBase.x + 200) * t * t;
    ship.alpha = 1 - t * t;
  });
}

async function explode(world: World) {
  const { app, ship } = world;
  const parts = Array.from({ length: 12 }, (_, i) => {
    const p = bullet(world, 4, i % 2 ? COLORS.ship : 0xf97316);
    p.position.set(ship.x, ship.y);
    const a = (i / 12) * Math.PI * 2;
    return { p, dx: Math.cos(a) * 160, dy: Math.sin(a) * 160 };
  });
  await tween(app.ticker, DURATION.explode, (t) => {
    ship.alpha = 1 - t;
    ship.scale.set(1 + t);
    for (const { p, dx, dy } of parts) {
      p.x = ship.x + dx * easeOut(t);
      p.y = ship.y + dy * easeOut(t);
      p.alpha = 1 - t;
    }
  });
  for (const { p } of parts) p.destroy();
}

export function runAnimation(world: World, action: ShipAction): Promise<void> {
  switch (action.type) {
    case "fire":
      return fire(world, action.size, action.charged);
    case "hit":
      return hit(world, action.points, action.absorbed);
    case "shieldUp":
      return shieldUp(world);
    case "fizzle":
      return fizzle(world);
    case "stall":
      return stall(world);
    case "enemyMalfunction":
      return enemyMalfunction(world);
    case "objectiveComplete":
      return objectiveComplete(world);
    case "warpOut":
      return warpOut(world);
    case "explode":
      return explode(world);
  }
}
```

- [ ] **Step 4: Write the renderer**

Create `src/features/gameplay/renderer/ScenarioRenderer.ts`:

```ts
import { Application, type Ticker } from "pixi.js";
import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import type { ScenarioState, ShipAction } from "@/features/gameplay/engine/types";
import { ActionQueue } from "./ActionQueue";
import { runAnimation } from "./animations";
import type { RendererPort } from "./RendererPort";
import { buildWorld, type World } from "./world";

export class ScenarioRenderer implements RendererPort {
  private app: Application | null = null;
  private world: World | null = null;
  private queue: ActionQueue | null = null;

  async mount(canvas: HTMLCanvasElement): Promise<void> {
    const app = new Application();
    await app.init({
      canvas,
      resizeTo: canvas.parentElement ?? undefined,
      background: 0x05060f,
      antialias: true,
    });
    const world = buildWorld(app);
    this.app = app;
    this.world = world;
    this.queue = new ActionQueue((action) => runAnimation(world, action));
    app.ticker.add(this.idle);
  }

  destroy(): void {
    this.queue?.clear();
    this.queue = null;
    this.world = null;
    if (this.app) {
      this.app.ticker.remove(this.idle);
      this.app.destroy({ removeView: false }, { children: true });
      this.app = null;
    }
  }

  enqueue(actions: ShipAction[]): void {
    this.queue?.enqueue(actions);
  }

  syncState(state: ScenarioState): void {
    if (!this.world) return;
    this.world.shieldRing.alpha = state.shield / SHIELD_MAX;
    this.world.smoke.alpha = Math.min(0.9, 1 - state.hull / HULL_MAX);
  }

  private idle = (ticker: Ticker): void => {
    const world = this.world;
    if (!world) return;
    const dt = ticker.deltaTime;
    for (const star of world.stars) {
      star.g.x -= star.speed * dt;
      if (star.g.x < -2) {
        star.g.x = world.width + 2;
        star.g.y = Math.random() * world.height;
      }
    }
    for (const rock of world.rocks) {
      rock.g.x -= rock.speed * dt;
      rock.g.rotation += rock.spin * dt;
      if (rock.g.x < -40) {
        rock.g.x = world.width + 40;
        rock.g.y = Math.random() * world.height;
      }
    }
  };
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b`
Expected: no errors. If `app.destroy` complains about its signature, check `node_modules/pixi.js/lib/app/Application.d.ts` and match the installed 8.x signature; the intent is "do not remove the canvas element, destroy children".

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/renderer
git commit -m "feat(renderer): pixi world, placeholder ship art and action animations"
```

---

### Task 10: useScenario hook

**Files:**
- Create: `src/features/gameplay/hooks/useScenario.ts`, `src/features/gameplay/feeds/testFeed.ts`
- Test: `src/features/gameplay/hooks/useScenario.test.ts`

**Interfaces:**
- Consumes: `Feed`, `RendererPort`, `MissionConfig`, `ScenarioState`, `createInitialState`, `reduce`.
- Produces: `useScenario(feed: Feed | null, mission: MissionConfig, renderer: RendererPort | null): ScenarioState`; `createTestFeed(): Feed & { emit(e: GameEvent): void }`.

- [ ] **Step 1: Write the test feed**

Create `src/features/gameplay/feeds/testFeed.ts`:

```ts
import type { GameEvent } from "@/features/gameplay/engine/types";
import type { Feed } from "./types";

export type TestFeed = Feed & { emit(e: GameEvent): void };

export function createTestFeed(): TestFeed {
  const listeners = new Set<(e: GameEvent) => void>();
  return {
    start() {},
    stop() {},
    pause() {},
    step() {},
    onEvent(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    emit(e) {
      for (const l of listeners) l(e);
    },
  };
}
```

- [ ] **Step 2: Write the failing hook tests**

Create `src/features/gameplay/hooks/useScenario.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { at } from "@/features/gameplay/engine/testUtils";
import { createTestFeed } from "@/features/gameplay/feeds/testFeed";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { useScenario } from "./useScenario";

function mockRenderer(): RendererPort & { enqueue: ReturnType<typeof vi.fn>; syncState: ReturnType<typeof vi.fn> } {
  return { enqueue: vi.fn(), syncState: vi.fn() };
}

const mission = { stat: "pts" as const, target: 5 };

describe("useScenario", () => {
  it("returns the initial state before any event", () => {
    const { result } = renderHook(() => useScenario(null, mission, null));
    expect(result.current.hull).toBe(100);
    expect(result.current.status).toBe("pending");
  });

  it("reduces feed events, forwards actions and state to the renderer", () => {
    const feed = createTestFeed();
    const renderer = mockRenderer();
    const { result } = renderHook(() => useScenario(feed, mission, renderer));

    act(() => feed.emit({ kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at({ away: 3 }) }));

    expect(result.current.hull).toBe(94);
    expect(renderer.enqueue).toHaveBeenCalledWith([{ type: "hit", points: 3, absorbed: false }]);
    expect(renderer.syncState).toHaveBeenLastCalledWith(expect.objectContaining({ hull: 94 }));
  });

  it("works without a renderer and picks one up later", () => {
    const feed = createTestFeed();
    const renderer = mockRenderer();
    const { result, rerender } = renderHook(({ r }) => useScenario(feed, mission, r), { initialProps: { r: null as RendererPort | null } });

    act(() => feed.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() }));
    expect(result.current.myPlayerStats.pts).toBe(2);

    rerender({ r: renderer });
    act(() => feed.emit({ kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() }));
    expect(renderer.enqueue).toHaveBeenCalledWith([{ type: "fire", size: "cruiser", charged: true }, { type: "objectiveComplete" }]);
  });

  it("resets when the feed changes and unsubscribes from the old one", () => {
    const first = createTestFeed();
    const second = createTestFeed();
    const renderer = mockRenderer();
    const { result, rerender } = renderHook(({ f }) => useScenario(f, mission, renderer), { initialProps: { f: first } });

    act(() => first.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(96);

    rerender({ f: second });
    expect(result.current.hull).toBe(100);

    act(() => first.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(100);

    act(() => second.emit({ kind: "score", side: "theirs", points: 1, byMyPlayer: false, at: at() }));
    expect(result.current.hull).toBe(98);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/hooks/useScenario.test.ts`
Expected: FAIL, "Failed to resolve import ./useScenario".

- [ ] **Step 4: Write the hook**

Create `src/features/gameplay/hooks/useScenario.ts`:

```ts
import { useEffect, useRef, useState } from "react";
import { createInitialState, reduce } from "@/features/gameplay/engine/reduce";
import type { MissionConfig, ScenarioState } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";

/**
 * The only bridge between feed, engine and renderer.
 * Folds every feed event through `reduce`, pushes actions and state to the renderer,
 * and exposes the current state to React.
 */
export function useScenario(feed: Feed | null, mission: MissionConfig, renderer: RendererPort | null): ScenarioState {
  const [state, setState] = useState<ScenarioState>(() => createInitialState(mission));
  const stateRef = useRef(state);
  const rendererRef = useRef(renderer);

  useEffect(() => {
    rendererRef.current = renderer;
  }, [renderer]);

  useEffect(() => {
    const initial = createInitialState(mission);
    stateRef.current = initial;
    setState(initial);
    if (!feed) return;
    return feed.onEvent((event) => {
      const { state: next, actions } = reduce(stateRef.current, event);
      stateRef.current = next;
      if (actions.length > 0) rendererRef.current?.enqueue(actions);
      rendererRef.current?.syncState(next);
      setState(next);
    });
    // mission is compared by value so a new object with the same config does not reset the run
  }, [feed, mission.stat, mission.target]);

  return state;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/features/gameplay/hooks/useScenario.test.ts`
Expected: PASS, 4 tests. If the "works without a renderer" test fails on `enqueue` not being called, note that `rendererRef` is updated in an effect that runs after the rerender commits, before the next `act`, so it should pass; check that `renderer.enqueue` is asserted after the second `act`.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/hooks src/features/gameplay/feeds/testFeed.ts
git commit -m "feat(gameplay): useScenario bridge between feed, engine and renderer"
```

---

### Task 11: Setup panel, HUD, canvas host, result overlay, and page wiring

**Files:**
- Create: `src/features/gameplay/components/SetupPanel.tsx`, `src/features/gameplay/components/Hud.tsx`, `src/features/gameplay/components/ScenarioCanvas.tsx`, `src/features/gameplay/components/ResultOverlay.tsx`, `src/features/gameplay/components/types.ts`
- Modify: `src/features/gameplay/components/GamePlayPage.tsx`
- Test: `src/features/gameplay/components/GamePlayPage.test.tsx`

**Interfaces:**
- Consumes: `games`, `findGame` from `@/fixtures/games`; `createReplayFeed`, `findTeamId`; `useScenario`; `ScenarioRenderer`, `NULL_RENDERER`, `RendererPort`; `Button` from `@/components/ui/button`.
- Produces:
  - `type StartConfig = { gameId: string; playerId: string; mission: MissionConfig; speed: number }` in `components/types.ts`
  - `SetupPanel({ games, initialGameId?, initialPlayerId?, onStart })`
  - `Hud({ state, game, myTeamId })`
  - `ScenarioCanvas({ onReady })` calling `onReady(renderer)` once mounted, or `onReady(NULL_RENDERER)` on failure
  - `ResultOverlay({ state, onReplay })`
  - `GamePlayPage` keeps an `<h1>` whose accessible name is "Game Play" in every state. Task 12 adds `DebugPanel` into it.

- [ ] **Step 1: Write the shared type**

Create `src/features/gameplay/components/types.ts`:

```ts
import type { MissionConfig } from "@/features/gameplay/engine/types";

export type StartConfig = {
  gameId: string;
  playerId: string;
  mission: MissionConfig;
  speed: number;
};
```

- [ ] **Step 2: Write the failing page test**

Create `src/features/gameplay/components/GamePlayPage.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games } from "@/fixtures/games";
import { GamePlayPage } from "./GamePlayPage";

const enqueue = vi.fn();
const syncState = vi.fn();

vi.mock("@/features/gameplay/renderer/ScenarioRenderer", () => ({
  ScenarioRenderer: class {
    mount = vi.fn(() => Promise.resolve());
    destroy = vi.fn();
    enqueue = enqueue;
    syncState = syncState;
  },
}));

describe("GamePlayPage", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts a replay from the setup panel and runs it to a result", async () => {
    const game = games[0];
    const player = game.home.players[0];

    render(
      <MemoryRouter initialEntries={["/game-play"]}>
        <GamePlayPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /game play/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/player/i), { target: { value: player.id } });
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/speed/i), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("progressbar", { name: /hull/i })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByText(/mission (success|failed)/i)).toBeInTheDocument();
    expect(syncState).toHaveBeenCalled();
    expect(screen.getByTestId("score").textContent).not.toBe("0 - 0");
  });

  it("shows an error when the URL points at a game that is not recorded", () => {
    render(
      <MemoryRouter initialEntries={["/game-play?gameId=nope&playerId=x"]}>
        <GamePlayPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no recorded game with id "nope"/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/features/gameplay/components/GamePlayPage.test.tsx`
Expected: FAIL, "Unable to find a label with the text of: /player/i".

- [ ] **Step 4: Write the components**

Create `src/features/gameplay/components/SetupPanel.tsx`:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MissionStat } from "@/features/gameplay/engine/types";
import type { RecordedGame } from "@/features/gameplay/feeds/types";
import type { StartConfig } from "./types";

type Props = {
  games: RecordedGame[];
  initialGameId?: string;
  initialPlayerId?: string;
  error?: string | null;
  onStart: (config: StartConfig) => void;
};

const selectClass = "rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100";

export function SetupPanel({ games, initialGameId, initialPlayerId, error, onStart }: Props) {
  const firstGame = games.find((g) => g.id === initialGameId) ?? games[0];
  const [gameId, setGameId] = useState(firstGame?.id ?? "");
  const game = games.find((g) => g.id === gameId) ?? firstGame;
  const roster = game ? [...game.home.players.map((p) => ({ ...p, team: game.home.abbreviation })), ...game.away.players.map((p) => ({ ...p, team: game.away.abbreviation }))] : [];
  const [playerId, setPlayerId] = useState(roster.some((p) => p.id === initialPlayerId) ? initialPlayerId! : roster[0]?.id ?? "");
  const [stat, setStat] = useState<MissionStat>("pts");
  const [target, setTarget] = useState(20);
  const [speed, setSpeed] = useState(16);

  if (!game) {
    return <p className="text-rose-400">No recorded games are available. Run `npm run record-game -- &lt;espnEventId&gt;` first.</p>;
  }

  return (
    <form
      className="flex max-w-md flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!playerId) return;
        onStart({ gameId: game.id, playerId, mission: { stat, target }, speed });
      }}
    >
      {error ? <p className="text-rose-400">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm">
        Game
        <select className={selectClass} value={game.id} onChange={(e) => { setGameId(e.target.value); setPlayerId(""); }}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.home.abbreviation} vs {g.away.abbreviation} ({g.date.slice(0, 10)})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Player
        <select className={selectClass} value={playerId || roster[0]?.id} onChange={(e) => setPlayerId(e.target.value)}>
          {roster.map((p) => (
            <option key={p.id} value={p.id}>{p.team} · {p.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Mission stat
        <select className={selectClass} value={stat} onChange={(e) => setStat(e.target.value as MissionStat)}>
          <option value="pts">Points</option>
          <option value="blk">Blocks</option>
          <option value="stl">Steals</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Target
        <input className={selectClass} type="number" min={1} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Speed
        <input className={selectClass} type="number" min={1} value={speed} onChange={(e) => setSpeed(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <Button type="submit">Start</Button>
    </form>
  );
}
```

Create `src/features/gameplay/components/Hud.tsx`:

```tsx
import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import type { ScenarioState } from "@/features/gameplay/engine/types";
import type { RecordedGame } from "@/features/gameplay/feeds/types";

type Props = { state: ScenarioState; game: RecordedGame; myTeamId: string };

const STAT_LABEL = { pts: "PTS", blk: "BLK", stl: "STL" } as const;

function formatClock(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = Math.floor(secondsLeft % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hud({ state, game, myTeamId }: Props) {
  const mine = (id: string) => (id === myTeamId ? "text-cyan-300" : "text-slate-400");
  const periodLabel = state.clock.period <= 4 ? `Q${state.clock.period}` : `OT${state.clock.period - 4}`;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-4 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span>HULL</span>
        <div role="progressbar" aria-label="hull" aria-valuemin={0} aria-valuemax={HULL_MAX} aria-valuenow={state.hull} className="h-3 w-40 overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-emerald-400" style={{ width: `${(state.hull / HULL_MAX) * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1" aria-label={`shield ${state.shield} of ${SHIELD_MAX}`}>
        <span>SHIELD</span>
        {Array.from({ length: SHIELD_MAX }, (_, i) => (
          <span key={i} className={`inline-block h-3 w-3 rounded-full ${i < state.shield ? "bg-cyan-300" : "bg-slate-700"}`} />
        ))}
      </div>
      <div>COMBO x{state.combo}</div>
      <div data-testid="score" className="font-mono">
        <span className={mine(game.home.id)}>{game.home.abbreviation} {state.clock.home}</span>
        {" - "}
        <span className={mine(game.away.id)}>{state.clock.away} {game.away.abbreviation}</span>
      </div>
      <div className="font-mono">{periodLabel} {formatClock(state.clock.secondsLeft)}</div>
      <div>
        MISSION {STAT_LABEL[state.mission.stat]} {state.myPlayerStats[state.mission.stat]} / {state.mission.target}
        {state.mission.met ? " ✓" : ""}
      </div>
      <div>KILLS {state.enemiesDestroyed}</div>
    </div>
  );
}
```

Create `src/features/gameplay/components/ScenarioCanvas.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { NULL_RENDERER, type RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { ScenarioRenderer } from "@/features/gameplay/renderer/ScenarioRenderer";

type Props = { onReady: (renderer: RendererPort) => void };

export function ScenarioCanvas({ onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new ScenarioRenderer();
    let cancelled = false;
    let mounted = false;

    renderer
      .mount(canvas)
      .then(() => {
        mounted = true;
        if (cancelled) {
          renderer.destroy();
          return;
        }
        onReady(renderer);
      })
      .catch((err: unknown) => {
        console.warn("scene could not start, running HUD-only", err);
        if (!cancelled) {
          setFallback(true);
          onReady(NULL_RENDERER);
        }
      });

    return () => {
      cancelled = true;
      if (mounted) renderer.destroy();
    };
  }, [onReady]);

  return (
    <div className="relative min-h-[360px] flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {fallback ? (
        <p className="absolute inset-x-0 bottom-4 text-center text-slate-400">HUD-only mode: the scene could not start in this browser.</p>
      ) : null}
    </div>
  );
}
```

Create `src/features/gameplay/components/ResultOverlay.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import type { ScenarioState } from "@/features/gameplay/engine/types";

type Props = { state: ScenarioState; onReplay: () => void };

export function ResultOverlay({ state, onReplay }: Props) {
  const won = state.status === "won";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80">
      <div className="flex flex-col items-center gap-3 rounded border border-slate-700 bg-slate-900 p-6 text-center">
        <h2 className={`text-3xl font-bold ${won ? "text-emerald-400" : "text-rose-400"}`}>
          {won ? "MISSION SUCCESS" : "MISSION FAILED"}
        </h2>
        <p className="text-slate-300">
          Enemies destroyed {state.enemiesDestroyed} · Hull {state.hull} · PTS {state.myPlayerStats.pts} · BLK {state.myPlayerStats.blk} · STL {state.myPlayerStats.stl} · TOV {state.myPlayerStats.tov}
        </p>
        <Button onClick={onReplay}>Replay</Button>
      </div>
    </div>
  );
}
```

Replace `src/features/gameplay/components/GamePlayPage.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { MissionConfig } from "@/features/gameplay/engine/types";
import { createReplayFeed, findTeamId } from "@/features/gameplay/feeds/replayFeed";
import { useScenario } from "@/features/gameplay/hooks/useScenario";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { findGame, games } from "@/fixtures/games";
import { Hud } from "./Hud";
import { ResultOverlay } from "./ResultOverlay";
import { ScenarioCanvas } from "./ScenarioCanvas";
import { SetupPanel } from "./SetupPanel";
import type { StartConfig } from "./types";

const DEFAULT_MISSION: MissionConfig = { stat: "pts", target: 20 };

export function GamePlayPage() {
  const [params] = useSearchParams();
  const gameIdParam = params.get("gameId");
  const playerIdParam = params.get("playerId");
  const urlError = gameIdParam && !findGame(gameIdParam) ? `No recorded game with id "${gameIdParam}". Pick one below.` : null;

  const [config, setConfig] = useState<StartConfig | null>(null);
  const [renderer, setRenderer] = useState<RendererPort | null>(null);

  const game = config ? findGame(config.gameId) : undefined;
  const feed = useMemo(
    () => (config && game ? createReplayFeed(game, { myPlayerId: config.playerId, speed: config.speed }) : null),
    [config, game],
  );
  const mission = config?.mission ?? DEFAULT_MISSION;
  const state = useScenario(feed, mission, renderer);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  useEffect(() => {
    if (!feed || !renderer) return;
    feed.start();
    return () => feed.stop();
  }, [feed, renderer]);

  const reset = () => {
    setConfig(null);
    setRenderer(null);
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
  const finished = state.status === "won" || state.status === "lost";

  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">Game Play</h1>
      <Hud state={state} game={game} myTeamId={myTeamId} />
      <ScenarioCanvas onReady={handleReady} />
      {finished ? <ResultOverlay state={state} onReplay={reset} /> : null}
    </section>
  );
}
```

- [ ] **Step 5: Run the page test, the router test, and the type check**

Run: `npm test -- src/features/gameplay/components src/app`
Expected: PASS, 4 tests across 2 files. If the first page test times out, raise the advance to `600_000` ms: speed 1000 on a 48-minute game is about 3 seconds of timers, so 60 seconds is ample unless the fixture has overtime gaps; it should not need more.

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Manual check in the browser**

Run: `npm run dev`, open http://localhost:5173/game-play, pick a player, set Target 10, Speed 32, click Start. Expected: starfield and meteorites scroll, ship on the left, enemies pop in and explode when the chosen team scores, hull bar drops on opponent scores, result overlay at the end. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/features/gameplay/components
git commit -m "feat(gameplay): setup panel, hud, canvas host, result overlay and page wiring"
```

---

### Task 12: Debug panel, docs, and workspace registration

**Files:**
- Create: `src/features/gameplay/components/DebugPanel.tsx`, `README.md`, `CLAUDE.md`
- Modify: `src/features/gameplay/components/GamePlayPage.tsx`, `C:\Users\Oscar Cordero\projects\zingi\CLAUDE.md`

**Interfaces:**
- Consumes: `Feed`, `RendererPort`, `ShipAction`.
- Produces: `DebugPanel({ feed, renderer })`, rendered only when `import.meta.env.DEV`.

- [ ] **Step 1: Write the debug panel**

Create `src/features/gameplay/components/DebugPanel.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import type { ShipAction } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";

type Props = { feed: Feed | null; renderer: RendererPort | null };

const SAMPLES: { label: string; action: ShipAction }[] = [
  { label: "fire scout", action: { type: "fire", size: "scout", charged: false } },
  { label: "fire fighter", action: { type: "fire", size: "fighter", charged: false } },
  { label: "fire cruiser charged", action: { type: "fire", size: "cruiser", charged: true } },
  { label: "hit 3", action: { type: "hit", points: 3, absorbed: false } },
  { label: "hit absorbed", action: { type: "hit", points: 2, absorbed: true } },
  { label: "shieldUp", action: { type: "shieldUp" } },
  { label: "fizzle", action: { type: "fizzle" } },
  { label: "stall", action: { type: "stall" } },
  { label: "enemyMalfunction", action: { type: "enemyMalfunction" } },
  { label: "objectiveComplete", action: { type: "objectiveComplete" } },
  { label: "warpOut", action: { type: "warpOut" } },
  { label: "explode", action: { type: "explode" } },
];

export function DebugPanel({ feed, renderer }: Props) {
  return (
    <div className="absolute bottom-0 left-0 z-10 flex max-w-full flex-wrap gap-1 bg-slate-950/70 p-2 text-xs">
      <Button size="sm" variant="secondary" onClick={() => feed?.pause()}>Pause</Button>
      <Button size="sm" variant="secondary" onClick={() => feed?.start()}>Resume</Button>
      <Button size="sm" variant="secondary" onClick={() => feed?.step()}>Step</Button>
      {SAMPLES.map(({ label, action }) => (
        <Button key={label} size="sm" variant="outline" onClick={() => renderer?.enqueue([action])}>
          {label}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Mount it in the page**

In `src/features/gameplay/components/GamePlayPage.tsx`, add the import:

```tsx
import { DebugPanel } from "./DebugPanel";
```

and change the scenario return block so the panel renders in dev only:

```tsx
  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">Game Play</h1>
      <Hud state={state} game={game} myTeamId={myTeamId} />
      <ScenarioCanvas onReady={handleReady} />
      {import.meta.env.DEV ? <DebugPanel feed={feed} renderer={renderer} /> : null}
      {finished ? <ResultOverlay state={state} onReplay={reset} /> : null}
    </section>
  );
```

- [ ] **Step 3: Verify every animation manually**

Run: `npm run dev`, start any replay, click Pause, then click each debug button once. Expected per button: fire buttons spawn an enemy on the right and destroy it with a flash (bigger ring for charged); hit 3 shakes the ship and flashes it red; hit absorbed flashes the shield ring instead; shieldUp pulses the ring; fizzle shoots a bullet that fades; stall spins the ship once; enemyMalfunction spins an enemy off the top; objectiveComplete expands a gold ring; warpOut stretches the ship off to the right; explode scatters particles and fades the ship. Click Step a few times and confirm single events arrive. Click Resume and confirm the replay continues. Stop the server.

Run: `npm test` and `npm run build`
Expected: all tests pass; build succeeds with a `dist/` folder.

- [ ] **Step 4: Write the project docs**

Create `README.md`:

```markdown
# OSB Ship Scenario

MVP for the "watch the game" step of Outer Sports Ballers. A recorded NBA game is replayed fast and drives a spaceship battle: the chosen player's team scoring destroys enemies, opponent scores damage the hull, the chosen player's blocks and steals charge the shield, and the mission threshold decides win or loss at Final.

## Run

```bash
npm install
npm run dev          # http://localhost:5173/game-play
npm test             # vitest
npm run build        # tsc -b && vite build
npm run record-game -- <espnEventId>   # add another recorded game to src/fixtures/games
```

## Layout

- `src/app/` router and layout
- `src/features/gameplay/engine/` pure scenario engine (`reduce`)
- `src/features/gameplay/feeds/` `Feed` interface and the replay adapter
- `src/features/gameplay/renderer/` PixiJS renderer and action queue
- `src/features/gameplay/components/` page, setup, HUD, result, debug panel
- `src/fixtures/games/` recorded games
- `scripts/` ESPN capture script

Design: `docs/superpowers/specs/2026-10-21-ship-scenario-mvp-design.md`
```

Create `CLAUDE.md`:

```markdown
# CLAUDE.md — osb-ship-scenario

Vite + React 19 + TypeScript strict SPA. React Router 7 (`react-router`, declarative), PixiJS 8, Tailwind 4 with shadcn/ui, Vitest + React Testing Library.

## Commands

```bash
npm run dev
npm test
npm run build        # tsc -b && vite build; type errors fail the build
npm run record-game -- <espnEventId>
```

## Architecture (keep these boundaries)

- `features/gameplay/engine/` is pure TypeScript. No React, no pixi.js imports. `reduce(state, event)` is deterministic; mapping constants live in `mapping.ts`.
- `features/gameplay/feeds/` produce `GameEvent`s. Any new data source (OSB socket diff, balldontlie play-by-play) is a new `createXxxFeed` here that implements `Feed`. No React, no pixi.js.
- `features/gameplay/renderer/` owns Pixi. `ScenarioRenderer` implements `RendererPort`; animations drain through `ActionQueue` one at a time.
- `features/gameplay/hooks/useScenario.ts` is the only bridge between feed, engine and renderer.
- Routes live in `src/app/router.tsx`. New OSB screens go under `src/features/<name>/` and get a sibling route.

## Conventions

- shadcn primitives via `npx shadcn@latest add <component>`; never edit `src/components/ui/*` by hand.
- `PascalCase.tsx` components, `camelCase.ts` everything else, `@/` alias for cross-feature imports.
- Tests: Vitest; engine and feeds are unit-tested, renderer is checked manually through `DebugPanel` (dev only).
- Fixtures are generated by `scripts/record-game.ts`; ESPN's format never leaks past that script.
```

- [ ] **Step 5: Register the project in the workspace CLAUDE.md**

In `C:\Users\Oscar Cordero\projects\zingi\CLAUDE.md`, add this row to the Projects table after the `outer-sports-baller-v3` row:

```markdown
| `osb-ship-scenario/` | Frontend | React 19 + Vite + React Router 7 + PixiJS | OSB "watch the game" ship-battle MVP (has its own CLAUDE.md) |
```

and add `osb-ship-scenario` to the "Vite projects" line in the Commands section:

```markdown
### Vite projects (`zingi-central`, `osb-admin`, `osb-ship-scenario`)
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(gameplay): dev debug panel and project docs"
```

Note: the workspace `zingi/CLAUDE.md` is outside this repo. Leave that edit uncommitted unless Oscar says otherwise.

---

## Self-review

**Spec coverage.** Event model → Task 2. Mapping rules and invariants → Tasks 2, 3, 4. Engine API → Tasks 2–4. Feed interface, fixture, capture script, replay adapter → Tasks 5, 6. Renderer, layers, durations, gap, HUD-only fallback → Tasks 8, 9, 11. App shell, routes, folder layout → Tasks 1, 11. Setup, HUD, result, debug panel → Tasks 11, 12. Testing section → every task's tests plus the manual renderer check in Task 12. Out of scope items are not built. Migration constraint is documented in the spec and not acted on.

**Placeholders.** None. The only intentionally open value is the ESPN game id in Task 6, with a concrete fallback command to pick another.

**Type consistency.** `Feed` (`start/stop/pause/step/onEvent`) is the same in Tasks 5, 10, 12. `RendererPort` (`enqueue/syncState`) is the same in Tasks 8, 9, 10, 11, 12. `StartConfig` is defined in Task 11 and used only there. `findGame`/`games` are defined in Task 6 and used in Tasks 7 and 11. `at()` helper is defined in Task 2 and used in Tasks 3, 4, 10. `buildTimeline` returns `TimelineItem[]` in Task 5 and is consumed with `.event` / `.delayMs` in Task 7.
