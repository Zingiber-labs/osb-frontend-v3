# Presentation Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depth, light and impact in the PixiJS scene plus a quality switch, with no gameplay, action, duration or sprite change.

**Architecture:** Renderer-only. Pure helpers (`quality.ts`, the math in `fx.ts`) are unit-tested; Pixi work lives in `backdrop.ts`, `fx.ts`, `world.ts`, `animations.ts`, `ScenarioRenderer.ts`. Filters come from `pixi-filters` and are applied only at high quality.

**Tech Stack:** PixiJS 8.22, `pixi-filters` 6.x (peer `pixi.js >= 8`), Vitest.

Spec: `docs/superpowers/specs/2026-10-21-presentation-pass-design.md`

## Global Constraints

- Project root `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario`, branch `feat/ship-scenario-mvp`; per-task commits authorized; never mention Claude or AI in commit messages.
- Only `renderer/` imports `pixi.js` or `pixi-filters`. Engine, feeds, hook, HUD, components (except nothing), mapping, `ActionQueue`, durations, callouts and squadron behavior unchanged.
- Numbers verbatim from the spec: backdrop alpha 0.35, tint `0xa8b4cc`, 8 percent cover slack, pan 0.04 px/frame ping-pong; far stars 120 (r 0.4–1.0, alpha 0.25–0.5, speed 0.08–0.25), near stars 40 (r 0.8–1.8, alpha 0.6–1.0, speed 0.5–1.4); far rocks 4 (scale 0.2–0.35, alpha 0.45, speed 0.2–0.4), near rocks 6 (scale 0.45–0.85, alpha 0.9, speed 0.6–1.6); trail ghosts alpha 0.5/0.3/0.15; flame jitter x 0.9–1.15, y 0.85–1.15, alpha 0.8–1.0; bloom threshold 0.35, bloomScale 1.2, blur 6, quality 4; glow distance 12, outerStrength 2, color `0x22d3ee`; shake: hit points×3 for 250 ms, enemy explosion 2 (cruiser 3) for 150 ms, ship explosion 8 for 600 ms; white flash 120 ms; vignette alpha 0.35 (<25), 0.18 (<50), else 0, pulse ±20 percent at 1 Hz; quality low when coarse pointer, width < 768, or cores < 4; `?quality=` overrides.
- Layer order back to front: backdrop, farStars, farRocks, nearStars, nearRocks, enemyLane, shipLayer, effects, overlay.
- `erasableSyntaxOnly`: no constructor parameter properties.
- Pixi 8 API: `sprite.blendMode = "add"`; filters via `container.filters = [filter]`; `pixi-filters` exports `AdvancedBloomFilter` and `GlowFilter` with options objects. Check `node_modules/pixi-filters/lib/**/*.d.ts` if a constructor option does not type-check and adapt minimally.
- Dev server probably on 5173 (hot reload); reuse it. `agent-browser`: `snapshot -i` first, no `wait --load networkidle`, absolute Windows screenshot paths, close at the end.

---

## File map

| Path | Responsibility |
|---|---|
| `renderer/quality.ts` | `Quality`, `pickQuality`, `detectQuality` |
| `renderer/quality.test.ts` | rules and override |
| `renderer/backdrop.ts` | `buildBackdrop(app, texture, w, h)` → sprite + `panBackdrop(dt)` |
| `renderer/fx.ts` | `shakeOffset`, `shake`, `TrailBuffer`, `trail`, `whiteFlash`, `makeBloom`, `makeGlow` |
| `renderer/fx.test.ts` | `shakeOffset` and `TrailBuffer` |
| `renderer/world.ts` | layers, star/rock tiers, flame ref, vignette, quality |
| `renderer/animations.ts` | additive blends, trails, flashes, shakes |
| `renderer/ScenarioRenderer.ts` | quality detection, backdrop pan, flame flicker, vignette pulse, vignette target |
| `renderer/spriteManifest.ts` | `bgGalaxy: "bg/galaxy.jpg"` |

---

### Task 1: Quality picker, backdrop and depth layers

**Files:**
- Create: `src/features/gameplay/renderer/quality.ts`, `quality.test.ts`, `backdrop.ts`
- Modify: `spriteManifest.ts`, `world.ts`, `ScenarioRenderer.ts`
- Already present: `public/sprites/bg/galaxy.jpg`

**Interfaces:**
- Produces: `type Quality = "high" | "low"`; `pickQuality(env: { coarsePointer: boolean; width: number; cores: number; override?: string | null }): Quality`; `detectQuality(): Quality`; `buildBackdrop(app, texture, width, height): Backdrop` with `Backdrop = { sprite: Sprite; pan(dt: number): void }`; `World` gains `quality: Quality`, `backdrop: Backdrop`, `flame: Sprite`, `vignette: Graphics`, `vignetteTarget: number`, and layer containers `farStars`, `farRocks`, `nearStars`, `nearRocks`, `overlay` (keep `starfield`/`meteorites` names out; rename usages); `stars` and `rocks` arrays carry both tiers.

- [ ] **Step 1: Failing quality tests**

Create `src/features/gameplay/renderer/quality.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pickQuality } from "./quality";

const desktop = { coarsePointer: false, width: 1440, cores: 8 };

describe("pickQuality", () => {
  it("is high on a desktop", () => {
    expect(pickQuality(desktop)).toBe("high");
  });
  it("is low for coarse pointers, narrow screens, or few cores", () => {
    expect(pickQuality({ ...desktop, coarsePointer: true })).toBe("low");
    expect(pickQuality({ ...desktop, width: 600 })).toBe("low");
    expect(pickQuality({ ...desktop, cores: 2 })).toBe("low");
  });
  it("honors a valid override and ignores an invalid one", () => {
    expect(pickQuality({ ...desktop, override: "low" })).toBe("low");
    expect(pickQuality({ ...desktop, coarsePointer: true, override: "high" })).toBe("high");
    expect(pickQuality({ ...desktop, override: "ultra" })).toBe("high");
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npm test -- src/features/gameplay/renderer/quality.test.ts`
Expected: FAIL, import unresolved.

- [ ] **Step 3: Quality module**

Create `src/features/gameplay/renderer/quality.ts`:

```ts
export type Quality = "high" | "low";

export type QualityEnv = { coarsePointer: boolean; width: number; cores: number; override?: string | null };

export function pickQuality(env: QualityEnv): Quality {
  if (env.override === "high" || env.override === "low") return env.override;
  if (env.coarsePointer || env.width < 768 || env.cores < 4) return "low";
  return "high";
}

/** Browser detection; call once at mount. Safe in jsdom (falls back to high). */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const coarsePointer = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
  const override = new URLSearchParams(window.location.search).get("quality");
  return pickQuality({ coarsePointer, width: window.innerWidth, cores: navigator.hardwareConcurrency ?? 4, override });
}
```

Run the test: PASS, 3 tests.

- [ ] **Step 4: Backdrop**

Add to `spriteManifest.ts`: `bgGalaxy: "bg/galaxy.jpg",` (the manifest test checks the file exists; it does).

Create `src/features/gameplay/renderer/backdrop.ts`:

```ts
import { Sprite, type Texture } from "pixi.js";

export type Backdrop = { sprite: Sprite; pan(dt: number): void };

const SLACK = 0.08;
const PAN_PX_PER_FRAME = 0.04;

/** Cover-fits the galaxy with slack and pans it left/right so an edge never shows. */
export function buildBackdrop(texture: Texture, width: number, height: number): Backdrop {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  const cover = Math.max((width * (1 + SLACK)) / texture.width, (height * (1 + SLACK)) / texture.height);
  sprite.scale.set(cover);
  sprite.alpha = 0.35;
  sprite.tint = 0xa8b4cc;
  const cx = width / 2;
  const cy = height / 2;
  const range = (sprite.width - width) / 2;
  let offset = 0;
  let dir = -1;
  sprite.position.set(cx, cy);
  return {
    sprite,
    pan(dt: number) {
      offset += dir * PAN_PX_PER_FRAME * dt;
      if (offset <= -range) { offset = -range; dir = 1; }
      if (offset >= range) { offset = range; dir = -1; }
      sprite.x = cx + offset;
    },
  };
}
```

- [ ] **Step 5: World layers and tiers**

In `world.ts`:
- Import `Graphics`, `Sprite`, `buildBackdrop`, `type Backdrop`, `type Quality`.
- Replace `starfield`/`meteorites` in `World` with `farStars`, `farRocks`, `nearStars`, `nearRocks`, `overlay: Container`; add `backdrop: Backdrop`, `flame: Sprite`, `vignette: Graphics`, `vignetteTarget: number`, `quality: Quality`.
- `buildWorld(app, tex, quality)`: create containers in the spec order and add them to the stage in that order; `backdrop = buildBackdrop(tex.bgGalaxy, width, height)` added to a `backdropLayer` first.
- Stars: a helper `makeStars(layer, count, rMin, rMax, aMin, aMax, sMin, sMax)` used twice (120 far, 40 near) returning `{ g, speed }[]`; concatenate into `stars`.
- Rocks: helper `makeRocks(layer, count, scaleMin, scaleMax, alpha, sMin, sMax, spinScale)` used twice (4 far with spin 0.4×, 6 near) returning `{ g, speed, spin }[]`; concatenate into `rocks`.
- `makeShip` returns `flame` too; store it on the world.
- Vignette: `const vignette = new Graphics(); vignette.rect(0, 0, width, height).fill({ color: 0xff2d2d, alpha: 1 }); vignette.alpha = 0;` added to `overlay`. (A radial gradient is nicer; if `FillGradient` with `type: "radial"` type-checks in the installed Pixi, use center transparent → edges red; otherwise keep the flat rect, which the pulse keeps subtle.)
- Return the new fields; `vignetteTarget: 0`.

In `ScenarioRenderer.ts`:
- Import `detectQuality`; in `mount` after the token check: `const world = buildWorld(app, tex, detectQuality());`.
- `idle`: `world.backdrop.pan(dt)` first; star/rock loops unchanged in logic (they iterate the concatenated arrays; recycle margin stays).

- [ ] **Step 6: Verify**

`npm test` (84 + 3 = 87), `npx tsc -b`, `npm run build`. Browser: the galaxy visible but dim behind two star layers moving at different speeds; small dim rocks behind, large bright rocks in front but behind enemies. Screenshot `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario\.superpowers\sdd\screens\pp-01-depth.png`. Try `?quality=low` once to confirm it loads (no visual difference yet).

- [ ] **Step 7: Commit**

```bash
git add public/sprites/bg src/features/gameplay/renderer
git commit -m "feat(renderer): galaxy backdrop, two star layers and asteroid depth tiers with a quality picker"
```

---

### Task 2: Light — additive blends, trails, flicker, bloom, glow

**Files:**
- Create: `src/features/gameplay/renderer/fx.ts`, `fx.test.ts`
- Modify: `package.json` (add `pixi-filters`), `world.ts`, `animations.ts`, `ScenarioRenderer.ts`

**Interfaces:**
- Produces in `fx.ts`: `class TrailBuffer { constructor(size: number); push(x, y): void; samples(): { x: number; y: number }[] }` (oldest first, at most `size`); `trail(world, textureKey, size = 3): { update(x: number, y: number): void; destroy(): void }` (ghost sprites at alpha 0.5/0.3/0.15, additive; no-op object at low quality); `makeBloom(): Filter`, `makeGlow(): Filter`.

- [ ] **Step 1: Install**

```bash
npm install pixi-filters
```

- [ ] **Step 2: Failing fx tests (pure parts)**

Create `src/features/gameplay/renderer/fx.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TrailBuffer, shakeOffset } from "./fxMath";

describe("TrailBuffer", () => {
  it("keeps the last N samples oldest first", () => {
    const b = new TrailBuffer(3);
    b.push(1, 1); b.push(2, 2); b.push(3, 3); b.push(4, 4);
    expect(b.samples()).toEqual([{ x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }]);
  });
  it("returns fewer samples before it fills", () => {
    const b = new TrailBuffer(3);
    b.push(1, 1);
    expect(b.samples()).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("shakeOffset", () => {
  it("decays to zero at t = 1 and never exceeds the amplitude", () => {
    const rnd = () => 1; // worst case
    expect(shakeOffset(1, 10, rnd)).toEqual({ x: 0, y: 0 });
    for (const t of [0, 0.25, 0.5, 0.75]) {
      const o = shakeOffset(t, 10, rnd);
      expect(Math.abs(o.x)).toBeLessThanOrEqual(10);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(10);
    }
    expect(shakeOffset(0, 10, () => 0)).toEqual({ x: -10, y: -10 });
  });
});
```

Note the pure math lives in `fxMath.ts` (no Pixi import) so this test runs in jsdom without loading Pixi; `fx.ts` re-exports it.

- [ ] **Step 3: Implement**

Create `src/features/gameplay/renderer/fxMath.ts`:

```ts
export class TrailBuffer {
  private readonly size: number;
  private readonly buf: { x: number; y: number }[] = [];
  constructor(size: number) {
    this.size = size;
  }
  push(x: number, y: number): void {
    this.buf.push({ x, y });
    if (this.buf.length > this.size) this.buf.shift();
  }
  samples(): { x: number; y: number }[] {
    return [...this.buf];
  }
}

/** Random jitter scaled by (1 - t); rnd in [0, 1). */
export function shakeOffset(t: number, amplitude: number, rnd: () => number = Math.random): { x: number; y: number } {
  const k = Math.max(0, 1 - t) * amplitude;
  if (k === 0) return { x: 0, y: 0 };
  return { x: (rnd() * 2 - 1) * k, y: (rnd() * 2 - 1) * k };
}
```

Create `src/features/gameplay/renderer/fx.ts`:

```ts
import { Sprite, type Filter } from "pixi.js";
import { AdvancedBloomFilter, GlowFilter } from "pixi-filters";
import { TrailBuffer, shakeOffset } from "./fxMath";
import type { SpriteKey } from "./spriteManifest";
import { sprite } from "./spriteUtils";
import { tween } from "./tween";
import type { World } from "./world";

export { TrailBuffer, shakeOffset };

export function makeBloom(): Filter {
  return new AdvancedBloomFilter({ threshold: 0.35, bloomScale: 1.2, brightness: 1, blur: 6, quality: 4 });
}

export function makeGlow(): Filter {
  return new GlowFilter({ distance: 12, outerStrength: 2, color: 0x22d3ee });
}

const GHOST_ALPHA = [0.5, 0.3, 0.15];

export type Trail = { update(x: number, y: number): void; destroy(): void };

/** Ghost copies trailing a moving sprite. No-op at low quality. */
export function trail(world: World, key: SpriteKey, scale: number, size = 3): Trail {
  if (world.quality === "low") return { update() {}, destroy() {} };
  const buffer = new TrailBuffer(size + 1);
  const ghosts = GHOST_ALPHA.slice(0, size).map((a) => {
    const g = sprite(world.tex[key], scale);
    g.alpha = a;
    g.blendMode = "add";
    g.visible = false;
    world.effects.addChild(g);
    return g;
  });
  return {
    update(x, y) {
      buffer.push(x, y);
      const s = buffer.samples();
      // samples: oldest..newest; ghost i follows the (i+1)-th most recent sample
      ghosts.forEach((g, i) => {
        const sample = s[s.length - 2 - i];
        if (sample) { g.visible = true; g.position.set(sample.x, sample.y); } else g.visible = false;
      });
    },
    destroy() {
      for (const g of ghosts) g.destroy();
    },
  };
}

/** Jitters the stage for `ms`; never awaited. */
export function shake(world: World, amplitude: number, ms: number): void {
  const stage = world.app.stage;
  void tween(world.app.ticker, ms, (t) => {
    const o = shakeOffset(t, amplitude);
    stage.position.set(o.x, o.y);
  }).then(() => stage.position.set(0, 0));
}

/** Additive white ghost of a sprite that pops and fades over `ms`. */
export function whiteFlash(world: World, source: Sprite, ms = 120): void {
  const ghost = new Sprite(source.texture);
  ghost.anchor.copyFrom(source.anchor);
  ghost.scale.copyFrom(source.scale);
  ghost.rotation = source.rotation;
  ghost.position.copyFrom(source.position);
  ghost.tint = 0xffffff;
  ghost.blendMode = "add";
  world.effects.addChild(ghost);
  void tween(world.app.ticker, ms, (t) => {
    ghost.alpha = 1 - t;
    ghost.scale.set(source.scale.x * (1 + t * 0.3));
  }).then(() => ghost.destroy());
}
```

`scale.copyFrom` / `anchor.copyFrom` exist on `ObservablePoint` in Pixi 8; if `copyFrom` is missing on anchor, use `ghost.anchor.set(source.anchor.x, source.anchor.y)`.

- [ ] **Step 4: Wire into world and renderer**

`world.ts`: in `buildWorld`, after creating `effects` and `shieldRing`: `if (quality === "high") { effects.filters = [makeBloom()]; shieldRing.filters = [makeGlow()]; }`; set `flame.blendMode = "add"` and `shieldRing.blendMode = "add"` in `makeShip`. `laser()` sets `s.blendMode = "add"`. `dot()` sets `g.blendMode = "add"`.

`ScenarioRenderer.ts` `idle`: flame flicker:

```ts
    const f = world.flame;
    f.scale.set(0.7 * (0.9 + Math.random() * 0.25), 0.7 * (0.85 + Math.random() * 0.3));
    f.alpha = 0.8 + Math.random() * 0.2;
```

(0.7 is the flame's base scale from `makeShip`; keep them in sync via a `FLAME_SCALE` constant exported from `world.ts`.)

`animations.ts`: in `fire`, create `const tr = trail(world, charged ? "laserCharged" : "laserMine", charged ? 1.1 : 0.8);` and call `tr.update(shot.x, shot.y)` at the end of each travel frame; `tr.destroy()` right after `shot.destroy()`. Same in `hit` with `"laserTheirs"` and the shot's scale. `burst`: 12 embers, flash radius `18 * scale`, flash/ring/embers additive (they already are through `dot`; set `ring.blendMode = "add"`).

- [ ] **Step 5: Verify**

`npm test` (87 + 3 = 90), `npx tsc -b`, `npm run build`. Browser at high quality: lasers glow with a short trail, the flame flickers, explosions bloom, the shield glows when up. At `?quality=low`: same scene without bloom/glow/trails and no console errors. Screenshots `pp-02-light-high.png`, `pp-03-light-low.png`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/features/gameplay/renderer
git commit -m "feat(renderer): additive light, laser trails, flame flicker, bloom and shield glow behind a quality switch"
```

---

### Task 3: Impact — shake, white flash, vignette

**Files:**
- Modify: `animations.ts`, `ScenarioRenderer.ts`, `world.ts` (only if the vignette needs a helper)

- [ ] **Step 1: Shakes and flashes**

In `animations.ts` (import `shake`, `whiteFlash` from `./fx`):
- `fire`: after the travel tween and before `burst`: `whiteFlash(world, enemy);` then `shake(world, size === "cruiser" ? 3 : 2, 150);`.
- `hit` (unabsorbed branch, before the shake tween): `shake(world, points * 3, 250);` and tint the active damage overlay along with the body: find `const overlay = world.damage.find((d) => d.alpha > 0);` and set `overlay.tint` to the same value as `shipBody.tint` inside the tween, resetting after.
- `explode`: `shake(world, 8, 600);` at the start.

- [ ] **Step 2: Vignette**

`ScenarioRenderer.syncState`: after the damage overlays: `this.world.vignetteTarget = hullPct < 25 ? 0.35 : hullPct < 50 ? 0.18 : 0;`.
`idle`: `world.vignette.alpha = world.vignetteTarget * (1 + 0.2 * Math.sin(performance.now() / 1000 * Math.PI * 2));` (1 Hz).

- [ ] **Step 3: Verify**

`npm test`, `npx tsc -b`, `npm run build`. Browser: `hit 3` shakes the screen and tints the ship; fire shows a white pop before the burst; let a replay run until hull < 50 and then < 25 to see the vignette appear and pulse (a ~2 minute replay at speed 16 with the default target 20 gets there, or use speed 32). Screenshots `pp-04-impact.png`, `pp-05-vignette.png`.

- [ ] **Step 4: Commit**

```bash
git add src/features/gameplay/renderer
git commit -m "feat(renderer): screen shake, enemy white flash and low-hull vignette"
```

---

### Task 4: Docs and final pass

- [ ] **Step 1:** `CLAUDE.md` renderer bullet: mention `quality.ts` (auto, `?quality=` override), `fx.ts` (bloom/glow/trail/shake), the layer order, and that the backdrop is OSB's galaxy image. `README.md`: note `?quality=low` for phones.
- [ ] **Step 2:** `npm test`, `npx tsc -b`, `npm run build`; a full replay at speed 16 to the result overlay at high quality; a 30-second look at `?quality=low`; report the Pixi ticker FPS at both (read `app.ticker.FPS` via the console or just observe smoothness and note it). Screenshots `pp-06-result.png`.
- [ ] **Step 3:** Commit `docs: presentation pass notes and quality switch`.

---

## Self-review

Spec §2 → Task 1; §3 → Task 2; §4 → Task 3; §5 → Task 1 (`quality.ts`) and Task 2 (gating); §7 tests → Tasks 1 and 2; docs → Task 4. Numbers are copied into Global Constraints. Names consistent: `World.quality`, `World.flame`, `World.vignette`, `World.vignetteTarget`, `World.backdrop`; `trail()` signature `(world, key, scale, size?)` used in Task 2 Step 4; `shake(world, amplitude, ms)` and `whiteFlash(world, sprite, ms?)` used in Task 3. Pure math is isolated in `fxMath.ts` so tests never import Pixi.
