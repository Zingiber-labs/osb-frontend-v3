import { Application, type Ticker } from "pixi.js";
import { HULL_MAX, SHIELD_MAX } from "../engine/mapping";
import type { ScenarioState, ShipAction } from "../engine/types";
import { ActionQueue } from "./ActionQueue";
import { runAnimation } from "./animations";
import { loadSprites, type SpriteTextures } from "./assets";
import { project } from "./projection";
import { detectQuality } from "./quality";
import type { RendererPort } from "./RendererPort";
import { applyFit, buildWorld, ENGINE_SCALE, updateRock, type World } from "./world";

const MAX_BANK = 0.12;
const BOB_PX = 4;

export class ScenarioRenderer implements RendererPort {
  private app: Application | null = null;
  private world: World | null = null;
  private queue: ActionQueue | null = null;
  // Guards against destroy() running while mount() is still awaiting app.init.
  private mountId = 0;
  private onResize: (() => void) | null = null;

  /**
   * The renderer owns its canvas: Pixi creates it, mount() appends it to the
   * host and destroy() removes it. The host div belongs to React, so strict-mode
   * remounts never share a WebGL context between two Applications.
   */
  async mount(host: HTMLElement): Promise<void> {
    const id = ++this.mountId;
    const app = new Application();
    await app.init({ resizeTo: host, background: 0x05060f, antialias: true });
    if (id !== this.mountId) {
      // Stale mount: nothing was appended to the host yet.
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    const canvas = app.canvas;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);
    // Measure the host after layout so the world is built at the real size.
    app.resize();
    let tex: SpriteTextures;
    try {
      tex = await loadSprites();
    } catch (err) {
      // A failed load must remove the canvas it already appended.
      app.destroy({ removeView: true }, { children: true });
      throw err;
    }
    if (id !== this.mountId) {
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    const world = buildWorld(app, tex, detectQuality());
    this.onResize = () => applyFit(world);
    app.renderer.on("resize", this.onResize);
    this.app = app;
    this.world = world;
    this.queue = new ActionQueue((action) => runAnimation(world, action));
    app.ticker.add(this.idle);
  }

  destroy(): void {
    this.mountId++;
    // An in-flight animation's tween promise stays pending after destroy by
    // design: the queue is dropped along with it.
    this.queue?.clear();
    this.queue = null;
    this.world?.squadronView.destroy();
    this.world?.starfieldView.destroy();
    this.world?.reticle.destroy();
    this.world = null;
    if (this.app) {
      this.app.ticker.remove(this.idle);
      if (this.onResize) this.app.renderer.off("resize", this.onResize);
      this.onResize = null;
      this.app.destroy({ removeView: true }, { children: true });
      this.app = null;
    }
  }

  enqueue(actions: ShipAction[]): void {
    this.queue?.enqueue(actions);
  }

  whenIdle(): Promise<void> {
    return this.queue ? this.queue.whenIdle() : Promise.resolve();
  }

  syncState(state: ScenarioState): void {
    if (!this.world) return;
    this.world.shieldAlpha = state.shield / SHIELD_MAX;
    this.world.shieldRing.alpha = this.world.shieldAlpha;
    const hullPct = (state.hull / HULL_MAX) * 100;
    const level = hullPct < 25 ? 3 : hullPct < 50 ? 2 : hullPct < 75 ? 1 : 0;
    this.world.damage.forEach((d, i) => {
      d.alpha = i + 1 === level ? 1 : 0;
    });
    this.world.vignetteTarget = hullPct < 25 ? 0.28 : hullPct < 50 ? 0.12 : 0;
  }

  private idle = (ticker: Ticker): void => {
    const world = this.world;
    if (!world) return;
    const dt = ticker.deltaTime;
    const dtMs = ticker.deltaMS;
    const now = performance.now();
    world.backdrop.pan(dt);
    world.planet.x += 0.002 * dt;
    world.starfield.update(dtMs);
    world.starfieldView.draw();
    for (const rock of world.rocks) updateRock(world, rock, dtMs, world.starfield.warp);
    world.squadron.update(dtMs);
    world.squadronView.sync();

    // Bank toward the member a shot would take; bob gently.
    const target = world.squadron.pick();
    const bankTarget = target ? Math.max(-1, Math.min(1, (project(target, world.view).sx - world.width / 2) / (world.width / 2))) * MAX_BANK : 0;
    world.bank += (bankTarget - world.bank) * Math.min(1, 0.08 * dt);
    world.hull.rotation = world.bank;
    world.hull.x = world.bank * 60;
    world.hull.y = Math.sin(now / 900) * BOB_PX;

    world.shieldRing.visible = world.shieldRing.alpha > 0.01;
    for (const e of world.engines) {
      e.scale.set(ENGINE_SCALE * 1.4 * (0.9 + Math.random() * 0.25), ENGINE_SCALE * 0.6 * (0.85 + Math.random() * 0.3));
      e.alpha = 0.8 + Math.random() * 0.2;
    }
    world.vignette.alpha = world.vignetteTarget * (1 + 0.2 * Math.sin((now / 1000) * Math.PI * 2));
  };
}
