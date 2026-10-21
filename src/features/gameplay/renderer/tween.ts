import type { Ticker } from "pixi.js";

/** Runs `update(t)` with t from 0 to 1 over `ms` milliseconds on the ticker. */
export function tween(ticker: Ticker, ms: number, update: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (tk: Ticker) => {
      elapsed += tk.deltaMS;
      const t = Math.min(1, elapsed / ms);
      update(t);
      if (t >= 1) {
        ticker.remove(tick);
        resolve();
      }
    };
    ticker.add(tick);
  });
}

export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
