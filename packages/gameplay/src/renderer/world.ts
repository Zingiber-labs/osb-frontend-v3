import { Application, Container, FillGradient, Graphics, Rectangle, Texture, type Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import { buildBackdrop, type Backdrop } from "./backdrop";
import { makeBloom, makeGlow } from "./fx";
import { stripFrames } from "./fxMath";
import { DEFAULT_VIEW, DESIGN, fitStage, project, SHIP_SCREEN, zIndexFor, type Vec3, type View } from "./projection";
import type { Quality } from "./quality";
import { Reticle } from "./reticle";
import { EXPLOSION_FRAMES, type SpriteKey } from "./spriteManifest";
import { PLANET_SCALE, SHIP_SCALE, sprite } from "./spriteUtils";
import { StarfieldModel } from "./starfield";
import { StarfieldView } from "./starfieldView";
import { SquadronModel } from "./squadron";
import { SquadronView } from "./squadronView";

export { ENEMY_SCALE, ENEMY_TEXTURE, SHIP_SCALE, sprite } from "./spriteUtils";

export type Rock = { g: Sprite; p: Vec3; spin: number; speed: number };

export type World = {
  app: Application;
  view: View;
  width: number;
  height: number;
  tex: SpriteTextures;
  /** Explosion strip cut into frames, flash first. */
  explosionFrames: Texture[];
  quality: Quality;
  root: Container;
  backdrop: Backdrop;
  planet: Sprite;
  depth: Container;
  shipLayer: Container;
  effects: Container;
  overlay: Container;
  ship: Container;
  hull: Container;
  shipBody: Sprite;
  damage: [Sprite, Sprite, Sprite];
  engines: [Sprite, Sprite];
  shieldRing: Sprite;
  /** Live shield alpha (shield / SHIELD_MAX), set by syncState; animations read it instead of caching. */
  shieldAlpha: number;
  bank: number;
  /** Full-screen red vignette; its alpha is driven toward vignetteTarget. */
  vignette: Container;
  vignetteTarget: number;
  starfield: StarfieldModel;
  starfieldView: StarfieldView;
  rocks: Rock[];
  squadron: SquadronModel;
  squadronView: SquadronView;
  reticle: Reticle;
};

export const COLORS = {
  star: 0xffffff,
  ember: 0xf97316,
  gold: 0xfbbf24,
  ship: 0x38bdf8,
  flash: 0xffffff,
};

/** Engine nozzle positions relative to the ship rig, in design px. Measured from ship.png (nozzle glow centroids, offset from the image centre, times SHIP_SCALE). */
export const ENGINE_OFFSETS: [{ x: number; y: number }, { x: number; y: number }] = [
  { x: -42, y: 54 },
  { x: 42, y: 54 },
];
export const ENGINE_SCALE = 0.55;
export const ROCK_Z_NEAR = 80;
export const ROCK_Z_FAR = 4200;
const ROCK_COUNT = 10;
const ROCK_UNITS_PER_MS = 1.1;
const METEOR_KEYS: SpriteKey[] = ["meteorBig1", "meteorBig2", "meteorBig3", "meteorBig4", "meteorMed1", "meteorMed2"];

function makeShip(tex: SpriteTextures) {
  const ship = new Container();
  const hull = new Container();
  const engines = ENGINE_OFFSETS.map((o) => {
    // The flame texture points up; squashed and additive it reads as a nozzle glow facing the camera.
    const e = sprite(tex.flame, ENGINE_SCALE);
    e.scale.set(ENGINE_SCALE * 1.4, ENGINE_SCALE * 0.6);
    e.position.set(o.x, o.y);
    e.blendMode = "add";
    return e;
  }) as [Sprite, Sprite];
  const body = sprite(tex.ship, SHIP_SCALE);
  const damage = ([1, 2, 3] as const).map((i) => {
    const d = sprite(tex[`shipDamage${i}`], SHIP_SCALE);
    d.alpha = 0;
    return d;
  }) as [Sprite, Sprite, Sprite];
  const shieldRing = sprite(tex.shield, SHIP_SCALE * 2.2);
  shieldRing.alpha = 0;
  shieldRing.blendMode = "add";
  hull.addChild(...engines, body, ...damage, shieldRing);
  ship.addChild(hull);
  return { ship, hull, body, damage, engines, shieldRing };
}

export function respawnRock(rock: Rock, z = ROCK_Z_FAR * (0.8 + Math.random() * 0.2)): void {
  // Off the centre line in world units so a rock never crosses the ship or the targets.
  const side = Math.random() < 0.5 ? -1 : 1;
  const vertical = Math.random() < 0.35;
  rock.p = vertical
    ? { x: (Math.random() * 2 - 1) * 1400, y: side * (320 + Math.random() * 500), z }
    : { x: side * (420 + Math.random() * 900), y: (Math.random() * 2 - 1) * 700, z };
  rock.speed = 0.85 + Math.random() * 0.3;
  rock.g.rotation = Math.random() * Math.PI * 2;
}

function makeRocks(world: World): Rock[] {
  return Array.from({ length: ROCK_COUNT }, () => {
    const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)];
    const g = sprite(world.tex[key]);
    g.alpha = 0.95;
    world.depth.addChild(g);
    const rock: Rock = { g, p: { x: 0, y: 0, z: ROCK_Z_FAR }, spin: (Math.random() - 0.5) * 0.02, speed: 1 };
    respawnRock(rock, ROCK_Z_NEAR + Math.random() * (ROCK_Z_FAR - ROCK_Z_NEAR));
    return rock;
  });
}

/** Projects a rock and advances it; respawns past the near plane or outside the frame. */
export function updateRock(world: World, rock: Rock, dtMs: number, warp: number): void {
  rock.p.z -= ROCK_UNITS_PER_MS * warp * rock.speed * dtMs;
  const p = project(rock.p, world.view);
  const m = 160;
  if (rock.p.z < ROCK_Z_NEAR || p.sx < -m || p.sx > world.width + m || p.sy < -m || p.sy > world.height + m) {
    respawnRock(rock);
    return;
  }
  rock.g.position.set(p.sx, p.sy);
  rock.g.scale.set(1.6 * p.scale);
  rock.g.rotation += rock.spin * dtMs * 0.06;
  rock.g.zIndex = zIndexFor(rock.p.z);
}

/** Scales and centres the design frame to cover the host. Call at build and on every resize. */
export function applyFit(world: World): void {
  const fit = fitStage(world.app.screen.width, world.app.screen.height);
  world.root.scale.set(fit.scale);
  world.root.position.set(fit.x, fit.y);
}

export function buildWorld(app: Application, tex: SpriteTextures, quality: Quality): World {
  const view = DEFAULT_VIEW;
  const width = DESIGN.width;
  const height = DESIGN.height;

  const root = new Container();
  const backdropLayer = new Container();
  const planetLayer = new Container();
  const depth = new Container();
  depth.sortableChildren = true;
  const shipLayer = new Container();
  const effects = new Container();
  const overlay = new Container();
  root.addChild(backdropLayer, planetLayer, depth, shipLayer, effects, overlay);
  app.stage.addChild(root);

  const strip = tex.explosion;
  const explosionFrames = stripFrames(strip.width, strip.height, EXPLOSION_FRAMES).map(
    (f) => new Texture({ source: strip.source, frame: new Rectangle(f.x, f.y, f.width, f.height) }),
  );

  const backdrop = buildBackdrop(tex.bgGalaxy, width, height);
  backdropLayer.addChild(backdrop.sprite);

  const planet = sprite(tex.planet, PLANET_SCALE);
  planet.position.set(view.vp.x + 250, view.vp.y - 40);
  planet.alpha = 0.95;
  planetLayer.addChild(planet);

  const { ship, hull, body, damage, engines, shieldRing } = makeShip(tex);
  if (quality === "high") {
    depth.filters = [makeBloom()];
    shieldRing.filters = [makeGlow()];
  }
  ship.position.set(SHIP_SCREEN.x, SHIP_SCREEN.y);
  shipLayer.addChild(ship);

  const starfield = new StarfieldModel({ view });
  const starfieldView = new StarfieldView(starfield, depth, view);

  const squadron = new SquadronModel({ view });
  const squadronView = new SquadronView(squadron, depth, tex, view);
  squadronView.sync();

  const reticle = new Reticle(effects, app.ticker);

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

  const world: World = {
    app, view, width, height, tex, explosionFrames, quality, root, backdrop, planet, depth, shipLayer, effects, overlay,
    ship, hull, shipBody: body, damage, engines, shieldRing, shieldAlpha: 0, bank: 0, vignette, vignetteTarget: 0,
    starfield, starfieldView, rocks: [], squadron, squadronView, reticle,
  };
  world.rocks = makeRocks(world);
  applyFit(world);
  return world;
}

export type LaserKind = "mine" | "charged" | "theirs";

/** A bolt in the depth layer; callers set position, scale, rotation and zIndex every frame. */
export function laser(world: World, kind: LaserKind): Sprite {
  const key: SpriteKey = kind === "mine" ? "laserMine" : kind === "charged" ? "laserCharged" : "laserTheirs";
  const s = sprite(world.tex[key]);
  s.blendMode = "add";
  world.depth.addChild(s);
  return s;
}

export function dot(world: World, radius: number, color: number, layer: Container = world.depth): Graphics {
  const g = new Graphics().circle(0, 0, radius).fill(color);
  g.blendMode = "add";
  layer.addChild(g);
  return g;
}
