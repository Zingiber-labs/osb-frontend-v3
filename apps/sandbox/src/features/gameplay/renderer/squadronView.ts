import type { Container, Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import { DEFAULT_VIEW, project, zIndexFor, type View } from "./projection";
import type { SquadronModel } from "./squadron";
import { ENEMY_SCALE, ENEMY_TEXTURE, sprite } from "./spriteUtils";

export type ScreenSpot = { x: number; y: number; scale: number };

/** Reconciles SquadronModel members to projected sprites once per frame. */
export class SquadronView {
  private readonly model: SquadronModel;
  private readonly layer: Container;
  private readonly tex: SpriteTextures;
  private readonly view: View;
  private readonly sprites = new Map<number, Sprite>();

  constructor(model: SquadronModel, layer: Container, tex: SpriteTextures, view: View = DEFAULT_VIEW) {
    this.model = model;
    this.layer = layer;
    this.tex = tex;
    this.view = view;
  }

  sync(): void {
    const live = new Set<number>();
    for (const m of this.model.members) {
      live.add(m.id);
      let s = this.sprites.get(m.id);
      if (!s) {
        s = sprite(this.tex[ENEMY_TEXTURE[m.size]]);
        this.layer.addChild(s);
        this.sprites.set(m.id, s);
      }
      const p = project(m, this.view);
      s.position.set(p.sx, p.sy);
      s.scale.set(ENEMY_SCALE[m.size] * p.scale);
      s.zIndex = zIndexFor(m.z);
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.destroy();
        this.sprites.delete(id);
      }
    }
  }

  /** Hands the sprite to an animation, which now owns and must destroy it. */
  detach(id: number): Sprite | undefined {
    const s = this.sprites.get(id);
    if (s) this.sprites.delete(id);
    return s;
  }

  positionOf(id: number): ScreenSpot | undefined {
    const s = this.sprites.get(id);
    return s ? { x: s.x, y: s.y, scale: s.scale.x } : undefined;
  }

  destroy(): void {
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
  }
}
