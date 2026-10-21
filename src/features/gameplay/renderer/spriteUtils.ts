import { Sprite, type Texture } from "pixi.js";
import type { EnemySize } from "@/features/gameplay/engine/types";
import type { SpriteKey } from "./spriteManifest";

/** Kenney sprites face up (player) or down (enemies); a clockwise quarter turn makes them face along x. */
export const FACE_RIGHT = Math.PI / 2;

export const SHIP_SCALE = 0.75;
export const ENEMY_SCALE: Record<EnemySize, number> = { scout: 0.45, fighter: 0.6, cruiser: 0.8 };
export const ENEMY_TEXTURE: Record<EnemySize, SpriteKey> = { scout: "enemyScout", fighter: "enemyFighter", cruiser: "enemyCruiser" };

export function sprite(tex: Texture, scale = 1, rotation = FACE_RIGHT): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.scale.set(scale);
  s.rotation = rotation;
  return s;
}
