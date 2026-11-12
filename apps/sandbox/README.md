# OSB Ship Scenario Sandbox

This app is the tuning sandbox and rules page for the `@osb/gameplay` package (`packages/gameplay`). The product gameplay lives in `apps/web`.

## Run

```bash
npm install          # from the repo root
npm run dev          # http://localhost:5173/sandbox (or npm run dev:sandbox from the root)
npm test             # vitest
npm run build        # tsc -b && vite build
npm run record-game -- <espnEventId>   # writes packages/gameplay/src/fixtures/games (new fixtures are picked up automatically)
```

## Layout

- `src/app/` router and layout
- `src/features/sandbox/` `/sandbox`: the scene without game data, with a button per ship action and hull/shield inputs for checking the renderer
- `src/features/rules/` `/reglas`: the scenario rules explained in Spanish
- `scripts/` ESPN capture and art generation scripts

The engine, feeds, PixiJS renderer and HUD live in `packages/gameplay/src/{engine,feeds,renderer,components/hud}` and are imported from `@osb/gameplay`. Recorded games are in `packages/gameplay/src/fixtures/`.

Quality: effects (bloom, glow, trails, shake) are chosen automatically. Add `?quality=low` to the URL (e.g. `/sandbox?quality=low`) to force the lighter mode on phones or slow machines, or `?quality=high` to force full effects.

## Deploy

The Vercel project `osb-ship-scenario` must have its Root Directory set to `apps/sandbox` (dashboard setting). Deploy from the repo root, not from this folder:

```bash
npx vercel deploy --prod --yes
```

The CLI uploads the whole repo and Vercel builds the workspace. A CLI deploy from inside `apps/sandbox` cannot resolve the `@osb/gameplay` workspace sibling.

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
