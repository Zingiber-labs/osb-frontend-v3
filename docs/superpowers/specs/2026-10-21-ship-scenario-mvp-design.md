# OSB Ship Scenario MVP — Design

Date: 2026-10-21
Status: approved in conversation, pending written review

## 1. Goal

Replace the "watch the game" step of Outer Sports Ballers with a scenario where real NBA game data drives a spaceship battle. The player's chosen NBA player's team is the ship. When that team scores, the ship destroys an enemy. When the opponent scores, the ship takes damage. The player's own stats trigger specials.

This is a brand-new React app, separate from `outer-sports-baller-v3`. It is built so the rest of OSB can migrate into it later.

## 2. Decisions already made

| Question | Decision |
|---|---|
| Data source for the MVP | Recorded real game replayed from a fixture. Live sources are out of scope but the adapter seam exists. |
| Player agency | Spectator. Every ship action is triggered by game events. |
| "My side" | A chosen player, like today. Ship = his team. His stats drive specials. |
| Rendering | 2D canvas with PixiJS 8. |
| MVP event set | Team scores / opponent scores, and the chosen player's stats as specials. Periods, runs, timeouts, fouls, bonus are out. |
| Win condition | Mission threshold (e.g. "your player scores 20"), decided at Final. |
| Architecture | Event-sourced: feed adapter → pure engine → Pixi renderer, React hosts. |
| Routing | React Router 7 from day one, feature-folder layout, for later migration. |

## 3. Event model

One type crosses the feed boundary. Adapters own translation from any source into it.

```ts
type Side = "mine" | "theirs";

type Clock = { period: number; secondsLeft: number; home: number; away: number };

type GameEvent =
  | { kind: "tipoff"; at: Clock }
  | { kind: "score"; side: Side; points: 1 | 2 | 3; byMyPlayer: boolean; at: Clock }
  | { kind: "block"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "steal"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "turnover"; side: Side; byMyPlayer: boolean; at: Clock }
  | { kind: "period"; period: number; at: Clock }   // 1–4, 5+ = OT
  | { kind: "final"; at: Clock };
```

Rules:
- `side` is resolved by the adapter from the chosen player's team. The engine never sees team IDs.
- `byMyPlayer` is true when the play belongs to the chosen player.
- Every event carries the clock and score at that moment. No second data stream.
- `period` and `final` are emitted even though zone changes are out of scope. The engine needs `final` to end the run.

## 4. Mapping rules

Lives in `engine/mapping.ts` as a table. Tunable without touching the reducer.

| Event | State change | Ship action |
|---|---|---|
| `score mine 1` | enemiesDestroyed +1 | `fire scout` |
| `score mine 2` | enemiesDestroyed +1 | `fire fighter` |
| `score mine 3` | enemiesDestroyed +1 | `fire cruiser` |
| `score mine` with `byMyPlayer` | combo +1, myPlayerStats.pts += points | same `fire`, `charged: true` |
| `score theirs 1 / 2 / 3` | shield > 0: shield −1. Else hull −2 / −4 / −6. combo = 0 | `hit`, `absorbed` when a shield charge was spent |
| `block mine` / `steal mine` | shield +1 (max 3). If `byMyPlayer`: myPlayerStats.blk or .stl += 1 | `shieldUp` |
| `block theirs` / `steal theirs` | none | `fizzle` |
| `turnover mine` | if `byMyPlayer`: combo = 0, myPlayerStats.tov += 1 | `stall` |
| `turnover theirs` | none | `enemyMalfunction` |
| `tipoff` | status = live | none |
| `period` | clock updated | none |
| `final` | status = won if mission.met else lost | `warpOut` or `explode` |
| any event when `mission.met` flips to true | mission.met = true | `objectiveComplete` (once) |

Invariants:
- Hull floors at 1 before Final. The real game decides the outcome, not the scenario.
- Shield charges absorb a `score theirs` entirely, one charge per event.
- `mission.met` is evaluated after each event from `myPlayerStats[mission.stat] >= mission.target`. It never flips back.
- Between events the scene idles: ship cruises, background meteorites drift, enemies hover at range. Idle is tied to the game clock only through a progress bar.

## 5. Scenario engine

Pure TypeScript. No React or Pixi imports.

```ts
type ScenarioState = {
  hull: number;                     // 1..100, starts 100
  shield: number;                   // 0..3, starts 0
  combo: number;
  enemiesDestroyed: number;
  myPlayerStats: { pts: number; blk: number; stl: number; tov: number };
  mission: { stat: "pts" | "blk" | "stl"; target: number; met: boolean };
  clock: Clock;
  status: "pending" | "live" | "won" | "lost";
};

type ShipAction =
  | { type: "fire"; size: "scout" | "fighter" | "cruiser"; charged: boolean }
  | { type: "hit"; points: 1 | 2 | 3; absorbed: boolean }
  | { type: "shieldUp" }
  | { type: "fizzle" }
  | { type: "stall" }
  | { type: "enemyMalfunction" }
  | { type: "objectiveComplete" }
  | { type: "warpOut" }
  | { type: "explode" };

type MissionConfig = { stat: "pts" | "blk" | "stl"; target: number };

function createInitialState(mission: MissionConfig): ScenarioState;
function reduce(state: ScenarioState, event: GameEvent): { state: ScenarioState; actions: ShipAction[] };
```

- Deterministic. Same events plus same mission always give the same states and actions.
- The engine does not know wall time. Adapters decide when events are delivered.
- Actions are a queue the renderer drains, not state. Events after `final` are ignored.
- Files: `src/features/gameplay/engine/types.ts`, `mapping.ts`, `reduce.ts`.

## 6. Feed interface and replay adapter

```ts
interface Feed {
  start(): void;
  stop(): void;
  pause(): void;
  step(): void;                       // deliver the next event, debug only
  onEvent(cb: (e: GameEvent) => void): () => void;   // returns unsubscribe
}
```

### Recorded game fixture

```ts
type TeamRoster = { id: string; name: string; abbreviation: string; players: { id: string; name: string }[] };

type RecordedPlay = {
  order: number;
  period: number;
  clockSeconds: number;              // seconds left in the period
  homeScore: number;
  awayScore: number;
  kind: "score" | "block" | "steal" | "turnover" | "period" | "final" | "other";
  points?: 1 | 2 | 3;
  teamId?: string;
  playerIds: string[];
};

type RecordedGame = { id: string; date: string; home: TeamRoster; away: TeamRoster; plays: RecordedPlay[] };
```

Fixtures live in `src/fixtures/games/<id>.json`. One game ships with the repo.

### Capture script

`scripts/record-game.ts <espnEventId>` fetches ESPN's public game summary (play-by-play and box score, no API key), maps ESPN play types to `kind`, and writes the fixture. Run manually. ESPN's format is confined to this script; nothing at runtime reads it.

Mapping at capture time: a scoring play with `scoreValue` 1/2/3 → `score`; play text or type containing "block" → `block`, "steal" → `steal`, "turnover" → `turnover`; period boundaries → `period`; end of game → `final`; everything else → `other`.

### Replay adapter

`createReplayFeed(game: RecordedGame, opts: { myPlayerId: string; speed: number }): Feed`

- Walks plays in order. Waits the real clock gap between consecutive plays divided by `speed`. Gaps across a period boundary are treated as zero.
- Resolves `side` from the chosen player's roster membership. `byMyPlayer` = `playerIds` includes `myPlayerId`.
- Skips `other`. Emits `tipoff` before the first play.
- `speed` 16 plays a 48-minute game in about 3 minutes. Default 16.

### Future adapters (out of scope, seam only)

`src/features/gameplay/feeds/` will also hold `createBoxScoreDiffFeed` (OSB backend socket; contract documented in the team's Notion "Docs Gameplay" page) and `createPlayByPlayFeed` (balldontlie GOAT `/v1/plays`). Neither is built in the MVP.

## 7. Renderer

`src/features/gameplay/renderer/ScenarioRenderer.ts`, a class owning the Pixi `Application`.

- `mount(canvas: HTMLCanvasElement): Promise<void>`, `destroy(): void`
- `enqueue(actions: ShipAction[]): void`
- `syncState(state: ScenarioState): void` for sprites that mirror state (shield glow, damage smoke)
- Layers: parallax starfield, background meteorites, enemy lane, ship, effects.
- Each `ShipAction` maps to one animation with a fixed duration: fire 600 ms, hit 500 ms, shieldUp 400 ms, fizzle 400 ms, stall 1000 ms, enemyMalfunction 800 ms, objectiveComplete 1200 ms, warpOut 2000 ms, explode 2000 ms. Animations play one at a time from the queue with a 150 ms gap, so bursts play back to back.
- Art is placeholder shapes and simple sprites. Enemy size is scale, not separate art.
- If WebGL and canvas fallback both fail, `mount` rejects and the app shows HUD-only mode.

## 8. App shell

Stack: Vite, React 19, TypeScript strict, PixiJS 8, React Router 7 (declarative), Tailwind 4 with shadcn/ui for primitives (added via `npx shadcn@latest add`, never hand-written), Vitest, React Testing Library. This matches the conventions in the zingi workspace CLAUDE.md for Vite projects (`zingi-central`, `osb-admin`); the new project should be added to that file's project table once it exists.

Routes:
- `/` → redirect to `/game-play`
- `/game-play` with optional `?gameId&playerId` search params, matching today's URL shape
- `*` → not found

Structure:
```
src/
  app/            router, Layout (nav placeholder + Outlet), providers
  features/
    gameplay/
      engine/     types, mapping, reduce
      feeds/      Feed interface, replay adapter
      renderer/   ScenarioRenderer, animations
      components/ GamePlayPage, SetupPanel, ScenarioCanvas, Hud, ResultOverlay, DebugPanel
      hooks/      useScenario
  fixtures/games/
scripts/record-game.ts
```

- `useScenario(feed, mission)` holds `ScenarioState`, subscribes to the feed, calls `reduce`, forwards actions to the renderer. It is the only bridge between the three layers.
- `SetupPanel`: pick fixture game, pick my player from both rosters, pick mission stat and target, pick speed. Start.
- `ScenarioCanvas`: the canvas plus `Hud` (hull bar, shield pips, combo, score, clock, mission progress). HUD is React, positioned over the canvas.
- `ResultOverlay`: on won or lost, final stats and a replay button.
- `DebugPanel` (dev only): one button per `ShipAction` type, pause and step controls for the feed.

Error handling: unknown or malformed events are dropped with a console warning. Renderer init failure shows HUD-only mode. Missing or unparsable fixture shows an error in the setup panel.

## 9. Testing

- Engine: Vitest unit tests, one per mapping row, plus three replay-driven scenario tests over the shipped fixture (mission met mid-game, never met, shield absorbs damage). Assert final state and the full action list.
- Replay adapter: side and byMyPlayer resolution for a home and an away player, `other` skipped, `speed` scaling, with fake timers.
- Capture script: one test with a saved raw ESPN sample asserting the converted `RecordedGame` shape.
- Renderer: no automated tests. Exercised manually through `DebugPanel`.
- App shell: one RTL test that the setup panel starts a replay and the HUD reflects the first state change. Router smoke test for the three routes.

## 10. Out of scope

Live data adapters, period and run events, timeouts, fouls, bonus, player control, real art, sound, mission accept flow, auth, and any other OSB screen.

## 11. Known constraint for the later migration

The current OSB app relies on Next.js route handlers for its cookie-based BFF proxy. This Vite SPA has no server, so migrating the full app here requires that proxy to move to the backend or a small Node layer. Not an MVP concern.
