import { Container, Graphics, type Ticker } from "pixi.js";
import { RETICLE_HOME } from "./projection";
import { easeOut, tween } from "./tween";

const COLOR = 0x9be7ff;
const IDLE_ALPHA = 0.55;

function crosshair(color: number, gap: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 14).stroke({ width: 1.5, color, alpha: 0.9 });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    g.moveTo(dx * gap, dy * gap).lineTo(dx * (gap + 8), dy * (gap + 8)).stroke({ width: 2, color });
  }
  g.circle(0, 0, 1.5).fill(color);
  return g;
}

/** Screen-space crosshair that snaps to a target before a shot and drifts home afterwards. */
export class Reticle {
  readonly root = new Container();
  private readonly ticker: Ticker;
  private readonly body: Graphics;

  constructor(layer: Container, ticker: Ticker) {
    this.ticker = ticker;
    this.body = crosshair(COLOR, 18);
    this.root.addChild(this.body);
    this.root.position.set(RETICLE_HOME.x, RETICLE_HOME.y);
    this.root.alpha = IDLE_ALPHA;
    layer.addChild(this.root);
  }

  aimAt(x: number, y: number, ms = 180): Promise<void> {
    const sx = this.root.x;
    const sy = this.root.y;
    return tween(this.ticker, ms, (t) => {
      const e = easeOut(t);
      this.root.position.set(sx + (x - sx) * e, sy + (y - sy) * e);
      this.root.scale.set(1 - 0.3 * e);
      this.root.alpha = IDLE_ALPHA + (1 - IDLE_ALPHA) * e;
    });
  }

  release(ms = 400): Promise<void> {
    const sx = this.root.x;
    const sy = this.root.y;
    const s0 = this.root.scale.x;
    return tween(this.ticker, ms, (t) => {
      const e = easeOut(t);
      this.root.position.set(sx + (RETICLE_HOME.x - sx) * e, sy + (RETICLE_HOME.y - sy) * e);
      this.root.scale.set(s0 + (1 - s0) * e);
      this.root.alpha = 1 - (1 - IDLE_ALPHA) * e;
    });
  }

  /** Coloured copy that pops and fades; never awaited. */
  flash(color: number, ms = 500): void {
    const ghost = crosshair(color, 18);
    ghost.position.copyFrom(this.root.position);
    this.root.parent?.addChild(ghost);
    void tween(this.ticker, ms, (t) => {
      ghost.scale.set(1 + t * 1.5);
      ghost.alpha = 1 - t;
    }).then(() => ghost.destroy());
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}
