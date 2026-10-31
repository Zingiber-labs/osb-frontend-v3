# Chase camera and generated rear-view art

Date: 2026-10-30. Status: approved in conversation, awaiting Oscar's review of this file.

## Goal

Make the game scene read like a behind-the-ship 3D view (reference: helion-rift.vercel.app) while
keeping PixiJS and 2D sprites. The player ship sits at the bottom center seen from behind, enemies
hold far ahead near a vanishing point, stars and rocks stream toward the camera, and every action
travels along the depth axis. Art for the new viewpoint is generated with Gemini's image model.

Out of scope: HUD restyle (next phase), a capital ship, live data adapters, mobile layout beyond
stage scaling. The engine, feeds, hooks, HUD, rules page and sandbox page do not change.

## Part A: generated art

Generated with Gemini's image models through the API: default `gemini-3.1-flash-image` (Nano
Banana 2), with a `--model` flag to try `gemini-3-pro-image` (Nano Banana Pro) for the hero ship if
quota allows. The key comes from `GEMINI_API_KEY`; on Windows the script falls back to the user
registry value, because a `setx` is not inherited by shells already running. Every image is requested on a solid black background,
then keyed, trimmed and downscaled locally, like the Canva pass of 2026-10-21.

| Asset | File | View | Notes |
| --- | --- | --- | --- |
| Player ship | `ship.png` | straight rear view from slightly above and behind, symmetric, nose pointing directly at the horizon, two engine nozzles glowing toward the camera (a first three-quarter render read as yawed, so it was replaced) | cyan/white hull matching the current ship; about 260 px wide on screen |
| Damage 1-3 | `ship_damage1..3.png` | same render | image-to-image edits of the clean ship: scorch marks; cracks and sparks; smoking wreck. Fallback: procedural scorches as before |
| Enemies | `enemy_scout.png`, `enemy_fighter.png`, `enemy_cruiser.png` | head-on, slightly from above, approaching | red and dark-grey palette of the current enemies; stored small |
| Planet | `planet.png` | gas giant, partly in shadow | sits near the vanishing point |

Kept as is: meteors, laser bolts, shield bubble, explosion strip, flame, galaxy backdrop.

Orientation convention changes: files are stored exactly as drawn on screen. The quarter-turn
rotation in `spriteUtils.ts` goes away. `CREDITS.md` names Gemini and the date.

### Pipeline

- `scripts/gen-art.ts` (Node, `tsconfig.scripts.json`): prompts per asset, calls the API, writes raw
  PNGs to a git-ignored `.superpowers/art/raw/` folder. One asset or all; a re-roll is one command.
- `scripts/key-art.py` (Python, PIL + scipy as before): keys the black background (flood fill for
  solids, brightness alpha for glows), trims, downscales to the target width, writes to
  `public/sprites/`. Target widths live in the script.
- Oscar reviews the candidates before they replace the current files.

## Part B: scene

### Projector (`renderer/projection.ts`, pure)

- World point `{x, y, z}`; camera at `z = 0` looking down +z. `project(p, view)` returns
  `{sx, sy, scale}` with `sx = vp.x + x * f / z`, `sy = vp.y + y * f / z`, `scale = f / z`.
- `view = {vp: {x, y}, f}`; `vp` at 50% width and 42% height; `f` is one tuned constant.
- `zIndexFor(z)` maps depth to an integer so nearer objects sort on top.
- Design-space coordinates: the world is built at a fixed design size and the stage is scaled to
  cover the host (largest of the two ratios; horizontal crops centered, vertical crops taken 75% from the top so the ship stays in frame). Resize recomputes the stage scale and offset only. This closes
  the "layout not resize-aware" ledger item.

### Layers (back to front)

backdrop (galaxy, slow pan), planet, depth layer (sortable: stars, rocks, enemies, lasers,
explosions), ship layer (ship, engine glows, shield), effects in screen space (reticle,
objective ring, callouts sized by depth), overlay (vignette).

### Player ship

Fixed at 50% width, 74% height. Idle: slow bob (plus or minus 4 px) and a bank of up to 0.12 rad
toward the currently targeted slot (nearest member), eased. Two engine glows (the existing flame
sprite, scaled down, additive) flicker as today. Shield bubble centered on the ship.

### Starfield (`renderer/starfield.ts`, pure model plus view)

- 150 far points and 40 near points with random `x, y` in a box around the center line and `z`
  between `zNear` and `zFar`. Each frame `z -= speed * dt`.
- A point respawns at `zFar` with new `x, y` when `z < zNear` or its projection leaves the screen.
- Size and alpha come from `scale`; near points draw a streak of length proportional to speed
  times scale. Warp multiplies speed and streak length.

### Rocks

About 10 meteor sprites on the same stream, spinning, scaled by the projector, spawned with
`|x|` or `|y|` above a minimum so they never cover the center line where the ship and targets are.

### Planet

One sprite anchored a little off the vanishing point (upper right), about 45% of design height,
drifting a few pixels per minute with faint parallax relative to the stars.

### Squadron

`SquadronModel` anchors become world points: slot 0 left-ahead, slot 1 center-far, slot 2
right-ahead, at three different depths, with the existing hold wobble applied in world units.
Members enter from `zFar` (small) and ease into their slot depth. `takeNearest` picks by screen
distance to the reticle center. `SquadronView` projects members each frame and sets zIndex.

### Actions (same `ShipAction` types and durations table)

- fire: reticle snaps from center to the target and tightens; two bolts from the wing cannons
  converge on the target while shrinking (projected along z); white flash; explosion at the
  target's projected scale; callout above the target; shake (cruiser harder); charged = gold bolts,
  larger burst.
- hit: a bolt from the source member grows toward the ship with a sideways drift; absorbed means a
  shield flare back to state alpha; otherwise lurch, red tint, shake by points; callout near the ship.
- shieldUp: bubble pulse, unchanged in spirit.
- fizzle: one bolt wobbles and fades before reaching the vanishing point.
- stall: full 2D rotation of the rear-view ship (reads as a barrel roll) with a small sway.
- enemyMalfunction: member tumbles toward the camera, grows past the ship, exits at a frame edge;
  slot refills from far.
- objectiveComplete: gold ring from the ship plus a gold reticle flash.
- warpOut: starfield warp (speed and streaks up), ship accelerates into the vanishing point while
  shrinking and fading.
- explode: big burst at the ship, shake, the squadron keeps cruising.
- callouts: positioned through the projector; font size scaled by depth, clamped.

### Reticle (`renderer/reticle.ts`)

A thin crosshair drawn with Graphics at the center. `aimAt(screenPoint)` tweens it to a target and
tightens; `release()` returns it to center. Gold flash on objective.

## Code changes

- New: `projection.ts`, `starfield.ts`, `reticle.ts`, `scripts/gen-art.ts`, `scripts/key-art.py`.
- Rewritten: `world.ts` (layers, planet, ship placement, stage scaling), `animations.ts` (per the
  action list), `squadron.ts` anchors and entry, `squadronView.ts` projection.
- Edited: `spriteUtils.ts` (no rotation), `spriteManifest.ts` (planet key), `assets.ts`,
  `ScenarioRenderer.ts` (idle loop drives starfield, ship bank, reticle; resize handler),
  `CREDITS.md`, `README.md` and `CLAUDE.md` notes.
- Unchanged: engine, feeds, hooks, HUD, pages, ActionQueue, RendererPort, quality switch.

## Testing

- Unit (Vitest): projection math and zIndex ordering; starfield respawn rules and warp factor;
  squadron depth anchors, entry easing and nearest-by-screen selection; reticle target math;
  sprite manifest includes the planet. Existing 97 tests keep passing. Target about 115.
- Visual: agent-browser recording plus ffmpeg frames for fire, hit, malfunction and warpOut in the
  sandbox; a full replay run on the game page; a low-quality run.
- Performance: 60 fps at high quality on Oscar's machine with the default replay speed.

## Risks

- Gemini may not return a clean solid black background or may change the ship silhouette between
  damage edits. Fallback: procedural scorches on the clean render.
- Many sorted sprites under bloom may cost frames on low-end machines; the quality switch already
  disables bloom and trails at low quality.
