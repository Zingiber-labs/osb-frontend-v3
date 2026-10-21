export class TrailBuffer {
  private readonly size: number;
  private readonly buf: { x: number; y: number }[] = [];
  constructor(size: number) {
    this.size = size;
  }
  push(x: number, y: number): void {
    this.buf.push({ x, y });
    if (this.buf.length > this.size) this.buf.shift();
  }
  samples(): { x: number; y: number }[] {
    return [...this.buf];
  }
}

export type FrameRect = { x: number; y: number; width: number; height: number };

/** Equal-width frame rectangles across a horizontal strip, left to right. */
export function stripFrames(width: number, height: number, count: number): FrameRect[] {
  const w = width / count;
  return Array.from({ length: count }, (_, i) => ({ x: i * w, y: 0, width: w, height }));
}

/** Frame index for progress t in [0, 1]; the last frame holds at t = 1. */
export function frameAt(t: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(t * count)));
}

/** Random jitter scaled by (1 - t); rnd in [0, 1). */
export function shakeOffset(t: number, amplitude: number, rnd: () => number = Math.random): { x: number; y: number } {
  const k = Math.max(0, 1 - t) * amplitude;
  if (k === 0) return { x: 0, y: 0 };
  return { x: (rnd() * 2 - 1) * k, y: (rnd() * 2 - 1) * k };
}
