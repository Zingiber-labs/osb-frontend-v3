import { Sprite, type Texture } from "pixi.js";
import type { EnemySize } from "../engine/types";
import type { SpriteKey } from "./spriteManifest";

/** Generated art is stored at 2x; these are the base scales at depth FOCAL (projection scale 1). */
export const SHIP_SCALE = 0.5;
export const PLANET_SCALE = 0.5;
export const ENEMY_SCALE: Record<EnemySize, number> = { scout: 0.5, fighter: 0.6, cruiser: 0.7 };
export const ENEMY_TEXTURE: Record<EnemySize, SpriteKey> = { scout: "enemyScout", fighter: "enemyFighter", cruiser: "enemyCruiser" };

/** Centred sprite, stored orientation. */
export function sprite(tex: Texture, scale = 1): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.scale.set(scale);
  return s;
}

/** Rotates an up-pointing sprite (bolt) so it points from `from` toward `to` on screen. */
export function aimAlong(s: Sprite, from: { x: number; y: number }, to: { x: number; y: number }): void {
  s.rotation = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;
}
