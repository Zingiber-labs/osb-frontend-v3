import { Graphics, type Container } from "pixi.js";
import { DEFAULT_VIEW, project, type View } from "./projection";
import type { StarfieldModel } from "./starfield";

const STAR_COLOR = 0xffffff;
/** How far back along the stream a near star's streak reaches, in ms of travel. */
const STREAK_MS = 45;

/** One Graphics redrawn per frame: dots sized and faded by depth, near stars with motion streaks. */
export class StarfieldView {
  private readonly model: StarfieldModel;
  private readonly view: View;
  private readonly g = new Graphics();

  constructor(model: StarfieldModel, layer: Container, view: View = DEFAULT_VIEW) {
    this.model = model;
    this.view = view;
    // Stars sit behind everything else in the sortable depth layer.
    this.g.zIndex = -1e9;
    layer.addChild(this.g);
  }

  draw(unitsPerMs = 1.1): void {
    const g = this.g;
    g.clear();
    const warp = this.model.warp;
    for (const st of this.model.stars) {
      const p = project(st, this.view);
      const depth = Math.min(1, p.scale * 1.5); // 0 far .. 1 near
      const alpha = 0.2 + depth * 0.8;
      const r = (st.near ? 1.6 : 0.9) * (0.5 + depth);
      if (st.near || warp > 1.5) {
        const back = project({ x: st.x, y: st.y, z: st.z + unitsPerMs * warp * STREAK_MS * st.speed }, this.view);
        g.moveTo(back.sx, back.sy).lineTo(p.sx, p.sy).stroke({ width: r, color: STAR_COLOR, alpha: alpha * 0.7 });
      }
      g.circle(p.sx, p.sy, r).fill({ color: STAR_COLOR, alpha });
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}
