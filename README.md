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
- `src/features/gameplay/components/` page, setup, HUD, result, debug panel
- `src/fixtures/games/` recorded games
- `scripts/` ESPN capture script

Quality: effects (bloom, glow, trails, shake) are chosen automatically. Add `?quality=low` to the URL (e.g. `/game-play?quality=low`) to force the lighter mode on phones or slow machines, or `?quality=high` to force full effects.

Design: `docs/superpowers/specs/2026-10-21-ship-scenario-mvp-design.md`

## Credits

Sprite art was generated for this project (ship, enemies, lasers, shield, meteors, explosion, flame). See `public/sprites/CREDITS.md`.
