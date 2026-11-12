import { describe, expect, it } from "vitest";
import { project } from "./projection";
import { ENTER_Z, SquadronModel } from "./squadron";

const make = (over = {}) => new SquadronModel({ random: () => 0, ...over });
const screenOf = (s: SquadronModel, slot: number) => project(s.anchor(slot));

describe("SquadronModel", () => {
  it("fills three slots with entering members far away, sizes rotating scout, fighter, cruiser", () => {
    const s = make();
    expect(s.members).toHaveLength(3);
    expect(s.members.map((m) => m.slot)).toEqual([0, 1, 2]);
    expect(s.members.map((m) => m.size)).toEqual(["scout", "fighter", "cruiser"]);
    expect(s.members.every((m) => m.state === "entering")).toBe(true);
    expect(s.members.every((m) => m.z === ENTER_Z)).toBe(true);
  });

  it("anchors form a V ahead of the ship at three depths", () => {
    const s = make();
    expect(s.anchor(0)).toEqual({ x: -420, y: -60, z: 1000 });
    expect(s.anchor(1)).toEqual({ x: 0, y: -120, z: 1400 });
    expect(s.anchor(2)).toEqual({ x: 440, y: -40, z: 1100 });
    const left = screenOf(s, 0);
    const right = screenOf(s, 2);
    expect(left.sx).toBeLessThan(640);
    expect(right.sx).toBeGreaterThan(640);
    expect(screenOf(s, 1).scale).toBeLessThan(left.scale);
  });

  it("brings entering members to their anchor depth over 1200 ms then holds and weaves", () => {
    const s = make();
    s.update(600);
    const mid = s.members[0];
    expect(mid.state).toBe("entering");
    expect(mid.z).toBeGreaterThan(1000);
    expect(mid.z).toBeLessThan(ENTER_Z);
    s.update(600);
    for (const m of s.members) {
      expect(m.state).toBe("holding");
      const a = s.anchor(m.slot);
      expect(m.z).toBe(a.z);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(25);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(40);
    }
    s.update(500);
    for (const m of s.members) {
      const a = s.anchor(m.slot);
      expect(m.x !== a.x || m.y !== a.y).toBe(true);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(25);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(40);
    }
  });

  it("takeNearest picks by screen distance and respawns the slot after 600 ms", () => {
    const s = make();
    s.update(1200);
    const target = screenOf(s, 2);
    const taken = s.takeNearest(target.sx, target.sy);
    expect(taken?.slot).toBe(2);
    expect(s.members).toHaveLength(2);
    s.update(599);
    expect(s.members).toHaveLength(2);
    s.update(1);
    expect(s.members).toHaveLength(3);
    const fresh = s.members.find((m) => m.slot === 2);
    expect(fresh?.state).toBe("entering");
    expect(fresh?.z).toBe(ENTER_Z);
    expect(fresh?.id).not.toBe(taken?.id);
  });

  it("takeAny empties the squadron and returns null afterwards", () => {
    const s = make();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).toBeNull();
    expect(s.takeNearest(640, 420)).toBeNull();
    expect(s.pick()).toBeNull();
  });

  it("fast spawn enters in 400 ms and freeSlot reports an empty slot", () => {
    const s = make();
    s.takeAny();
    const slot = s.freeSlot();
    expect(slot).toBe(0);
    const m = s.spawn(slot, { fast: true });
    expect(m.enterMs).toBe(400);
    s.update(400);
    expect(s.members.find((x) => x.id === m.id)?.state).toBe("holding");
  });

  it("spawning into a slot cancels that slot's pending respawn", () => {
    const s = make();
    s.takeAny();
    s.spawn(0, { fast: true });
    s.update(700);
    expect(s.members.filter((m) => m.slot === 0)).toHaveLength(1);
  });

  // Leaves members = [slot 0 entering, slot 1 holding]: the holding member is NOT first.
  const entersFirstThenHolds = () => {
    const s = make();
    s.update(1200);
    s.takeAny(); // slot 0
    s.update(600); // slot 0 respawned, entering until clock 3000
    const a1 = screenOf(s, 1);
    const a2 = screenOf(s, 2);
    s.takeNearest(a1.sx, a1.sy); // slot 1
    s.takeNearest(a2.sx, a2.sy); // slot 2
    s.spawn(1, { fast: true });
    s.update(400); // slot 1 holds, slot 0 still entering
    expect(s.members.map((m) => m.state)).toEqual(["entering", "holding"]);
    return s;
  };

  it("pick prefers a holding member and never removes it", () => {
    const s = entersFirstThenHolds();
    const p = s.pick();
    expect(p?.state).toBe("holding");
    expect(p?.slot).toBe(1);
    expect(s.members).toHaveLength(2);
  });

  it("takeAny prefers a holding member", () => {
    const s = make();
    s.update(1200);
    s.takeAny();
    s.update(600); // slot 0 respawned, entering
    expect(s.takeAny()?.slot).toBe(1);
    const t = entersFirstThenHolds();
    const taken = t.takeAny();
    expect(taken?.state).toBe("holding");
    expect(taken?.slot).toBe(1);
    expect(t.members).toHaveLength(1);
  });

  it("takeNearest prefers a holding member over a nearer entering one", () => {
    const s = entersFirstThenHolds();
    const entering = s.members.find((m) => m.state === "entering")!;
    const at = project(entering);
    const taken = s.takeNearest(at.sx, at.sy);
    expect(taken?.state).toBe("holding");
    expect(s.members).toHaveLength(1);
  });
});
