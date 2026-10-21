# Sprite Art and Enemy Squadron — Design

Date: 2026-10-21
Status: approved in conversation
Builds on: `2026-10-21-ship-scenario-mvp-design.md`

## 1. Goal

Two visual upgrades to the ship scenario, with no change to the engine, feeds, hook, HUD, mapping rules, action durations, or the action queue:

1. Replace the placeholder vector shapes with real spaceship sprites.
2. Keep a squadron of enemies on screen at all times so that shots hit ships that were already there, instead of enemies popping in at the moment they are shot.

## 2. Art

Source: Kenney "Space Shooter Redux" (CC0, public domain; credit optional). About 25 PNGs are copied into `public/sprites/` with a `public/sprites/CREDITS.md`.

| Role | File(s) |
|---|---|
| Player ship | `playerShip1_blue.png` |
| Hull damage overlays | `playerShip1_damage1.png`, `_damage2.png`, `_damage3.png` (exclusive: hull < 75 shows 1, < 50 shows 2, < 25 shows 3) |
| Engine flame | `fire08.png`, behind the ship |
| Enemies | `enemyRed1.png` (scout), `enemyRed3.png` (fighter), `enemyRed5.png` (cruiser) |
| My shots | `laserBlue01.png`, `laserBlue08.png` when charged |
| Enemy shots | `laserRed01.png` |
| Shield | `shield1.png` around the ship, alpha = charges / 3 as today |
| Meteorites | `meteorGrey_big1..4.png`, `meteorGrey_med1..2.png` |

Kenney sprites face up (player) or down (enemies); both are rotated a quarter turn clockwise so the player faces right and enemies face left. Lasers are rotated the same way. Explosions stay procedural (white flash, orange ring, particles) because the pack has no explosion frames; they get bigger and scale with the points of the score.

Textures are loaded once with Pixi `Assets.load` inside `ScenarioRenderer.mount`, before the world is built. A load failure rejects `mount`, so the existing HUD-only fallback covers it. The starfield stays procedural.

## 3. Squadron

A `SquadronModel` (pure TypeScript, no Pixi) keeps up to three members, one per slot. Slot anchors sit at 76 to 84 percent of the width and 30, 50, 70 percent of the height. Each member has a size (scout, fighter, cruiser, chosen in rotation), a state (`entering`, `holding`), and a seed for its weave.

- **Entering:** starts off-screen right and moves to its anchor over 1200 ms (400 ms for a fast spawn).
- **Holding:** weaves around its anchor with a small sine sway in x and y.
- **Take:** `takeNearest(x, y)` removes the member closest to the ship and schedules a respawn for its slot after 600 ms. `takeAny()` removes an arbitrary member the same way. `pick()` returns a member without removing it.
- **Respawn:** `update(dtMs)` advances timers; when a slot's respawn timer expires a new member enters.
- **Empty squadron:** if a `fire` arrives and no member is holding or entering, `spawn(slot, { fast: true })` creates one that enters in 400 ms so bursts still read as rapid fire.

A `SquadronView` in the renderer reconciles the model to sprites each ticker frame: creates a sprite for a new member, moves sprites to model positions, and destroys sprites for members that left. `detach(id)` hands the sprite to an animation so the explosion can own and destroy it.

## 4. Animations

| Action | New behavior |
|---|---|
| `fire` | Target = `takeNearest` (or a fast spawn). The laser flies toward the target's live position, then the target explodes; explosion scale follows the action's enemy size. |
| `hit` | The shot originates from a `pick()`ed squadron member (or the right edge if none). Ship flash and shake unchanged. |
| `enemyMalfunction` | `takeAny()` member spins off the top of the screen; its slot respawns. |
| `shieldUp`, `fizzle`, `stall`, `objectiveComplete`, `warpOut`, `explode` | Unchanged in behavior; use sprites where a shape was used. |

Durations stay exactly as in the MVP spec.

## 5. Files

- `src/features/gameplay/renderer/assets.ts`: `SPRITE_FILES` manifest, `SpriteKey`, `SpriteTextures`, `loadSprites()`.
- `src/features/gameplay/renderer/squadron.ts`: `SquadronModel` (pure).
- `src/features/gameplay/renderer/squadronView.ts`: `SquadronView` (Pixi).
- `src/features/gameplay/renderer/world.ts`: builds sprites instead of shapes; holds `squadron` and `squadronView`; `spawnEnemy` removed.
- `src/features/gameplay/renderer/animations.ts`: rewired as above.
- `src/features/gameplay/renderer/ScenarioRenderer.ts`: loads sprites, ticks the squadron in the idle loop, drives damage overlays in `syncState`.
- `public/sprites/*.png`, `public/sprites/CREDITS.md`.

## 6. Testing

- `assets.test.ts`: every manifest file exists on disk under `public/sprites/`.
- `squadron.test.ts`: fills three slots on creation; entering members reach their anchor after the enter time; `takeNearest` removes the closest and schedules a respawn that fires after 600 ms; `takeAny` on an empty squadron returns null; fast spawn enters in 400 ms; sizes rotate.
- Renderer visuals remain a manual check through the debug panel, plus a browser screenshot pass.

## 7. Out of scope

Explosion sprite frames, sound, enemy AI beyond weaving, player control, resize handling, and any change to engine, feeds, hook, HUD, or mapping rules.
