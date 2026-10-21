import { Graphics, Sprite } from "pixi.js";
import type { EnemySize, ShipAction } from "@/features/gameplay/engine/types";
import { shake, trail, whiteFlash } from "./fx";
import { callout, CALLOUT_COLORS } from "./callout";
import { frameAt } from "./fxMath";
import { COLORS, dot, laser, SHIP_SCALE, type World } from "./world";
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

/** Explosion frame strip on screen = 112 px at scale 1; the fireball reads best a little under that. */
const EXPLOSION_SCALE = 0.85;

/** Explosion: frame strip plus a white flash, ember ring and radial particles. Runs for `ms`. */
async function burst(world: World, x: number, y: number, scale: number, ms: number) {
  const frames = world.explosionFrames;
  const fire = new Sprite(frames[0]);
  fire.anchor.set(0.5);
  fire.scale.set(EXPLOSION_SCALE * scale);
  fire.rotation = Math.random() * Math.PI * 2;
  // Normal blending: additive plus bloom washed the fireball out to a white disc.
  fire.position.set(x, y);
  world.effects.addChild(fire);
  const flash = dot(world, 6 * scale, COLORS.flash);
  flash.position.set(x, y);
  const ring = new Graphics().circle(0, 0, 10 * scale).stroke({ width: 3, color: COLORS.ember });
  ring.blendMode = "add";
  ring.position.set(x, y);
  world.effects.addChild(ring);
  const parts = Array.from({ length: 12 }, (_, i) => {
    const p = dot(world, 2 * scale, i % 2 ? COLORS.ember : COLORS.gold);
    p.position.set(x, y);
    const a = (i / 12) * Math.PI * 2;
    return { p, dx: Math.cos(a) * 60 * scale, dy: Math.sin(a) * 60 * scale };
  });
  await tween(world.app.ticker, ms, (t) => {
    fire.texture = frames[frameAt(t, frames.length)];
    flash.scale.set(1 + t * 2.5);
    flash.alpha = Math.max(0, 1 - t * 3);
    ring.scale.set(1 + t * 5);
    ring.alpha = 1 - t;
    for (const { p, dx, dy } of parts) {
      p.x = x + dx * easeOut(t);
      p.y = y + dy * easeOut(t);
      p.alpha = 1 - t;
    }
  });
  fire.destroy();
  flash.destroy();
  ring.destroy();
  for (const { p } of parts) p.destroy();
}

async function fire(world: World, size: EnemySize, charged: boolean, caption?: string) {
  const { app, ship, squadron, squadronView } = world;
  let member = squadron.takeNearest(ship.x, ship.y);
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeNearest(ship.x, ship.y)!;
  }
  // Invariant: the model was just synced, so the member's sprite exists.
  const enemy = squadronView.detach(member.id)!;
  const dest = squadron.anchor(member.slot);
  const fromX = enemy.x;
  const fromY = enemy.y;
  const shot = laser(world, charged ? "charged" : "mine");
  const tr = trail(world, charged ? "laserCharged" : "laserMine", charged ? 1.1 : 0.8);
  const travel = DURATION.fire * 0.6;
  await tween(app.ticker, travel, (t) => {
    // A freshly spawned target is still flying in; bring it to its anchor during the shot's flight.
    enemy.x = lerp(fromX, dest.x, t);
    enemy.y = lerp(fromY, dest.y, t);
    shot.x = lerp(ship.x + 48, enemy.x, t);
    shot.y = lerp(ship.y, enemy.y, t);
    tr.update(shot.x, shot.y);
  });
  shot.destroy();
  tr.destroy();
  whiteFlash(world, enemy);
  shake(world, size === "cruiser" ? 3 : 2, 150);
  if (caption) callout(world, enemy.x, enemy.y - 30, caption, charged ? CALLOUT_COLORS.charged : CALLOUT_COLORS.mine);
  const base = enemy.scale.x;
  const burstDone = burst(world, enemy.x, enemy.y, BURST_SCALE[size] * (charged ? 1.3 : 1), DURATION.fire - travel);
  await tween(app.ticker, (DURATION.fire - travel) * 0.5, (t) => {
    enemy.scale.set(base * (1 + t * 0.6));
    enemy.alpha = 1 - t;
  });
  enemy.destroy();
  await burstDone;
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean, caption?: string) {
  const { app, ship, shipBody, shieldRing, shipBase, squadron, squadronView } = world;
  const source = squadron.pick();
  const from = (source && squadronView.positionOf(source.id)) ?? { x: world.width * 0.85, y: ship.y + (Math.random() - 0.5) * 80 };
  const shot = laser(world, "theirs");
  shot.scale.set(0.6 + points * 0.15);
  const tr = trail(world, "laserTheirs", 0.6 + points * 0.15);
  const travel = DURATION.hit * 0.6;
  await tween(app.ticker, travel, (t) => {
    shot.x = lerp(from.x - 30, ship.x + 20, t);
    shot.y = lerp(from.y, ship.y, t);
    tr.update(shot.x, shot.y);
  });
  shot.destroy();
  tr.destroy();
  if (caption) callout(world, ship.x + 70, ship.y - 30, caption, CALLOUT_COLORS.theirs);
  if (absorbed) {
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, world.shieldAlpha, t);
      shieldRing.scale.set(SHIP_SCALE * (1 + (1 - t) * 0.2));
    });
    shieldRing.scale.set(SHIP_SCALE);
    shieldRing.alpha = world.shieldAlpha;
    return;
  }
  const amplitude = points * 3;
  shake(world, amplitude, 250);
  const overlay = world.damage.find((d) => d.alpha > 0);
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = shipBase.x + Math.sin(t * 40) * amplitude * (1 - t);
    shipBody.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
    if (overlay) overlay.tint = shipBody.tint;
  });
  ship.x = shipBase.x;
  shipBody.tint = 0xffffff;
  if (overlay) overlay.tint = 0xffffff;
}

async function shieldUp(world: World, caption?: string) {
  const { app, shieldRing } = world;
  if (caption) callout(world, world.ship.x, world.ship.y - 50, caption, CALLOUT_COLORS.mine);
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const grow = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(SHIP_SCALE * grow);
    // The pulse stays visible even when the state alpha is 0; the live alpha wins once it is higher.
    const pulse = t < 0.5 ? t * 2 : 2 - t * 2;
    shieldRing.alpha = Math.max(world.shieldAlpha, pulse);
  });
  shieldRing.scale.set(SHIP_SCALE);
  shieldRing.alpha = world.shieldAlpha;
}

async function fizzle(world: World, caption?: string) {
  const { app, ship } = world;
  if (caption) callout(world, ship.x + 40 + world.width * 0.12, ship.y - 20, caption, CALLOUT_COLORS.theirs);
  const shot = laser(world, "mine");
  await tween(app.ticker, DURATION.fizzle, (t) => {
    shot.x = ship.x + 48 + t * world.width * 0.25;
    shot.y = ship.y + Math.sin(t * 12) * 6;
    shot.alpha = 1 - easeOut(t);
  });
  shot.destroy();
}

async function stall(world: World, caption?: string) {
  const { app, ship, shipBase } = world;
  if (caption) callout(world, ship.x, ship.y - 50, caption, CALLOUT_COLORS.mine);
  await tween(app.ticker, DURATION.stall, (t) => {
    ship.rotation = Math.PI * 2 * easeOut(t);
    ship.x = shipBase.x - 20 * Math.sin(t * Math.PI);
  });
  ship.rotation = 0;
  ship.x = shipBase.x;
}

async function enemyMalfunction(world: World, caption?: string) {
  const { squadron, squadronView } = world;
  let member = squadron.takeAny();
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeAny()!;
  }
  // Invariant: the model was just synced, so the member's sprite exists.
  const enemy = squadronView.detach(member.id)!;
  if (caption) callout(world, enemy.x, enemy.y - 30, caption, CALLOUT_COLORS.theirs);
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
  shake(world, 8, 600);
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
      return fire(world, action.size, action.charged, action.caption);
    case "hit":
      return hit(world, action.points, action.absorbed, action.caption);
    case "shieldUp":
      return shieldUp(world, action.caption);
    case "fizzle":
      return fizzle(world, action.caption);
    case "stall":
      return stall(world, action.caption);
    case "enemyMalfunction":
      return enemyMalfunction(world, action.caption);
    case "objectiveComplete":
      return objectiveComplete(world);
    case "warpOut":
      return warpOut(world);
    case "explode":
      return explode(world);
  }
}
