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

/** Random jitter scaled by (1 - t); rnd in [0, 1). */
export function shakeOffset(t: number, amplitude: number, rnd: () => number = Math.random): { x: number; y: number } {
  const k = Math.max(0, 1 - t) * amplitude;
  if (k === 0) return { x: 0, y: 0 };
  return { x: (rnd() * 2 - 1) * k, y: (rnd() * 2 - 1) * k };
}
