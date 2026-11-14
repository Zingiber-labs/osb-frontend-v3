// @vitest-environment node
/// <reference types="node" />
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SPRITE_FILES } from "./spriteManifest";

// The package ships no assets; each host app serves its own copy of the sprites. Resolved from this file, not the cwd.
const SPRITE_DIRS = {
  sandbox: fileURLToPath(new URL("../../../../apps/sandbox/public/sprites", import.meta.url)),
  web: fileURLToPath(new URL("../../../../apps/web/public/sprites", import.meta.url)),
};

describe("sprite manifest", () => {
  for (const [app, dir] of Object.entries(SPRITE_DIRS)) {
    it(`lists only files that exist under apps/${app}/public/sprites`, () => {
      expect(existsSync(dir)).toBe(true);
      const missing = Object.entries(SPRITE_FILES)
        .filter(([, file]) => !existsSync(resolve(dir, file)))
        .map(([key, file]) => `${key} -> ${file}`);
      expect(missing).toEqual([]);
    });
  }

  it("has the roles the renderer needs", () => {
    const keys = Object.keys(SPRITE_FILES);
    for (const k of ["ship", "shipDamage1", "shipDamage2", "shipDamage3", "flame", "planet", "shield", "enemyScout", "enemyFighter", "enemyCruiser", "laserMine", "laserCharged", "laserTheirs", "meteorBig1", "meteorMed1", "explosion"]) {
      expect(keys).toContain(k);
    }
  });
});
