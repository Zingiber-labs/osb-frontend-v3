import { Application, Container, Graphics } from "pixi.js";
import type { EnemySize } from "@/features/gameplay/engine/types";

export type World = {
  app: Application;
  width: number;
  height: number;
  starfield: Container;
  meteorites: Container;
  enemyLane: Container;
  shipLayer: Container;
  effects: Container;
  ship: Container;
  shipBase: { x: number; y: number };
  shieldRing: Graphics;
  smoke: Graphics;
  stars: { g: Graphics; speed: number }[];
  rocks: { g: Graphics; speed: number; spin: number }[];
};

const COLORS = {
  ship: 0x38bdf8,
  shield: 0x22d3ee,
  enemy: 0xf43f5e,
  bullet: 0xfde047,
  enemyBullet: 0xfb7185,
  star: 0xffffff,
  rock: 0x64748b,
  gold: 0xfbbf24,
};

export const ENEMY_RADIUS: Record<EnemySize, number> = { scout: 12, fighter: 20, cruiser: 32 };

function makeShip(): Container {
  const ship = new Container();
  const hull = new Graphics().poly([-22, -14, 26, 0, -22, 14, -12, 0]).fill(COLORS.ship);
  const flame = new Graphics().poly([-22, -5, -36, 0, -22, 5]).fill(0xf97316);
  ship.addChild(flame, hull);
  return ship;
}

export function buildWorld(app: Application): World {
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
    const r = 8 + Math.random() * 14;
    const pts: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      const rr = r * (0.7 + Math.random() * 0.3);
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const g = new Graphics().poly(pts).fill(COLORS.rock);
    g.x = Math.random() * width;
    g.y = Math.random() * height;
    meteorites.addChild(g);
    return { g, speed: 0.6 + Math.random() * 1.0, spin: (Math.random() - 0.5) * 0.02 };
  });

  const ship = makeShip();
  const shipBase = { x: width * 0.2, y: height / 2 };
  ship.position.set(shipBase.x, shipBase.y);

  const shieldRing = new Graphics().circle(0, 0, 40).stroke({ width: 3, color: COLORS.shield });
  shieldRing.alpha = 0;
  ship.addChild(shieldRing);

  const smoke = new Graphics().circle(-10, 0, 14).fill({ color: 0x475569 });
  smoke.alpha = 0;
  ship.addChild(smoke);

  shipLayer.addChild(ship);

  return { app, width, height, starfield, meteorites, enemyLane, shipLayer, effects, ship, shipBase, shieldRing, smoke, stars, rocks };
}

export function spawnEnemy(world: World, size: EnemySize): Graphics {
  const r = ENEMY_RADIUS[size];
  const enemy = new Graphics().poly([r, 0, -r, -r * 0.8, -r * 0.5, 0, -r, r * 0.8]).fill(COLORS.enemy);
  enemy.x = world.width * 0.8;
  enemy.y = world.height / 2 + (Math.random() - 0.5) * world.height * 0.4;
  world.enemyLane.addChild(enemy);
  return enemy;
}

export function bullet(world: World, radius: number, color = COLORS.bullet): Graphics {
  const b = new Graphics().circle(0, 0, radius).fill(color);
  world.effects.addChild(b);
  return b;
}

export { COLORS };
