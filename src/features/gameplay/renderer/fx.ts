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
  if (world.quality !== "high") return { update() {}, destroy() {} };
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
  const sx = source.scale.x;
  const sy = source.scale.y;
  ghost.scale.set(sx, sy);
  ghost.rotation = source.rotation;
  ghost.position.copyFrom(source.position);
  ghost.tint = 0xffffff;
  ghost.blendMode = "add";
  world.effects.addChild(ghost);
  void tween(world.app.ticker, ms, (t) => {
    ghost.alpha = 1 - t;
    ghost.scale.set(sx * (1 + t * 0.3), sy * (1 + t * 0.3));
  }).then(() => ghost.destroy());
}
