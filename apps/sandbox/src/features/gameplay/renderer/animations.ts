import { Graphics, Sprite, type Container } from "pixi.js";
import type { EnemySize, ShipAction } from "@/features/gameplay/engine/types";
import { callout, CALLOUT_COLORS } from "./callout";
import { shake, trail, whiteFlash } from "./fx";
import { frameAt } from "./fxMath";
import { CANNONS, lerp3, project, SHIP_WORLD, zIndexFor, type Vec3 } from "./projection";
import { aimAlong } from "./spriteUtils";
import { easeOut, tween } from "./tween";
import { COLORS, dot, laser, type World } from "./world";

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
/** Projection scale of the nearest holding slot (z = 1000); burst sizes are tuned relative to it. */
const DEPTH_REF = 0.4;
/** Explosion frame strip on screen = 112 px at scale 1; the fireball reads best a little under that. */
const EXPLOSION_SCALE = 0.85;
const BOLT_SCALE = { mine: 1.6, charged: 2.0, theirs: 1.2 } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Places a depth-layer sprite at a world point: position, projected scale and sort key. */
function place(world: World, s: Sprite, p: Vec3, baseScale: number): { sx: number; sy: number; scale: number } {
  const pr = project(p, world.view);
  s.position.set(pr.sx, pr.sy);
  s.scale.set(baseScale * pr.scale);
  s.zIndex = zIndexFor(p.z);
  return pr;
}

/** Explosion: frame strip plus a white flash, ember ring and radial particles, scaled for depth. Runs for `ms`. */
async function burst(world: World, x: number, y: number, z: number, scale: number, ms: number, layer: Container = world.depth) {
  const frames = world.explosionFrames;
  const fire = new Sprite(frames[0]);
  fire.anchor.set(0.5);
  fire.scale.set(EXPLOSION_SCALE * scale);
  fire.rotation = Math.random() * Math.PI * 2;
  // Normal blending: additive plus bloom washed the fireball out to a white disc.
  fire.position.set(x, y);
  fire.zIndex = zIndexFor(z) + 1;
  layer.addChild(fire);
  const flash = dot(world, 6 * scale, COLORS.flash, layer);
  flash.position.set(x, y);
  flash.zIndex = fire.zIndex;
  const ring = new Graphics().circle(0, 0, 10 * scale).stroke({ width: 3, color: COLORS.ember });
  ring.blendMode = "add";
  ring.position.set(x, y);
  ring.zIndex = fire.zIndex;
  layer.addChild(ring);
  const parts = Array.from({ length: 12 }, (_, i) => {
    const p = dot(world, 2 * scale, i % 2 ? COLORS.ember : COLORS.gold, layer);
    p.position.set(x, y);
    p.zIndex = fire.zIndex;
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
  const { app, squadron, squadronView, reticle } = world;
  let member = squadron.takeNearest(reticle.root.x, reticle.root.y);
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeNearest(reticle.root.x, reticle.root.y)!;
  }
  // Invariant: the model was just synced, so the member's sprite exists.
  const enemy = squadronView.detach(member.id)!;
  const base = enemy.scale.x / project(member, world.view).scale;
  const from: Vec3 = { x: member.x, y: member.y, z: member.z };
  const dest = squadron.anchor(member.slot);
  const kind = charged ? "charged" : "mine";
  const key = charged ? "laserCharged" : "laserMine";
  const shots = CANNONS.map((c) => ({ shot: laser(world, kind), tr: trail(world, key, BOLT_SCALE[kind]), from: c }));
  const aimP = project(from, world.view);
  const aim = reticle.aimAt(aimP.sx, aimP.sy);
  const travel = DURATION.fire * 0.6;
  let target = from;
  await tween(app.ticker, travel, (t) => {
    // A freshly spawned target is still flying in; bring it to its anchor during the shot's flight.
    target = lerp3(from, dest, t);
    const tp = place(world, enemy, target, base);
    for (const { shot, tr, from: c } of shots) {
      const p = lerp3(c, target, easeOut(t));
      const pr = place(world, shot, p, BOLT_SCALE[kind]);
      aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: tp.sx, y: tp.sy });
      tr.update(pr.sx, pr.sy);
    }
  });
  await aim;
  for (const { shot, tr } of shots) {
    shot.destroy();
    tr.destroy();
  }
  whiteFlash(world, enemy);
  shake(world, size === "cruiser" ? 3 : 2, 150);
  const tp = project(target, world.view);
  const depthK = tp.scale / DEPTH_REF;
  if (caption) callout(world, tp.sx, tp.sy - 30 * depthK, caption, charged ? CALLOUT_COLORS.charged : CALLOUT_COLORS.mine, depthK);
  const burstDone = burst(world, tp.sx, tp.sy, target.z, BURST_SCALE[size] * depthK * (charged ? 1.3 : 1), DURATION.fire - travel);
  const s0 = enemy.scale.x;
  await tween(app.ticker, (DURATION.fire - travel) * 0.5, (t) => {
    enemy.scale.set(s0 * (1 + t * 0.6));
    enemy.alpha = 1 - t;
  });
  enemy.destroy();
  void reticle.release();
  await burstDone;
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean, caption?: string) {
  const { app, ship, shipBody, shieldRing, squadron } = world;
  const source = squadron.pick();
  const from: Vec3 = source ? { x: source.x, y: source.y, z: source.z } : { x: (Math.random() - 0.5) * 600, y: -80, z: 1200 };
  const drift = (Math.random() - 0.5) * 120;
  const to: Vec3 = { x: SHIP_WORLD.x + drift * 0.3, y: SHIP_WORLD.y - 20, z: SHIP_WORLD.z + 40 };
  const shot = laser(world, "theirs");
  const scale = BOLT_SCALE.theirs * (0.6 + points * 0.15);
  const tr = trail(world, "laserTheirs", scale);
  const travel = DURATION.hit * 0.6;
  const shipP = project(to, world.view);
  await tween(app.ticker, travel, (t) => {
    const p = lerp3(from, to, t * t);
    p.x += drift * Math.sin(t * Math.PI);
    const pr = place(world, shot, p, scale);
    aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: shipP.sx, y: shipP.sy });
    tr.update(pr.sx, pr.sy);
  });
  shot.destroy();
  tr.destroy();
  if (caption) callout(world, ship.x + 90, ship.y - 70, caption, CALLOUT_COLORS.theirs);
  if (absorbed) {
    const s0 = shieldRing.scale.x;
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, world.shieldAlpha, t);
      shieldRing.scale.set(s0 * (1 + (1 - t) * 0.2));
    });
    shieldRing.scale.set(s0);
    shieldRing.alpha = world.shieldAlpha;
    return;
  }
  const amplitude = points * 3;
  shake(world, amplitude, 250);
  const overlay = world.damage.find((d) => d.alpha > 0);
  const baseX = ship.x;
  const baseY = ship.y;
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = baseX + Math.sin(t * 40) * amplitude * (1 - t);
    ship.y = baseY + Math.sin(t * Math.PI) * amplitude * 1.5;
    shipBody.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
    if (overlay) overlay.tint = shipBody.tint;
  });
  ship.position.set(baseX, baseY);
  shipBody.tint = 0xffffff;
  if (overlay) overlay.tint = 0xffffff;
}

async function shieldUp(world: World, caption?: string) {
  const { app, shieldRing, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 90, caption, CALLOUT_COLORS.mine);
  const s0 = shieldRing.scale.x;
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const grow = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(s0 * grow);
    // The pulse stays visible even when the state alpha is 0; the live alpha wins once it is higher.
    const pulse = t < 0.5 ? t * 2 : 2 - t * 2;
    shieldRing.alpha = Math.max(world.shieldAlpha, pulse);
  });
  shieldRing.scale.set(s0);
  shieldRing.alpha = world.shieldAlpha;
}

async function fizzle(world: World, caption?: string) {
  const { app, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 150, caption, CALLOUT_COLORS.theirs);
  const shot = laser(world, "mine");
  const from = CANNONS[Math.random() < 0.5 ? 0 : 1];
  const to: Vec3 = { x: from.x * 0.5, y: -40, z: 1600 };
  const toP = project(to, world.view);
  await tween(app.ticker, DURATION.fizzle, (t) => {
    const p = lerp3(from, to, easeOut(t) * 0.7);
    p.x += Math.sin(t * 12) * 20;
    const pr = place(world, shot, p, BOLT_SCALE.mine);
    aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: toP.sx, y: toP.sy });
    shot.alpha = 1 - easeOut(t);
  });
  shot.destroy();
}

async function stall(world: World, caption?: string) {
  const { app, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 90, caption, CALLOUT_COLORS.mine);
  const baseX = ship.x;
  await tween(app.ticker, DURATION.stall, (t) => {
    ship.rotation = Math.PI * 2 * easeOut(t);
    ship.x = baseX - 30 * Math.sin(t * Math.PI);
  });
  ship.rotation = 0;
  ship.x = baseX;
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
  const base = enemy.scale.x / project(member, world.view).scale;
  const startP = project(member, world.view);
  if (caption) callout(world, startP.sx, startP.sy - 30, caption, CALLOUT_COLORS.theirs, startP.scale / DEPTH_REF);
  const from: Vec3 = { x: member.x, y: member.y, z: member.z };
  const side = member.x === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(member.x);
  // Tumble toward and past the camera, drifting outward so it leaves at a frame edge, never through the ship.
  const to: Vec3 = { x: side * 900, y: member.y - 300, z: 120 };
  const startRot = enemy.rotation;
  await tween(world.app.ticker, DURATION.enemyMalfunction, (t) => {
    const e = t * t;
    place(world, enemy, lerp3(from, to, e), base);
    enemy.rotation = startRot + t * 6;
    enemy.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
  });
  enemy.destroy();
}

async function objectiveComplete(world: World) {
  const ring = new Graphics().circle(0, 0, 20).stroke({ width: 4, color: COLORS.gold });
  ring.position.set(world.ship.x, world.ship.y);
  world.effects.addChild(ring);
  world.reticle.flash(COLORS.gold);
  await tween(world.app.ticker, DURATION.objectiveComplete, (t) => {
    ring.scale.set(1 + t * 8);
    ring.alpha = 1 - t;
  });
  ring.destroy();
}

async function warpOut(world: World) {
  const { app, ship, starfield, view } = world;
  const x0 = ship.x;
  const y0 = ship.y;
  await tween(app.ticker, DURATION.warpOut, (t) => {
    starfield.warp = 1 + 9 * easeOut(t);
    const e = t * t;
    ship.x = lerp(x0, view.vp.x, e);
    ship.y = lerp(y0, view.vp.y, e);
    ship.scale.set(1 - 0.95 * e);
    ship.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  });
}

async function explode(world: World) {
  const { app, ship } = world;
  shake(world, 8, 600);
  const big = burst(world, ship.x, ship.y, SHIP_WORLD.z, 3, DURATION.explode * 0.6, world.effects);
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
