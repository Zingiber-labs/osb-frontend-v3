import { Application, type Ticker } from "pixi.js";
import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import type { ScenarioState, ShipAction } from "@/features/gameplay/engine/types";
import { ActionQueue } from "./ActionQueue";
import { runAnimation } from "./animations";
import type { RendererPort } from "./RendererPort";
import { buildWorld, type World } from "./world";

export class ScenarioRenderer implements RendererPort {
  private app: Application | null = null;
  private world: World | null = null;
  private queue: ActionQueue | null = null;
  // Guards against destroy() running while mount() is still awaiting app.init.
  private mountId = 0;

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
    const world = buildWorld(app);
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
    this.world = null;
    if (this.app) {
      this.app.ticker.remove(this.idle);
      this.app.destroy({ removeView: true }, { children: true });
      this.app = null;
    }
  }

  enqueue(actions: ShipAction[]): void {
    this.queue?.enqueue(actions);
  }

  syncState(state: ScenarioState): void {
    if (!this.world) return;
    this.world.shieldRing.alpha = state.shield / SHIELD_MAX;
    this.world.smoke.alpha = Math.min(0.9, 1 - state.hull / HULL_MAX);
  }

  private idle = (ticker: Ticker): void => {
    const world = this.world;
    if (!world) return;
    const dt = ticker.deltaTime;
    for (const star of world.stars) {
      star.g.x -= star.speed * dt;
      if (star.g.x < -2) {
        star.g.x = world.width + 2;
        star.g.y = Math.random() * world.height;
      }
    }
    for (const rock of world.rocks) {
      rock.g.x -= rock.speed * dt;
      rock.g.rotation += rock.spin * dt;
      if (rock.g.x < -40) {
        rock.g.x = world.width + 40;
        rock.g.y = Math.random() * world.height;
      }
    }
  };
}
