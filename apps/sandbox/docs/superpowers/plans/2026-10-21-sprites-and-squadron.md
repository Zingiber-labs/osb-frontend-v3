# Sprite Art and Enemy Squadron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder shapes with Kenney sprite art and keep a persistent enemy squadron on screen so shots hit ships that were already there.

**Architecture:** Renderer-only change. A manifest + loader (`assets.ts`) provides textures; `world.ts` builds sprites; a pure `SquadronModel` (`squadron.ts`) owns enemy slots, fly-in, weave, and respawn timers; `SquadronView` reconciles the model to sprites each frame; `animations.ts` targets squadron members instead of spawning enemies on the fly. Engine, feeds, hook, HUD, queue, and durations are untouched.

**Tech Stack:** PixiJS 8 (`Assets`, `Sprite`, `Texture`), Vitest. Sprites already copied to `public/sprites/` (18 PNGs + `CREDITS.md`).

Spec: `docs/superpowers/specs/2026-10-21-sprites-and-squadron-design.md`

## Global Constraints

- Project root: `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario`, branch `feat/ship-scenario-mvp` (continue on it; commits per task are authorized; never mention Claude or AI in commit messages).
- Only `src/features/gameplay/renderer/` imports `pixi.js`. Engine, feeds, hook, HUD, components, mapping, durations and `ActionQueue` must not change.
- Durations unchanged: fire 600, hit 500, shieldUp 400, fizzle 400, stall 1000, enemyMalfunction 800, objectiveComplete 1200, warpOut 2000, explode 2000; gap 150.
- `syncState` contract: shield sprite alpha = `shield / SHIELD_MAX`; hull damage overlays exclusive: hull < 75 → damage1, < 50 → damage2, < 25 → damage3, else none.
- Squadron numbers (verbatim from spec): 3 slots; anchors at x = width × (0.76 + slot × 0.04), y = height × (0.3 + slot × 0.2); enter 1200 ms, fast enter 400 ms; respawn delay 600 ms; weave x = sin(clock/1100 + seed) × 6, y = sin(clock/700 + seed) × 12; sizes rotate scout, fighter, cruiser.
- Sprite orientation: Kenney player ship faces up, enemies face down, lasers point up; rotating each by `FACE_RIGHT = Math.PI / 2` (clockwise quarter turn) makes the player face right, enemies face left, lasers horizontal. The flame (`fire08.png`) must trail behind the ship (point left); confirm the sign visually.
- tsconfig has `erasableSyntaxOnly`: no constructor parameter properties, no enums.
- jsdom tests must never import `pixi.js` at module level: the manifest lives in `spriteManifest.ts` (no Pixi import) and only the loader in `assets.ts` imports Pixi.
- `npm test`, `npx tsc -b`, `npm run build` must stay green after every task. A dev server may already be running on port 5173 (hot reload picks up changes); if so, reuse it for browser checks rather than starting another.

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/gameplay/renderer/spriteManifest.ts` | `SPRITE_FILES`, `SpriteKey`, `SPRITE_BASE` (no Pixi) |
| `src/features/gameplay/renderer/assets.ts` | `SpriteTextures`, `loadSprites()` (Pixi `Assets`) |
| `src/features/gameplay/renderer/spriteManifest.test.ts` | every manifest file exists under `public/sprites/` |
| `src/features/gameplay/renderer/world.ts` | sprite-based world; holds squadron model + view |
| `src/features/gameplay/renderer/squadron.ts` | `SquadronModel` (pure) |
| `src/features/gameplay/renderer/squadron.test.ts` | model tests |
| `src/features/gameplay/renderer/squadronView.ts` | `SquadronView` (Pixi) |
| `src/features/gameplay/renderer/animations.ts` | rewired animations |
| `src/features/gameplay/renderer/ScenarioRenderer.ts` | loads sprites, ticks squadron, damage overlays |

---

### Task 1: Sprite manifest, loader, and sprite-based world

**Files:**
- Create: `src/features/gameplay/renderer/spriteManifest.ts`, `src/features/gameplay/renderer/assets.ts`
- Modify: `src/features/gameplay/renderer/world.ts`, `src/features/gameplay/renderer/animations.ts`, `src/features/gameplay/renderer/ScenarioRenderer.ts`
- Test: `src/features/gameplay/renderer/spriteManifest.test.ts`

**Interfaces:**
- Produces: `SPRITE_FILES`, `SpriteKey`, `SPRITE_BASE` (manifest); `SpriteTextures = Record<SpriteKey, Texture>`, `loadSprites(base?): Promise<SpriteTextures>`; `World` gains `tex: SpriteTextures`, `shipBody: Sprite`, `damage: [Sprite, Sprite, Sprite]`, `shieldRing: Sprite`; `FACE_RIGHT`, `ENEMY_SCALE`, `ENEMY_TEXTURE`, `laser(world, kind)`, `dot(world, radius, color)` helpers; `spawnEnemy(world, size): Sprite` stays for now (Task 3 removes it); `buildWorld(app, tex)`.

- [ ] **Step 1: Write the failing manifest test**

Create `src/features/gameplay/renderer/spriteManifest.test.ts`:

```ts
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SPRITE_FILES } from "./spriteManifest";

describe("sprite manifest", () => {
  it("lists only files that exist under public/sprites", () => {
    const missing = Object.entries(SPRITE_FILES)
      .filter(([, file]) => !existsSync(resolve(process.cwd(), "public/sprites", file)))
      .map(([key, file]) => `${key} -> ${file}`);
    expect(missing).toEqual([]);
  });

  it("has the roles the renderer needs", () => {
    const keys = Object.keys(SPRITE_FILES);
    for (const k of ["ship", "shipDamage1", "shipDamage2", "shipDamage3", "flame", "shield", "enemyScout", "enemyFighter", "enemyCruiser", "laserMine", "laserCharged", "laserTheirs", "meteorBig1", "meteorMed1"]) {
      expect(keys).toContain(k);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/features/gameplay/renderer/spriteManifest.test.ts`
Expected: FAIL, "Failed to resolve import ./spriteManifest".

- [ ] **Step 3: Write the manifest and loader**

Create `src/features/gameplay/renderer/spriteManifest.ts`:

```ts
export const SPRITE_BASE = "/sprites";

export const SPRITE_FILES = {
  ship: "playerShip1_blue.png",
  shipDamage1: "playerShip1_damage1.png",
  shipDamage2: "playerShip1_damage2.png",
  shipDamage3: "playerShip1_damage3.png",
  flame: "fire08.png",
  shield: "shield1.png",
  enemyScout: "enemyRed1.png",
  enemyFighter: "enemyRed3.png",
  enemyCruiser: "enemyRed5.png",
  laserMine: "laserBlue01.png",
  laserCharged: "laserBlue08.png",
  laserTheirs: "laserRed01.png",
  meteorBig1: "meteorGrey_big1.png",
  meteorBig2: "meteorGrey_big2.png",
  meteorBig3: "meteorGrey_big3.png",
  meteorBig4: "meteorGrey_big4.png",
  meteorMed1: "meteorGrey_med1.png",
  meteorMed2: "meteorGrey_med2.png",
} as const;

export type SpriteKey = keyof typeof SPRITE_FILES;
```

Create `src/features/gameplay/renderer/assets.ts`:

```ts
import { Assets, type Texture } from "pixi.js";
import { SPRITE_BASE, SPRITE_FILES, type SpriteKey } from "./spriteManifest";

export type SpriteTextures = Record<SpriteKey, Texture>;

/** Loads every manifest sprite once. Rejects if any file fails, so mount() can fall back to HUD-only. */
export async function loadSprites(base: string = SPRITE_BASE): Promise<SpriteTextures> {
  const keys = Object.keys(SPRITE_FILES) as SpriteKey[];
  const textures = await Promise.all(keys.map((k) => Assets.load<Texture>(`${base}/${SPRITE_FILES[k]}`)));
  const out = {} as SpriteTextures;
  keys.forEach((k, i) => {
    out[k] = textures[i];
  });
  return out;
}
```

- [ ] **Step 4: Run the manifest test**

Run: `npm test -- src/features/gameplay/renderer/spriteManifest.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Rebuild the world with sprites**

Replace `src/features/gameplay/renderer/world.ts`:

```ts
import { Application, Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { EnemySize } from "@/features/gameplay/engine/types";
import type { SpriteTextures } from "./assets";
import type { SpriteKey } from "./spriteManifest";

/** Kenney sprites face up (player) or down (enemies); a clockwise quarter turn makes them face along x. */
export const FACE_RIGHT = Math.PI / 2;

export type World = {
  app: Application;
  width: number;
  height: number;
  tex: SpriteTextures;
  starfield: Container;
  meteorites: Container;
  enemyLane: Container;
  shipLayer: Container;
  effects: Container;
  ship: Container;
  shipBase: { x: number; y: number };
  shipBody: Sprite;
  damage: [Sprite, Sprite, Sprite];
  shieldRing: Sprite;
  stars: { g: Graphics; speed: number }[];
  rocks: { g: Sprite; speed: number; spin: number }[];
};

export const COLORS = {
  star: 0xffffff,
  flash: 0xffffff,
  ember: 0xf97316,
  gold: 0xfbbf24,
  ship: 0x38bdf8,
};

export const SHIP_SCALE = 0.6;
export const ENEMY_SCALE: Record<EnemySize, number> = { scout: 0.45, fighter: 0.6, cruiser: 0.8 };
export const ENEMY_TEXTURE: Record<EnemySize, SpriteKey> = { scout: "enemyScout", fighter: "enemyFighter", cruiser: "enemyCruiser" };
const METEOR_KEYS: SpriteKey[] = ["meteorBig1", "meteorBig2", "meteorBig3", "meteorBig4", "meteorMed1", "meteorMed2"];

export function sprite(tex: Texture, scale = 1, rotation = FACE_RIGHT): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.scale.set(scale);
  s.rotation = rotation;
  return s;
}

function makeShip(tex: SpriteTextures) {
  const ship = new Container();
  // The flame trails behind the ship (to the left). If it visibly points the wrong way, flip the sign of its rotation.
  const flame = sprite(tex.flame, 0.7, -FACE_RIGHT);
  flame.x = -36;
  const body = sprite(tex.ship, SHIP_SCALE);
  const damage = ([1, 2, 3] as const).map((i) => {
    const d = sprite(tex[`shipDamage${i}`], SHIP_SCALE);
    d.alpha = 0;
    return d;
  }) as [Sprite, Sprite, Sprite];
  const shieldRing = sprite(tex.shield, SHIP_SCALE);
  shieldRing.alpha = 0;
  ship.addChild(flame, body, ...damage, shieldRing);
  return { ship, body, damage, shieldRing };
}

export function buildWorld(app: Application, tex: SpriteTextures): World {
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
    const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)];
    const g = sprite(tex[key], 0.45 + Math.random() * 0.4, Math.random() * Math.PI * 2);
    g.alpha = 0.85;
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    meteorites.addChild(g);
    return { g, speed: 0.6 + Math.random() * 1.0, spin: (Math.random() - 0.5) * 0.02 };
  });

  const { ship, body, damage, shieldRing } = makeShip(tex);
  const shipBase = { x: width * 0.2, y: height / 2 };
  ship.position.set(shipBase.x, shipBase.y);
  shipLayer.addChild(ship);

  return { app, width, height, tex, starfield, meteorites, enemyLane, shipLayer, effects, ship, shipBase, shipBody: body, damage, shieldRing, stars, rocks };
}

/** Interim spawner (Task 3 replaces it with the squadron). */
export function spawnEnemy(world: World, size: EnemySize): Sprite {
  const enemy = sprite(world.tex[ENEMY_TEXTURE[size]], ENEMY_SCALE[size]);
  enemy.x = world.width * 0.8;
  enemy.y = world.height / 2 + (Math.random() - 0.5) * world.height * 0.4;
  world.enemyLane.addChild(enemy);
  return enemy;
}

export type LaserKind = "mine" | "charged" | "theirs";

export function laser(world: World, kind: LaserKind): Sprite {
  const key: SpriteKey = kind === "mine" ? "laserMine" : kind === "charged" ? "laserCharged" : "laserTheirs";
  const s = sprite(world.tex[key], kind === "charged" ? 1.1 : 0.8);
  world.effects.addChild(s);
  return s;
}

export function dot(world: World, radius: number, color: number): Graphics {
  const g = new Graphics().circle(0, 0, radius).fill(color);
  world.effects.addChild(g);
  return g;
}
```

- [ ] **Step 6: Point the animations at sprites**

In `src/features/gameplay/renderer/animations.ts` make these edits (full rewrite comes in Task 3):

- Change the import line to `import { COLORS, dot, laser, spawnEnemy, type World } from "./world";`.
- In `fire`: replace `const shot = bullet(world, charged ? 7 : 3);` with `const shot = laser(world, charged ? "charged" : "mine");`. Replace the enemy scale line with `const base = enemy.scale.x;` before the second tween and `enemy.scale.set(base * (1 + t * (charged ? 1.4 : 0.8)));` inside it. The charged ring stays a Graphics circle but use `COLORS.gold`.
- In `hit`: replace `const shot = bullet(world, 2 + points, COLORS.enemyBullet);` with `const shot = laser(world, "theirs"); shot.scale.set(0.6 + points * 0.15);`. Replace `ship.tint = ...` with `world.shipBody.tint = t < 0.5 ? 0xff6b6b : 0xffffff;` and the reset with `world.shipBody.tint = 0xffffff;` (tinting the container would also tint the shield and flame).
- In `fizzle`: `const shot = laser(world, "mine");`.
- In `objectiveComplete`: keep the Graphics ring (`COLORS.gold`).
- In `explode`: replace `bullet(world, 4, i % 2 ? COLORS.ship : 0xf97316)` with `dot(world, 4, i % 2 ? COLORS.ship : COLORS.ember)`.
- In `enemyMalfunction`: unchanged apart from the import.

- [ ] **Step 7: Load sprites in the renderer and drive damage overlays**

In `src/features/gameplay/renderer/ScenarioRenderer.ts`:

- Add `import { loadSprites } from "./assets";` and `import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";` (already present).
- In `mount`, after `app.resize();` and before `buildWorld`, insert:

```ts
    const tex = await loadSprites();
    if (id !== this.mountId) {
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    const world = buildWorld(app, tex);
```

  and delete the old `const world = buildWorld(app);`. Note `host.appendChild(canvas)` happens before the load; that is fine, but a stale mount after the load must remove its canvas, which `removeView: true` does.

- Replace `syncState` with:

```ts
  syncState(state: ScenarioState): void {
    if (!this.world) return;
    this.world.shieldRing.alpha = state.shield / SHIELD_MAX;
    const hullPct = (state.hull / HULL_MAX) * 100;
    const level = hullPct < 25 ? 3 : hullPct < 50 ? 2 : hullPct < 75 ? 1 : 0;
    this.world.damage.forEach((d, i) => {
      d.alpha = i + 1 === level ? 1 : 0;
    });
  }
```

- [ ] **Step 8: Verify**

Run: `npm test` (expect 69 tests), `npx tsc -b`, `npm run build`. All clean.

Browser check (dev server on 5173, reuse it if running; otherwise `npm run dev` in the background): open `/game-play`, start a replay with player `4903027`, target 10, speed 16. Confirm: blue Kenney ship on the left facing right with a flame trailing left (if the flame points right, flip its rotation sign in `makeShip` and note it), grey meteor sprites drifting, red enemy ships appearing facing left, blue lasers from the ship, red lasers hitting the ship, damage overlay appearing as hull drops. Take one screenshot to `C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario\.superpowers\sdd\screens\sprites-01.png` (agent-browser: no `wait --load networkidle`; absolute path; `agent-browser close` after).

- [ ] **Step 9: Commit**

```bash
git add public/sprites src/features/gameplay/renderer
git commit -m "feat(renderer): kenney sprite art for ship, enemies, lasers and meteors"
```

---

### Task 2: SquadronModel (pure) with tests

**Files:**
- Create: `src/features/gameplay/renderer/squadron.ts`
- Test: `src/features/gameplay/renderer/squadron.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Member = { id: number; slot: number; size: EnemySize; state: "entering" | "holding"; x: number; y: number; enterMs: number; elapsed: number; seed: number };
  type SquadronOptions = { width: number; height: number; slots?: number; respawnDelayMs?: number; enterMs?: number; fastEnterMs?: number; random?: () => number };
  class SquadronModel {
    constructor(opts: SquadronOptions);           // fills every slot with an entering member
    readonly members: Member[];
    anchor(slot: number): { x: number; y: number };
    spawn(slot: number, opts?: { fast?: boolean }): Member;
    update(dtMs: number): void;
    takeNearest(x: number, y: number): Member | null;
    takeAny(): Member | null;
    pick(): Member | null;
    freeSlot(): number;
  }
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/features/gameplay/renderer/squadron.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SquadronModel } from "./squadron";

const W = 1000;
const H = 500;
const make = (over = {}) => new SquadronModel({ width: W, height: H, random: () => 0, ...over });

describe("SquadronModel", () => {
  it("fills three slots with entering members, sizes rotating scout, fighter, cruiser", () => {
    const s = make();
    expect(s.members).toHaveLength(3);
    expect(s.members.map((m) => m.slot)).toEqual([0, 1, 2]);
    expect(s.members.map((m) => m.size)).toEqual(["scout", "fighter", "cruiser"]);
    expect(s.members.every((m) => m.state === "entering")).toBe(true);
    expect(s.members.every((m) => m.x > W)).toBe(true);
  });

  it("places anchors at the spec positions", () => {
    const s = make();
    expect(s.anchor(0)).toEqual({ x: 760, y: 150 });
    expect(s.anchor(1)).toEqual({ x: 800, y: 250 });
    expect(s.anchor(2)).toEqual({ x: 840, y: 350 });
  });

  it("moves entering members to their anchor over 1200 ms then holds and weaves", () => {
    const s = make();
    s.update(600);
    const mid = s.members[0];
    expect(mid.state).toBe("entering");
    expect(mid.x).toBeGreaterThan(760);
    expect(mid.x).toBeLessThan(W + 80);
    s.update(600);
    for (const m of s.members) {
      expect(m.state).toBe("holding");
      const a = s.anchor(m.slot);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(6);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(12);
    }
  });

  it("takeNearest removes the closest member and respawns its slot after 600 ms", () => {
    const s = make();
    s.update(1200);
    const taken = s.takeNearest(0, 250);
    expect(taken?.slot).toBe(1);
    expect(s.members).toHaveLength(2);
    s.update(599);
    expect(s.members).toHaveLength(2);
    s.update(1);
    expect(s.members).toHaveLength(3);
    const fresh = s.members.find((m) => m.slot === 1);
    expect(fresh?.state).toBe("entering");
    expect(fresh?.id).not.toBe(taken?.id);
  });

  it("takeAny empties the squadron and returns null afterwards", () => {
    const s = make();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).toBeNull();
    expect(s.takeNearest(0, 0)).toBeNull();
    expect(s.pick()).toBeNull();
  });

  it("fast spawn enters in 400 ms and freeSlot reports an empty slot", () => {
    const s = make();
    s.takeAny();
    const slot = s.freeSlot();
    expect(slot).toBe(0);
    const m = s.spawn(slot, { fast: true });
    expect(m.enterMs).toBe(400);
    s.update(400);
    expect(s.members.find((x) => x.id === m.id)?.state).toBe("holding");
  });

  it("spawning into a slot cancels that slot's pending respawn", () => {
    const s = make();
    s.takeAny();
    s.spawn(0, { fast: true });
    s.update(700);
    expect(s.members.filter((m) => m.slot === 0)).toHaveLength(1);
  });

  it("pick prefers a holding member and never removes it", () => {
    const s = make();
    s.update(1200);
    s.takeAny();
    s.update(600); // slot 0 respawned, entering
    const p = s.pick();
    expect(p?.state).toBe("holding");
    expect(s.members).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/features/gameplay/renderer/squadron.test.ts`
Expected: FAIL, "Failed to resolve import ./squadron".

- [ ] **Step 3: Write the model**

Create `src/features/gameplay/renderer/squadron.ts`:

```ts
import type { EnemySize } from "@/features/gameplay/engine/types";

export type MemberState = "entering" | "holding";

export type Member = {
  id: number;
  slot: number;
  size: EnemySize;
  state: MemberState;
  x: number;
  y: number;
  enterMs: number;
  elapsed: number;
  seed: number;
};

export type SquadronOptions = {
  width: number;
  height: number;
  slots?: number;
  respawnDelayMs?: number;
  enterMs?: number;
  fastEnterMs?: number;
  random?: () => number;
};

const SIZES: EnemySize[] = ["scout", "fighter", "cruiser"];
const OFFSCREEN_PAD = 80;

/**
 * Pure squadron state: which enemies exist, where they are, and when empty slots refill.
 * No Pixi here; SquadronView turns members into sprites.
 */
export class SquadronModel {
  readonly members: Member[] = [];
  private readonly width: number;
  private readonly height: number;
  private readonly slotCount: number;
  private readonly respawnDelayMs: number;
  private readonly enterMs: number;
  private readonly fastEnterMs: number;
  private readonly random: () => number;
  private readonly respawnAt = new Map<number, number>();
  private nextId = 1;
  private sizeIndex = 0;
  private clock = 0;

  constructor(opts: SquadronOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.slotCount = opts.slots ?? 3;
    this.respawnDelayMs = opts.respawnDelayMs ?? 600;
    this.enterMs = opts.enterMs ?? 1200;
    this.fastEnterMs = opts.fastEnterMs ?? 400;
    this.random = opts.random ?? Math.random;
    for (let slot = 0; slot < this.slotCount; slot += 1) this.spawn(slot);
  }

  anchor(slot: number): { x: number; y: number } {
    return { x: this.width * (0.76 + slot * 0.04), y: this.height * (0.3 + slot * 0.2) };
  }

  spawn(slot: number, opts: { fast?: boolean } = {}): Member {
    const a = this.anchor(slot);
    const member: Member = {
      id: this.nextId++,
      slot,
      size: SIZES[this.sizeIndex++ % SIZES.length],
      state: "entering",
      x: this.width + OFFSCREEN_PAD,
      y: a.y,
      enterMs: opts.fast ? this.fastEnterMs : this.enterMs,
      elapsed: 0,
      seed: this.random() * Math.PI * 2,
    };
    this.members.push(member);
    this.respawnAt.delete(slot);
    return member;
  }

  update(dtMs: number): void {
    this.clock += dtMs;
    const startX = this.width + OFFSCREEN_PAD;
    for (const m of this.members) {
      m.elapsed += dtMs;
      const a = this.anchor(m.slot);
      if (m.state === "entering") {
        const t = Math.min(1, m.elapsed / m.enterMs);
        const eased = 1 - (1 - t) * (1 - t);
        m.x = startX + (a.x - startX) * eased;
        m.y = a.y;
        if (t >= 1) m.state = "holding";
      } else {
        m.x = a.x + Math.sin(this.clock / 1100 + m.seed) * 6;
        m.y = a.y + Math.sin(this.clock / 700 + m.seed) * 12;
      }
    }
    for (const [slot, at] of [...this.respawnAt]) {
      if (this.clock >= at) this.spawn(slot);
    }
  }

  takeNearest(x: number, y: number): Member | null {
    if (this.members.length === 0) return null;
    let best = this.members[0];
    let bestD = Infinity;
    for (const m of this.members) {
      const d = (m.x - x) ** 2 + (m.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    this.remove(best);
    return best;
  }

  takeAny(): Member | null {
    const m = this.members[0];
    if (!m) return null;
    this.remove(m);
    return m;
  }

  pick(): Member | null {
    return this.members.find((m) => m.state === "holding") ?? this.members[0] ?? null;
  }

  freeSlot(): number {
    for (let slot = 0; slot < this.slotCount; slot += 1) {
      if (!this.members.some((m) => m.slot === slot)) return slot;
    }
    return 0;
  }

  private remove(member: Member): void {
    const idx = this.members.indexOf(member);
    if (idx >= 0) this.members.splice(idx, 1);
    this.respawnAt.set(member.slot, this.clock + this.respawnDelayMs);
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/features/gameplay/renderer/squadron.test.ts`
Expected: PASS, 8 tests. Then `npx tsc -b` clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/gameplay/renderer/squadron.ts src/features/gameplay/renderer/squadron.test.ts
git commit -m "feat(renderer): pure squadron model with slots, fly-in, weave and respawn"
```

---

### Task 3: Squadron view and rewired animations

**Files:**
- Create: `src/features/gameplay/renderer/squadronView.ts`
- Modify: `src/features/gameplay/renderer/world.ts`, `src/features/gameplay/renderer/animations.ts`, `src/features/gameplay/renderer/ScenarioRenderer.ts`

**Interfaces:**
- Consumes: `SquadronModel`, `Member`; `World`, `sprite`, `laser`, `dot`, `ENEMY_SCALE`, `ENEMY_TEXTURE`, `FACE_RIGHT`, `COLORS`.
- Produces: `class SquadronView { constructor(model, layer, tex); sync(): void; detach(id): Sprite | undefined; positionOf(id): {x,y} | undefined; destroy(): void }`; `World` gains `squadron: SquadronModel; squadronView: SquadronView`; `spawnEnemy` is removed.

- [ ] **Step 1: Write the view**

Create `src/features/gameplay/renderer/squadronView.ts`:

```ts
import type { Container, Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import type { SquadronModel } from "./squadron";
import { ENEMY_SCALE, ENEMY_TEXTURE, sprite } from "./world";

/** Reconciles SquadronModel members to sprites once per frame. */
export class SquadronView {
  private readonly model: SquadronModel;
  private readonly layer: Container;
  private readonly tex: SpriteTextures;
  private readonly sprites = new Map<number, Sprite>();

  constructor(model: SquadronModel, layer: Container, tex: SpriteTextures) {
    this.model = model;
    this.layer = layer;
    this.tex = tex;
  }

  sync(): void {
    const live = new Set<number>();
    for (const m of this.model.members) {
      live.add(m.id);
      let s = this.sprites.get(m.id);
      if (!s) {
        s = sprite(this.tex[ENEMY_TEXTURE[m.size]], ENEMY_SCALE[m.size]);
        this.layer.addChild(s);
        this.sprites.set(m.id, s);
      }
      s.position.set(m.x, m.y);
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.destroy();
        this.sprites.delete(id);
      }
    }
  }

  /** Hands the sprite to an animation, which now owns and must destroy it. */
  detach(id: number): Sprite | undefined {
    const s = this.sprites.get(id);
    if (s) this.sprites.delete(id);
    return s;
  }

  positionOf(id: number): { x: number; y: number } | undefined {
    const s = this.sprites.get(id);
    return s ? { x: s.x, y: s.y } : undefined;
  }

  destroy(): void {
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
  }
}
```

Note the import of `sprite`, `ENEMY_SCALE`, `ENEMY_TEXTURE` from `./world` and `world.ts` importing `SquadronView` would be circular. Avoid it: move `sprite`, `ENEMY_SCALE`, `ENEMY_TEXTURE`, `FACE_RIGHT`, `SHIP_SCALE` into a new `src/features/gameplay/renderer/spriteUtils.ts` and re-export them from `world.ts` so existing imports keep working. `squadronView.ts` imports from `./spriteUtils`.

- [ ] **Step 2: Add the squadron to the world**

In `world.ts`: import `SquadronModel` and `SquadronView`; add `squadron: SquadronModel; squadronView: SquadronView;` to `World`; in `buildWorld`, after the enemy lane exists, create `const squadron = new SquadronModel({ width, height }); const squadronView = new SquadronView(squadron, enemyLane, tex); squadronView.sync();` and return them. Delete `spawnEnemy`.

- [ ] **Step 3: Rewrite the animations**

Replace `src/features/gameplay/renderer/animations.ts`:

```ts
import { Graphics } from "pixi.js";
import type { EnemySize, ShipAction } from "@/features/gameplay/engine/types";
import { COLORS, dot, laser, type World } from "./world";
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

const BURST_SCALE: Record<EnemySize, number> = { scout: 1, fighter: 1.4, cruiser: 1.9 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Procedural explosion: white flash, ember ring, radial particles. Runs for `ms`. */
async function burst(world: World, x: number, y: number, scale: number, ms: number) {
  const flash = dot(world, 14 * scale, COLORS.flash);
  flash.position.set(x, y);
  const ring = new Graphics().circle(0, 0, 10 * scale).stroke({ width: 3, color: COLORS.ember });
  ring.position.set(x, y);
  world.effects.addChild(ring);
  const parts = Array.from({ length: 8 }, (_, i) => {
    const p = dot(world, 3 * scale, i % 2 ? COLORS.ember : COLORS.gold);
    p.position.set(x, y);
    const a = (i / 8) * Math.PI * 2;
    return { p, dx: Math.cos(a) * 60 * scale, dy: Math.sin(a) * 60 * scale };
  });
  await tween(world.app.ticker, ms, (t) => {
    flash.scale.set(1 + t * 2.5);
    flash.alpha = 1 - t;
    ring.scale.set(1 + t * 5);
    ring.alpha = 1 - t;
    for (const { p, dx, dy } of parts) {
      p.x = x + dx * easeOut(t);
      p.y = y + dy * easeOut(t);
      p.alpha = 1 - t;
    }
  });
  flash.destroy();
  ring.destroy();
  for (const { p } of parts) p.destroy();
}

async function fire(world: World, size: EnemySize, charged: boolean) {
  const { app, ship, squadron, squadronView } = world;
  let member = squadron.takeNearest(ship.x, ship.y);
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeNearest(ship.x, ship.y)!;
  }
  const enemy = squadronView.detach(member.id)!;
  const dest = squadron.anchor(member.slot);
  const fromX = enemy.x;
  const fromY = enemy.y;
  const shot = laser(world, charged ? "charged" : "mine");
  const travel = DURATION.fire * 0.6;
  await tween(app.ticker, travel, (t) => {
    // A freshly spawned target is still flying in; bring it to its anchor during the shot's flight.
    enemy.x = lerp(fromX, dest.x, t);
    enemy.y = lerp(fromY, dest.y, t);
    shot.x = lerp(ship.x + 40, enemy.x, t);
    shot.y = lerp(ship.y, enemy.y, t);
  });
  shot.destroy();
  const base = enemy.scale.x;
  const burstDone = burst(world, enemy.x, enemy.y, BURST_SCALE[size] * (charged ? 1.3 : 1), DURATION.fire - travel);
  await tween(app.ticker, (DURATION.fire - travel) * 0.5, (t) => {
    enemy.scale.set(base * (1 + t * 0.6));
    enemy.alpha = 1 - t;
  });
  enemy.destroy();
  await burstDone;
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean) {
  const { app, ship, shipBody, shieldRing, shipBase, squadron, squadronView } = world;
  const source = squadron.pick();
  const from = (source && squadronView.positionOf(source.id)) ?? { x: world.width * 0.85, y: ship.y + (Math.random() - 0.5) * 80 };
  const shot = laser(world, "theirs");
  shot.scale.set(0.6 + points * 0.15);
  const travel = DURATION.hit * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(from.x - 30, ship.x + 20, t);
    shot.y = lerp(from.y, ship.y, t);
  });
  shot.destroy();
  if (absorbed) {
    const before = shieldRing.alpha;
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, before, t);
      shieldRing.scale.set(0.6 * (1 + (1 - t) * 0.2));
    });
    shieldRing.scale.set(0.6);
    return;
  }
  const amplitude = points * 3;
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = shipBase.x + Math.sin(t * 40) * amplitude * (1 - t);
    shipBody.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
  });
  ship.x = shipBase.x;
  shipBody.tint = 0xffffff;
}

async function shieldUp(world: World) {
  const { app, shieldRing } = world;
  const before = shieldRing.alpha;
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const pulse = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(0.6 * pulse);
    // Make the pulse visible even before syncState raises the alpha.
    shieldRing.alpha = Math.max(before, t < 0.5 ? t * 2 : 2 - t * 2);
  });
  shieldRing.scale.set(0.6);
  shieldRing.alpha = before;
}

async function fizzle(world: World) {
  const { app, ship } = world;
  const shot = laser(world, "mine");
  await tween(app.ticker, DURATION.fizzle, (t) => {
    shot.x = ship.x + 40 + t * world.width * 0.25;
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
  const { squadron, squadronView } = world;
  let member = squadron.takeAny();
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeAny()!;
  }
  const enemy = squadronView.detach(member.id)!;
  const startY = enemy.y;
  const startRot = enemy.rotation;
  await tween(world.app.ticker, DURATION.enemyMalfunction, (t) => {
    enemy.y = startY - t * 220;
    enemy.rotation = startRot + t * 6;
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
  const big = burst(world, ship.x, ship.y, 3, DURATION.explode * 0.6);
  await tween(app.ticker, DURATION.explode, (t) => {
    ship.alpha = 1 - t;
    ship.scale.set(1 + t);
  });
  await big;
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

- [ ] **Step 4: Tick the squadron**

In `ScenarioRenderer.ts` `idle`, after the rock loop add:

```ts
    world.squadron.update(ticker.deltaMS);
    world.squadronView.sync();
```

And in `destroy()`, before `this.world = null;`, call `this.world?.squadronView.destroy();`.

- [ ] **Step 5: Verify**

Run: `npm test` (77 tests), `npx tsc -b`, `npm run build`.

Browser check (same procedure as Task 1): three red enemies should fly in from the right at start and hover in a loose column, weaving. Pause the feed and press `fire scout` three times quickly: each shot should hit one of the hovering enemies, which explodes, and replacements fly in; the fourth `fire` in a burst should bring in a fast replacement that gets hit as it arrives. `hit 3` should originate from one of the hovering enemies. `enemyMalfunction` spins one away and a replacement comes. Resume and watch a minute of replay. Screenshots `squadron-01.png` (idle formation), `squadron-02.png` (mid fire), `squadron-03.png` (after a burst) in `.superpowers\sdd\screens\`.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay/renderer
git commit -m "feat(renderer): persistent enemy squadron targeted by fire and hit animations"
```

---

### Task 4: Docs and final pass

**Files:**
- Modify: `CLAUDE.md` (repo), `README.md`

- [ ] **Step 1: Docs**

In `CLAUDE.md` renderer bullet, add: "Sprite art is Kenney's CC0 Space Shooter Redux under `public/sprites/` (manifest in `renderer/spriteManifest.ts`, loaded by `assets.ts`). Enemies live in a `SquadronModel` (pure, tested) rendered by `SquadronView`; animations take members from it rather than spawning." In `README.md` add a "Credits" line pointing at `public/sprites/CREDITS.md`.

- [ ] **Step 2: Full verification**

`npm test`, `npx tsc -b`, `npm run build`, and one full replay in the browser at speed 16 from start to the result overlay; screenshot `squadron-04-result.png`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: sprite credits and squadron notes"
```

---

## Self-review

**Spec coverage.** Art table → Task 1 (manifest, world, animations tint/laser, damage overlays). Squadron model and numbers → Task 2. View, fire/hit/malfunction rewiring, fast spawn on empty, explosion scaling → Task 3. Testing section → Tasks 1 and 2 tests, browser passes in 1, 3, 4. Out of scope untouched.

**Placeholders.** None. The one visual unknown (flame rotation sign) has an explicit check-and-flip instruction.

**Type consistency.** `sprite()`, `ENEMY_SCALE`, `ENEMY_TEXTURE`, `FACE_RIGHT`, `SHIP_SCALE` move to `spriteUtils.ts` in Task 3 and are re-exported from `world.ts`, so Task 1's and Task 3's imports both resolve. `World.shieldRing` is a `Sprite` at scale 0.6 in Task 1; Task 3's animations use 0.6 as the base scale. `laser(world, kind)` and `dot(world, r, color)` are defined in Task 1 and used in Task 3. `SquadronModel.anchor/spawn/freeSlot/takeNearest/takeAny/pick/update` match between Tasks 2 and 3.
