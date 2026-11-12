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
- `features/gameplay/renderer/` owns Pixi. `ScenarioRenderer` implements `RendererPort`; animations drain through `ActionQueue` one at a time. The renderer owns its canvas (`mount(host)`), and `ScenarioCanvas` lazy-imports it so Pixi never loads on the setup route or in jsdom. The scene is a behind-the-ship chase view. `renderer/projection.ts` (pure) maps world points `{x, y, z}` to screen through a vanishing point (`DEFAULT_VIEW`: design frame 1280 x 720, vp (640, 302), f 400; `fitStage` cover-fits the host, taking the vertical crop 75% from the top). Everything with depth (stars from `starfield.ts`/`starfieldView.ts`, rocks, squadron members, bolts, bursts) lives in `world.depth`, a sortable container whose zIndex is `zIndexFor(z)`. The player ship is a fixed screen sprite at `SHIP_SCREEN`; `world.ship` is the rig (position, roll), `world.hull` banks and bobs and holds engines, body, damage and shield (`ENGINE_OFFSETS` measured from the art). Enemies are scaled by `ENEMY_SCALE` (scout 0.5, fighter 0.6, cruiser 0.7); `animations.ts` plays every action along the depth axis. Sprite art under `public/sprites/` is stored exactly as drawn (rear-view ship, head-on enemies; no rotation; see `CREDITS.md`), generated with Gemini from the prompts in `scripts/geminiImage.ts` and keyed with `scripts/key-art.py`; manifest in `renderer/spriteManifest.ts`, loaded by `assets.ts`. The explosion is a frame strip sliced in `world.ts` (`stripFrames`) and stepped by `burst()`. Enemies live in a `SquadronModel` (pure, tested) rendered by `SquadronView`; animations take members from it rather than spawning. Presentation pass: `renderer/quality.ts` picks `high` or `low` (auto-detected, `?quality=high|low` overrides) and gates effects. `renderer/fx.ts` (math in pure `fxMath.ts`) holds bloom, glow, trails, screen shake and the white flash (`pixi-filters`). `world.ts` layer order, back to front: backdrop, planet, depth, shipLayer, effects (reticle, rings, callouts), overlay (vignette, low-hull). The backdrop (`backdrop.ts`) is OSB's galaxy image, cover-fit and slowly panned. Every action can carry a `caption` (set by the feed as `label`); `renderer/callout.ts` floats it at the action for 1.5 s without blocking the queue.
- `features/gameplay/components/hud/` is the heads-up display: small React + Tailwind panels (`ClockPanel`, `ScorePanel`, `StatusPanel` with `SegmentBar`, `CountersPanel`, `PlayTicker`, `MissionCard`) placed by `HudOverlay.tsx` over the canvas, fed by `ScenarioState`. `usePlayLog` subscribes to the feed for the ticker; `useMissionCard` turns state transitions into timed cards through the pure `cardFor` (in `missionCardRules.ts`, named so it cannot collide with `MissionCard.tsx` on case-insensitive file systems). Display font is Orbitron (`font-display`, `@fontsource-variable/orbitron`), colors are the `hud-mine`, `hud-gold`, `hud-theirs`, `hud-chrome` tokens in `index.css` and match the renderer's callout colors. `GamePlayPage` renders the running game in a `fixed inset-0 z-30` section (the header is covered, not removed; `Layout.tsx` is untouched) and keys `ScenarioCanvas` by a run counter so Replay remounts the renderer. Exit and the result buttons are the only interactive HUD elements. The ticker is hidden below `lg`; the player stat line and mission card sublines are hidden below `md`.
- `features/gameplay/hooks/useScenario.ts` is the only bridge between feed, engine and renderer.
- Routes live in `src/app/router.tsx` (`/game-play`, `/sandbox`, `/reglas`). New OSB screens go under `src/features/<name>/` and get a sibling route.

## Conventions

- shadcn primitives via `npx shadcn@latest add <component>`; never edit `src/components/ui/*` by hand.
- `PascalCase.tsx` components, `camelCase.ts` everything else, `@/` alias for cross-feature imports.
- Tests: Vitest; engine and feeds are unit-tested, HUD panels and hooks are unit-tested with Testing Library, renderer is checked manually on the `/sandbox` route (`features/sandbox/`: the scene with no feed, one button per `ShipAction` plus hull/shield inputs). The game screen carries no test controls.
- `/reglas` (`features/rules/RulesPage.tsx`) explains the scenario logic in Spanish for the team; its numbers come from `engine/mapping.ts`, so keep it in step when the mapping changes. Every other screen is English.
- Fixtures are generated by `scripts/record-game.ts`; ESPN's format never leaks past that script.
