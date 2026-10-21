import { Graphics } from "pixi.js";
import type { ShipAction } from "@/features/gameplay/engine/types";
import { COLORS, bullet, spawnEnemy, type World } from "./world";
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

async function fire(world: World, size: "scout" | "fighter" | "cruiser", charged: boolean) {
  const { app, ship } = world;
  const enemy = spawnEnemy(world, size);
  const shot = bullet(world, charged ? 7 : 3);
  const travel = DURATION.fire * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(ship.x + 26, enemy.x, t);
    shot.y = lerp(ship.y, enemy.y, t);
  });
  shot.destroy();
  const ring = charged ? new Graphics().circle(0, 0, 10).stroke({ width: 3, color: COLORS.bullet }) : null;
  if (ring) {
    ring.position.set(enemy.x, enemy.y);
    world.effects.addChild(ring);
  }
  await tween(app.ticker, DURATION.fire - travel, (t) => {
    enemy.scale.set(1 + t * (charged ? 1.4 : 0.8));
    enemy.alpha = 1 - t;
    if (ring) {
      ring.scale.set(1 + t * 6);
      ring.alpha = 1 - t;
    }
  });
  ring?.destroy();
  enemy.destroy();
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean) {
  const { app, ship, shieldRing, shipBase } = world;
  const shot = bullet(world, 2 + points, COLORS.enemyBullet);
  const startX = world.width * 0.85;
  const startY = ship.y + (Math.random() - 0.5) * 80;
  const travel = DURATION.hit * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(startX, ship.x, t);
    shot.y = lerp(startY, ship.y, t);
  });
  shot.destroy();
  if (absorbed) {
    const before = shieldRing.alpha;
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, before, t);
      shieldRing.scale.set(1 + (1 - t) * 0.2);
    });
    shieldRing.scale.set(1);
    return;
  }
  const amplitude = points * 3;
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = shipBase.x + Math.sin(t * 40) * amplitude * (1 - t);
    ship.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
  });
  ship.x = shipBase.x;
  ship.tint = 0xffffff;
}

async function shieldUp(world: World) {
  const { app, shieldRing } = world;
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const pulse = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(pulse);
  });
  shieldRing.scale.set(1);
}

async function fizzle(world: World) {
  const { app, ship } = world;
  const shot = bullet(world, 3);
  await tween(app.ticker, DURATION.fizzle, (t) => {
    shot.x = ship.x + 26 + t * world.width * 0.25;
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
  const enemy = spawnEnemy(world, "fighter");
  const startY = enemy.y;
  await tween(world.app.ticker, DURATION.enemyMalfunction, (t) => {
    enemy.y = startY - t * 220;
    enemy.rotation = t * 6;
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
  const parts = Array.from({ length: 12 }, (_, i) => {
    const p = bullet(world, 4, i % 2 ? COLORS.ship : 0xf97316);
    p.position.set(ship.x, ship.y);
    const a = (i / 12) * Math.PI * 2;
    return { p, dx: Math.cos(a) * 160, dy: Math.sin(a) * 160 };
  });
  await tween(app.ticker, DURATION.explode, (t) => {
    ship.alpha = 1 - t;
    ship.scale.set(1 + t);
    for (const { p, dx, dy } of parts) {
      p.x = ship.x + dx * easeOut(t);
      p.y = ship.y + dy * easeOut(t);
      p.alpha = 1 - t;
    }
  });
  for (const { p } of parts) p.destroy();
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
