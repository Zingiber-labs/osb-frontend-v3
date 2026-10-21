import { describe, expect, it } from "vitest";
import { SquadronModel } from "./squadron";

const W = 1000;
const H = 500;
const make = (over = {}) => new SquadronModel({ width: W, height: H, random: () => 0, ...over });

describe("SquadronModel", () => {
  it("fills three slots with entering members, sizes rotating scout, fighter, cruiser", () => {
    const s = make();
    expect(s.members).toHaveLength(3);
    expect(s.members.map((m) => m.slot)).toEqual([0, 1, 2]);
    expect(s.members.map((m) => m.size)).toEqual(["scout", "fighter", "cruiser"]);
    expect(s.members.every((m) => m.state === "entering")).toBe(true);
    expect(s.members.every((m) => m.x > W)).toBe(true);
  });

  it("places anchors at the spec positions", () => {
    const s = make();
    expect(s.anchor(0)).toEqual({ x: 760, y: 150 });
    expect(s.anchor(1)).toEqual({ x: 800, y: 250 });
    expect(s.anchor(2)).toEqual({ x: 840, y: 350 });
  });

  it("moves entering members to their anchor over 1200 ms then holds and weaves", () => {
    const s = make();
    s.update(600);
    const mid = s.members[0];
    expect(mid.state).toBe("entering");
    expect(mid.x).toBeGreaterThan(760);
    expect(mid.x).toBeLessThan(W + 80);
    s.update(600);
    for (const m of s.members) {
      expect(m.state).toBe("holding");
      const a = s.anchor(m.slot);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(6);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(12);
    }
  });

  it("takeNearest removes the closest member and respawns its slot after 600 ms", () => {
    const s = make();
    s.update(1200);
    const taken = s.takeNearest(800, 250);
    expect(taken?.slot).toBe(1);
    expect(s.members).toHaveLength(2);
    s.update(599);
    expect(s.members).toHaveLength(2);
    s.update(1);
    expect(s.members).toHaveLength(3);
    const fresh = s.members.find((m) => m.slot === 1);
    expect(fresh?.state).toBe("entering");
    expect(fresh?.id).not.toBe(taken?.id);
  });

  it("takeAny empties the squadron and returns null afterwards", () => {
    const s = make();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).toBeNull();
    expect(s.takeNearest(0, 0)).toBeNull();
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

  it("pick prefers a holding member and never removes it", () => {
    const s = make();
    s.update(1200);
    s.takeAny();
    s.update(600); // slot 0 respawned, entering
    const p = s.pick();
    expect(p?.state).toBe("holding");
    expect(s.members).toHaveLength(3);
  });
});
