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
