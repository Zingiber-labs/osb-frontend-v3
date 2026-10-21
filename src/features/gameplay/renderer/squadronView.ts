import type { Container, Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import type { SquadronModel } from "./squadron";
import { ENEMY_SCALE, ENEMY_TEXTURE, sprite } from "./spriteUtils";

/** Reconciles SquadronModel members to sprites once per frame. */
export class SquadronView {
  private readonly model: SquadronModel;
  private readonly layer: Container;
  private readonly tex: SpriteTextures;
  private readonly sprites = new Map<number, Sprite>();

  constructor(model: SquadronModel, layer: Container, tex: SpriteTextures) {
    this.model = model;
    this.layer = layer;
    this.tex = tex;
  }

  sync(): void {
    const live = new Set<number>();
    for (const m of this.model.members) {
      live.add(m.id);
      let s = this.sprites.get(m.id);
      if (!s) {
        s = sprite(this.tex[ENEMY_TEXTURE[m.size]], ENEMY_SCALE[m.size]);
        this.layer.addChild(s);
        this.sprites.set(m.id, s);
      }
      s.position.set(m.x, m.y);
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

  positionOf(id: number): { x: number; y: number } | undefined {
    const s = this.sprites.get(id);
    return s ? { x: s.x, y: s.y } : undefined;
  }

  destroy(): void {
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
  }
}
