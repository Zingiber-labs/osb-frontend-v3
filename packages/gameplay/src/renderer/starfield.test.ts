import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, DESIGN, project } from "./projection";
import { StarfieldModel } from "./starfield";

const make = (over = {}) => new StarfieldModel({ random: () => 0.5, ...over });

describe("StarfieldModel", () => {
  it("creates far and near stars spread through the depth range", () => {
    const s = make({ far: 10, near: 4 });
    expect(s.stars).toHaveLength(14);
    expect(s.stars.filter((st) => st.near)).toHaveLength(4);
    for (const st of s.stars) {
      expect(st.z).toBeGreaterThanOrEqual(60);
      expect(st.z).toBeLessThanOrEqual(4000);
    }
  });

  it("moves every star toward the camera by unitsPerMs times warp", () => {
    const s = make({ far: 3, near: 0, unitsPerMs: 2 });
    const before = s.stars.map((st) => st.z);
    s.update(10);
    s.stars.forEach((st, i) => expect(st.z).toBeCloseTo(before[i] - 20 * st.speed));
    s.warp = 4;
    const mid = s.stars.map((st) => st.z);
    s.update(10);
    s.stars.forEach((st, i) => expect(st.z).toBeCloseTo(mid[i] - 80 * st.speed));
  });

  it("respawns a star far away once it passes the near plane", () => {
    const s = make({ far: 1, near: 0 });
    const st = s.stars[0];
    st.z = 61;
    s.update(5);
    expect(st.z).toBeGreaterThan(3000);
  });

  it("respawns a star whose projection leaves the design frame", () => {
    const s = make({ far: 1, near: 0 });
    const st = s.stars[0];
    st.x = 2600;
    st.y = 0;
    st.z = 300; // projects 3466 px right of the vanishing point
    expect(project(st, DEFAULT_VIEW).sx).toBeGreaterThan(DESIGN.width);
    s.update(1);
    expect(project(st, DEFAULT_VIEW).sx).toBeLessThanOrEqual(DESIGN.width + 40);
    expect(st.z).toBeGreaterThan(3000);
  });

  it("respawn keeps stars off the exact centre line so they never sit on the vanishing point", () => {
    const s = make({ far: 1, near: 0, random: () => 0.5 });
    const st = s.stars[0];
    s.respawn(st);
    expect(Math.abs(st.x) + Math.abs(st.y)).toBeGreaterThan(0);
  });
});
