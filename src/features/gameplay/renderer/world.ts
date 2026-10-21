import { Application, Container, FillGradient, Graphics, Rectangle, Texture, type Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import { buildBackdrop, type Backdrop } from "./backdrop";
import { makeBloom, makeGlow } from "./fx";
import type { Quality } from "./quality";
import { stripFrames } from "./fxMath";
import { EXPLOSION_FRAMES, type SpriteKey } from "./spriteManifest";
import { FACE_RIGHT, SHIP_SCALE, sprite } from "./spriteUtils";
import { SquadronModel } from "./squadron";
import { SquadronView } from "./squadronView";

export { ENEMY_SCALE, ENEMY_TEXTURE, FACE_RIGHT, SHIP_SCALE, sprite } from "./spriteUtils";

export type World = {
  app: Application;
  width: number;
  height: number;
  tex: SpriteTextures;
  /** Explosion strip cut into frames, flash first. */
  explosionFrames: Texture[];
  quality: Quality;
  backdrop: Backdrop;
  farStars: Container;
  farRocks: Container;
  nearStars: Container;
  nearRocks: Container;
  enemyLane: Container;
  shipLayer: Container;
  effects: Container;
  overlay: Container;
  flame: Sprite;
  /** Full-screen red vignette; its alpha is driven toward vignetteTarget. */
  vignette: Container;
  vignetteTarget: number;
  ship: Container;
  shipBase: { x: number; y: number };
  shipBody: Sprite;
  damage: [Sprite, Sprite, Sprite];
  shieldRing: Sprite;
  /** Live shield alpha (shield / SHIELD_MAX), set by syncState; animations read it instead of caching. */
  shieldAlpha: number;
  stars: { g: Graphics; speed: number }[];
  rocks: { g: Sprite; speed: number; spin: number }[];
  squadron: SquadronModel;
  squadronView: SquadronView;
};

/** Base scale of the engine flame; the idle flicker jitters around it. */
export const FLAME_SCALE = 0.7;

export const COLORS = {
  star: 0xffffff,
  ember: 0xf97316,
  gold: 0xfbbf24,
  ship: 0x38bdf8,
  flash: 0xffffff,
};

const METEOR_KEYS: SpriteKey[] = ["meteorBig1", "meteorBig2", "meteorBig3", "meteorBig4", "meteorMed1", "meteorMed2"];

function makeShip(tex: SpriteTextures) {
  const ship = new Container();
  // The flame trails behind the ship (to the left). If it visibly points the wrong way, flip the sign of its rotation.
  const flame = sprite(tex.flame, FLAME_SCALE, -FACE_RIGHT);
  flame.x = -36;
  flame.blendMode = "add";
  const body = sprite(tex.ship, SHIP_SCALE);
  const damage = ([1, 2, 3] as const).map((i) => {
    const d = sprite(tex[`shipDamage${i}`], SHIP_SCALE);
    d.alpha = 0;
    return d;
  }) as [Sprite, Sprite, Sprite];
  const shieldRing = sprite(tex.shield, SHIP_SCALE);
  shieldRing.alpha = 0;
  shieldRing.blendMode = "add";
  ship.addChild(flame, body, ...damage, shieldRing);
  return { ship, flame, body, damage, shieldRing };
}

function makeStars(layer: Container, width: number, height: number, count: number, rMin: number, rMax: number, aMin: number, aMax: number, sMin: number, sMax: number) {
  return Array.from({ length: count }, () => {
    const g = new Graphics().circle(0, 0, rMin + Math.random() * (rMax - rMin)).fill({ color: COLORS.star, alpha: aMin + Math.random() * (aMax - aMin) });
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    layer.addChild(g);
    return { g, speed: sMin + Math.random() * (sMax - sMin) };
  });
}

function makeRocks(layer: Container, tex: SpriteTextures, width: number, height: number, count: number, scaleMin: number, scaleMax: number, alpha: number, sMin: number, sMax: number, spinScale: number) {
  return Array.from({ length: count }, () => {
    const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)];
    const g = sprite(tex[key], scaleMin + Math.random() * (scaleMax - scaleMin), Math.random() * Math.PI * 2);
    g.alpha = alpha;
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    layer.addChild(g);
    return { g, speed: sMin + Math.random() * (sMax - sMin), spin: (Math.random() - 0.5) * 0.02 * spinScale };
  });
}

export function buildWorld(app: Application, tex: SpriteTextures, quality: Quality): World {
  const width = app.screen.width;
  const height = app.screen.height;

  const backdropLayer = new Container();
  const farStars = new Container();
  const farRocks = new Container();
  const nearStars = new Container();
  const nearRocks = new Container();
  const enemyLane = new Container();
  const shipLayer = new Container();
  const effects = new Container();
  const overlay = new Container();
  app.stage.addChild(backdropLayer, farStars, farRocks, nearStars, nearRocks, enemyLane, shipLayer, effects, overlay);

  const strip = tex.explosion;
  const explosionFrames = stripFrames(strip.width, strip.height, EXPLOSION_FRAMES).map(
    (f) => new Texture({ source: strip.source, frame: new Rectangle(f.x, f.y, f.width, f.height) }),
  );

  const backdrop = buildBackdrop(tex.bgGalaxy, width, height);
  backdropLayer.addChild(backdrop.sprite);

  const stars = [
    ...makeStars(farStars, width, height, 120, 0.4, 1.0, 0.25, 0.5, 0.08, 0.25),
    ...makeStars(nearStars, width, height, 40, 0.8, 1.8, 0.6, 1.0, 0.5, 1.4),
  ];
  const rocks = [
    ...makeRocks(farRocks, tex, width, height, 4, 0.2, 0.35, 0.45, 0.2, 0.4, 0.4),
    ...makeRocks(nearRocks, tex, width, height, 6, 0.45, 0.85, 0.9, 0.6, 1.6, 1),
  ];

  const { ship, flame, body, damage, shieldRing } = makeShip(tex);
  if (quality === "high") {
    effects.filters = [makeBloom()];
    shieldRing.filters = [makeGlow()];
  }
  const shipBase = { x: width * 0.2, y: height / 2 };
  ship.position.set(shipBase.x, shipBase.y);
  shipLayer.addChild(ship);

  const squadron = new SquadronModel({ width, height });
  const squadronView = new SquadronView(squadron, enemyLane, tex);
  squadronView.sync();

  // Edge vignette: four linear-gradient bands (red at the frame edge, transparent inward) so
  // the centre stays clear. Radial FillGradients rendered a solid wash here. Alpha is animated
  // on the container elsewhere; starts hidden.
  const vignette = new Container();
  const band = (x: number, y: number, w: number, h: number, vertical: boolean, edgeFirst: boolean): Graphics => {
    const edge = "rgba(255,45,45,1)";
    const clear = "rgba(255,45,45,0)";
    const fill = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: vertical ? { x: 0, y: 1 } : { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: edgeFirst ? edge : clear },
        { offset: 1, color: edgeFirst ? clear : edge },
      ],
      textureSpace: "local",
    });
    return new Graphics().rect(x, y, w, h).fill(fill);
  };
  const bandH = height * 0.28;
  const bandW = width * 0.28;
  vignette.addChild(
    band(0, 0, width, bandH, true, true),
    band(0, height - bandH, width, bandH, true, false),
    band(0, 0, bandW, height, false, true),
    band(width - bandW, 0, bandW, height, false, false),
  );
  vignette.alpha = 0;
  overlay.addChild(vignette);

  return { app, width, height, tex, explosionFrames, quality, backdrop, farStars, farRocks, nearStars, nearRocks, enemyLane, shipLayer, effects, overlay, flame, vignette, vignetteTarget: 0, ship, shipBase, shipBody: body, damage, shieldRing, shieldAlpha: 0, stars, rocks, squadron, squadronView };
}

export type LaserKind = "mine" | "charged" | "theirs";

export function laser(world: World, kind: LaserKind): Sprite {
  const key: SpriteKey = kind === "mine" ? "laserMine" : kind === "charged" ? "laserCharged" : "laserTheirs";
  const s = sprite(world.tex[key], kind === "charged" ? 1.1 : 0.8);
  s.blendMode = "add";
  world.effects.addChild(s);
  return s;
}

export function dot(world: World, radius: number, color: number): Graphics {
  const g = new Graphics().circle(0, 0, radius).fill(color);
  g.blendMode = "add";
  world.effects.addChild(g);
  return g;
}
