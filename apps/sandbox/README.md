# OSB Ship Scenario

MVP for the "watch the game" step of Outer Sports Ballers. A recorded NBA game is replayed fast and drives a spaceship battle: the chosen player's team scoring destroys enemies, opponent scores damage the hull, the chosen player's blocks and steals charge the shield, and the mission threshold decides win or loss at Final.

## Run

```bash
npm install
npm run dev          # http://localhost:5173/game-play
npm test             # vitest
npm run build        # tsc -b && vite build
npm run record-game -- <espnEventId>   # add another recorded game to src/fixtures/games (new fixtures are picked up automatically)
```

## Layout

- `src/app/` router and layout
- `src/features/gameplay/engine/` pure scenario engine (`reduce`)
- `src/features/gameplay/feeds/` `Feed` interface and the replay adapter
- `src/features/gameplay/renderer/` PixiJS renderer and action queue
- `src/features/gameplay/components/` page, setup, HUD, result
- `src/features/sandbox/` `/sandbox`: the scene without game data, with a button per ship action and hull/shield inputs for checking the renderer
- `src/features/rules/` `/reglas`: the scenario rules explained in Spanish
- `src/fixtures/games/` recorded games
- `scripts/` ESPN capture script

HUD: the game screen is full-bleed with a cinematic overlay in Orbitron: clock and Exit top left, score top right, hull (20 segments) and shield (3) bottom left, kills and combo counters (block and steal sit in the score panel stat line), a mission card that announces objective and Final moments, and a play-by-play ticker (large screens only). The result screen offers Replay and Back to setup. Code lives in `src/features/gameplay/components/hud/` (placed by `HudOverlay.tsx`).

Quality: effects (bloom, glow, trails, shake) are chosen automatically. Add `?quality=low` to the URL (e.g. `/game-play?quality=low`) to force the lighter mode on phones or slow machines, or `?quality=high` to force full effects.

Design: `docs/superpowers/specs/2026-10-21-ship-scenario-mvp-design.md`, `docs/superpowers/specs/2026-10-30-chase-camera-design.md`

## Art pipeline

Sprites are stored as drawn (rear-view ship, head-on enemies). Prompts live in `scripts/geminiImage.ts`; `npm run gen-art` calls the Gemini API with them, and `scripts/key-art.py` removes the black background, trims and downscales (`--bbox-from` makes the four ship files share one crop).

Note: Gemini's image models have no free-tier quota (every request returned 429 with limit 0), so `gen-art` only works with a billed `GEMINI_API_KEY`. The art that ships was generated in the Gemini web app from the same prompts and keyed with the script.

```bash
npm run gen-art -- ship --n 3                 # raw candidates in .superpowers/art/raw/
npm run gen-art -- --all --model gemini-3-pro-image
python scripts/key-art.py .superpowers/art/raw/ship-1.png public/sprites/ship.png --width 520
```

## Credits

Sprite art was generated for this project (ship, enemies, lasers, shield, meteors, explosion, flame, planet). See `public/sprites/CREDITS.md`.
