# Presentation Pass — Design

Date: 2026-10-21
Status: approved in conversation
Builds on: MVP, sprites-and-squadron, action-callouts specs.

## 1. Goal

Make the scene feel alive without changing any gameplay rule, action, duration, or sprite: depth in the background, light on the lasers and flame, impact on hits, and a quality switch so phones stay smooth. Phase B (new AI art) follows and reuses all of this.

## 2. Background with depth

Layer order, back to front: `backdrop`, `farStars`, `farRocks`, `nearStars`, `nearRocks`, `enemyLane`, `shipLayer`, `effects`, `overlay`.

- **Backdrop.** OSB's own galaxy image (`public/sprites/bg/galaxy.jpg`, downscaled to 1600 px, 160 KB), scaled to cover the canvas with 8 percent slack, alpha 0.35 and a cool tint `0xa8b4cc` so the orange nebula reads as distance. It pans slowly left and right (ping-pong, 0.04 px per frame) so it never shows an edge.
- **Stars.** Two procedural layers: 120 far stars (radius 0.4 to 1.0, alpha 0.25 to 0.5, speed 0.08 to 0.25 px per frame) and 40 near stars (radius 0.8 to 1.8, alpha 0.6 to 1.0, speed 0.5 to 1.4). Both wrap at the left edge as today.
- **Asteroids.** Ten Kenney meteors in two tiers: 4 far (scale 0.2 to 0.35, alpha 0.45, speed 0.2 to 0.4, slow spin) and 6 near (scale 0.45 to 0.85, alpha 0.9, speed 0.6 to 1.6). Near rocks stay behind the enemy lane so they never cover a ship.

## 3. Light

- **Additive blending** on lasers, the engine flame, explosion flash, embers and particles (`blendMode = "add"`).
- **Laser trails.** Each shot drags three ghost copies of its sprite at decreasing alpha (0.5, 0.3, 0.15), sampled from the shot's recent positions. Ghosts are destroyed with the shot.
- **Engine flame flicker.** Every frame the flame's scale jitters (x 0.9 to 1.15, y 0.85 to 1.15 of its base) and alpha 0.8 to 1.0.
- **Bloom.** An `AdvancedBloomFilter` from `pixi-filters` (threshold 0.35, bloomScale 1.2, blur 6, quality 4) on the `effects` layer, high quality only.
- **Shield glow.** A `GlowFilter` (distance 12, outer strength 2, color `0x22d3ee`) on the shield sprite, high quality only; additive blend at all qualities.
- **Explosions.** Flash and ring additive, 12 embers instead of 8, flash radius 18 × scale.

## 4. Impact

- **Screen shake.** `shake(world, amplitude, ms)` jitters the stage position with decaying random offsets and restores it; never awaited. Unabsorbed hit: amplitude = points × 3 for 250 ms. Enemy explosion: 2 (cruiser 3) for 150 ms. Ship explosion: 8 for 600 ms.
- **Enemy white flash.** An additive ghost of the enemy sprite at full white pops for 120 ms at the moment the shot lands, before the burst.
- **Hit flash on the ship** also tints the active damage overlay, not only the body.
- **Low-hull vignette.** A full-screen red radial vignette in the `overlay` layer. `syncState` sets its target alpha: 0.35 when hull < 25, 0.18 when hull < 50, else 0. The idle loop pulses it ±20 percent at 1 Hz.

## 5. Quality switch

`pickQuality({ coarsePointer, width, cores, override })` returns `"low"` for coarse pointers, widths under 768, or fewer than 4 cores, otherwise `"high"`; a `?quality=high|low` URL param overrides. Detected once in `mount`. Low quality disables bloom and glow filters and the laser trails; everything else stays. Target: 60 fps on a mid-range phone at low, on a laptop at high.

## 6. Files

- `renderer/quality.ts` (pure, tested), `renderer/backdrop.ts` (galaxy cover-fit and pan), `renderer/fx.ts` (bloom/glow factories, `shake`, `trail`, `whiteFlash`), `renderer/world.ts` (layers, tiers, vignette, `quality`), `renderer/animations.ts` (additive, trails, flashes, shakes), `renderer/ScenarioRenderer.ts` (quality detection, flicker, backdrop pan, vignette pulse, vignette target in `syncState`), `renderer/spriteManifest.ts` (`bgGalaxy`), `public/sprites/bg/galaxy.jpg`.

## 7. Testing

- `quality.test.ts`: the four rules and the override.
- `fx.test.ts`: `shake` offset math is pure (`shakeOffset(t, amplitude)` decays to 0 at t = 1 and never exceeds amplitude); `trailPositions` ring buffer returns the last N samples in order.
- Everything visual is checked through the debug panel and screenshots, at both qualities (`?quality=low`).

## 8. Out of scope

New sprites (Phase B), sound, resize handling, explosion sprite frames, mapping or duration changes.
