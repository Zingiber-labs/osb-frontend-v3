import { describe, expect, it } from "vitest";
import { TrailBuffer, frameAt, shakeOffset, stripFrames } from "./fxMath";

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

describe("stripFrames", () => {
  it("splits a strip into equal left-to-right frames", () => {
    expect(stripFrames(896, 112, 8)).toHaveLength(8);
    expect(stripFrames(896, 112, 8)[0]).toEqual({ x: 0, y: 0, width: 112, height: 112 });
    expect(stripFrames(896, 112, 8)[7]).toEqual({ x: 784, y: 0, width: 112, height: 112 });
  });
});

describe("frameAt", () => {
  it("maps progress to a frame and holds the last frame at t = 1", () => {
    expect(frameAt(0, 8)).toBe(0);
    expect(frameAt(0.5, 8)).toBe(4);
    expect(frameAt(0.999, 8)).toBe(7);
    expect(frameAt(1, 8)).toBe(7);
    expect(frameAt(-0.1, 8)).toBe(0);
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
