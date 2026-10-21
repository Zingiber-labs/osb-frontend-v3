import { describe, expect, it } from "vitest";
import { TrailBuffer, shakeOffset } from "./fxMath";

describe("TrailBuffer", () => {
  it("keeps the last N samples oldest first", () => {
    const b = new TrailBuffer(3);
    b.push(1, 1); b.push(2, 2); b.push(3, 3); b.push(4, 4);
    expect(b.samples()).toEqual([{ x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }]);
  });
  it("returns fewer samples before it fills", () => {
    const b = new TrailBuffer(3);
    b.push(1, 1);
    expect(b.samples()).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("shakeOffset", () => {
  it("decays to zero at t = 1 and never exceeds the amplitude", () => {
    const rnd = () => 1; // worst case
    expect(shakeOffset(1, 10, rnd)).toEqual({ x: 0, y: 0 });
    for (const t of [0, 0.25, 0.5, 0.75]) {
      const o = shakeOffset(t, 10, rnd);
      expect(Math.abs(o.x)).toBeLessThanOrEqual(10);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(10);
    }
    expect(shakeOffset(0, 10, () => 0)).toEqual({ x: -10, y: -10 });
  });
});
