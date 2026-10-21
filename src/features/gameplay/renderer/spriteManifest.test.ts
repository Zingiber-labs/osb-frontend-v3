/// <reference types="node" />
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
