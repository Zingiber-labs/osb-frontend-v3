import { describe, expect, it } from "vitest";
import { CANNONS, DEFAULT_VIEW, DESIGN, fitStage, lerp3, project, SHIP_SCREEN, SHIP_WORLD, toWorld, zIndexFor } from "./projection";

describe("project", () => {
  it("draws a point at depth f at native scale around the vanishing point", () => {
    const p = project({ x: 100, y: -50, z: DEFAULT_VIEW.f });
    expect(p).toEqual({ sx: 740, sy: 252, scale: 1 });
  });

  it("halves offsets and scale at twice the depth", () => {
    const p = project({ x: 100, y: -50, z: DEFAULT_VIEW.f * 2 });
    expect(p.sx).toBeCloseTo(690);
    expect(p.sy).toBeCloseTo(277);
    expect(p.scale).toBeCloseTo(0.5);
  });

  it("places the ship world point on the ship screen point", () => {
    const p = project(SHIP_WORLD);
    expect(p.sx).toBeCloseTo(SHIP_SCREEN.x);
    expect(p.sy).toBeCloseTo(SHIP_SCREEN.y);
    expect(p.scale).toBe(1);
    expect(CANNONS[0].z).toBe(SHIP_WORLD.z);
    expect(CANNONS[0].x).toBe(-CANNONS[1].x);
  });

  it("toWorld inverts project", () => {
    const w = { x: -333, y: 87, z: 1234 };
    const p = project(w);
    const back = toWorld(p.sx, p.sy, w.z);
    expect(back.x).toBeCloseTo(w.x);
    expect(back.y).toBeCloseTo(w.y);
    expect(back.z).toBe(w.z);
  });
});

describe("zIndexFor", () => {
  it("gives nearer objects a larger zIndex", () => {
    expect(zIndexFor(100)).toBeGreaterThan(zIndexFor(1000));
    expect(zIndexFor(1000)).toBeGreaterThan(zIndexFor(4000));
  });
});

describe("lerp3", () => {
  it("interpolates every axis", () => {
    expect(lerp3({ x: 0, y: 0, z: 0 }, { x: 10, y: -20, z: 400 }, 0.25)).toEqual({ x: 2.5, y: -5, z: 100 });
  });
});

describe("fitStage", () => {
  it("scales up to cover a larger 16:9 host with no offset", () => {
    expect(fitStage(1920, 1080)).toEqual({ scale: 1.5, x: 0, y: 0 });
  });

  it("covers a wider host by cropping top and bottom equally", () => {
    const f = fitStage(1280, 549);
    expect(f.scale).toBe(1);
    expect(f.x).toBe(0);
    expect(f.y).toBeCloseTo(-85.5);
  });

  it("covers a narrower host by cropping the sides equally", () => {
    expect(fitStage(800, 720)).toEqual({ scale: 1, x: -240, y: 0 });
    expect(DESIGN).toEqual({ width: 1280, height: 720 });
  });
});
