import { Text } from "pixi.js";
import { easeOut, tween } from "./tween";
import type { World } from "./world";

export const CALLOUT_COLORS = { mine: 0x38bdf8, charged: 0xfbbf24, theirs: 0xf43f5e } as const;
const LIFETIME_MS = 1500;
const RISE_PX = 24;

/** Floating label at an action. Fire-and-forget: never awaited by the action queue. */
export function callout(world: World, x: number, y: number, text: string, color: number, sizeFactor = 1): void {
  const fontSize = Math.max(11, Math.min(20, Math.round(16 * sizeFactor)));
  const label = new Text({
    text,
    style: {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      fontSize,
      fontWeight: "800",
      fill: color,
      stroke: { color: 0x05060f, width: 4 },
      letterSpacing: 1,
    },
  });
  label.anchor.set(0.5, 1);
  label.position.set(x, y);
  world.effects.addChild(label);
  void tween(world.app.ticker, LIFETIME_MS, (p) => {
    label.y = y - RISE_PX * easeOut(p);
    label.alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  }).then(() => label.destroy());
}
