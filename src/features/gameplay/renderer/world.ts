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
