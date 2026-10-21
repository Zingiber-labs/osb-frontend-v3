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

  async mount(canvas: HTMLCanvasElement): Promise<void> {
    const app = new Application();
    await app.init({
      canvas,
      resizeTo: canvas.parentElement ?? undefined,
      background: 0x05060f,
      antialias: true,
    });
    const world = buildWorld(app);
    this.app = app;
    this.world = world;
    this.queue = new ActionQueue((action) => runAnimation(world, action));
    app.ticker.add(this.idle);
  }

  destroy(): void {
    this.queue?.clear();
    this.queue = null;
    this.world = null;
    if (this.app) {
      this.app.ticker.remove(this.idle);
      this.app.destroy({ removeView: false }, { children: true });
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
