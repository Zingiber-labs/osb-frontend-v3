import { Sprite, type Texture } from "pixi.js";

export type Backdrop = { sprite: Sprite; pan(dt: number): void };

const SLACK = 0.08;
const PAN_PX_PER_FRAME = 0.04;

/** Cover-fits the galaxy with slack and pans it left/right so an edge never shows. */
export function buildBackdrop(texture: Texture, width: number, height: number): Backdrop {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  const cover = Math.max((width * (1 + SLACK)) / texture.width, (height * (1 + SLACK)) / texture.height);
  sprite.scale.set(cover);
  sprite.alpha = 0.35;
  sprite.tint = 0xa8b4cc;
  const cx = width / 2;
  const cy = height / 2;
  const range = (sprite.width - width) / 2;
  let offset = 0;
  let dir = -1;
  sprite.position.set(cx, cy);
  return {
    sprite,
    pan(dt: number) {
      offset += dir * PAN_PX_PER_FRAME * dt;
      if (offset <= -range) { offset = -range; dir = 1; }
      if (offset >= range) { offset = range; dir = -1; }
      sprite.x = cx + offset;
    },
  };
}
