import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("createInitialState", () => {
  it("starts with full hull, no shield, pending status", () => {
    const state = createInitialState(mission);
    expect(state).toEqual({
      hull: 100,
      shield: 0,
      combo: 0,
      enemiesDestroyed: 0,
      myPlayerStats: { pts: 0, blk: 0, stl: 0, tov: 0 },
      mission: { stat: "pts", target: 20, met: false },
      clock: { period: 1, secondsLeft: 720, home: 0, away: 0 },
      status: "pending",
    });
  });
});

describe("reduce: my team scores", () => {
  it("fires at a fighter for 2 points and counts the kill", () => {
    const { state, actions } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at({ home: 2 }),
    });
    expect(actions).toEqual([{ type: "fire", size: "fighter", charged: false }]);
    expect(state.enemiesDestroyed).toBe(1);
    expect(state.hull).toBe(100);
    expect(state.myPlayerStats.pts).toBe(0);
  });

  it("maps 1 point to scout and 3 points to cruiser", () => {
    const one = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 1, byMyPlayer: false, at: at() });
    const three = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 3, byMyPlayer: false, at: at() });
    expect(one.actions[0]).toEqual({ type: "fire", size: "scout", charged: false });
    expect(three.actions[0]).toEqual({ type: "fire", size: "cruiser", charged: false });
  });

  it("charges the shot, raises combo, and tracks points when my player scores", () => {
    const { state, actions } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at({ home: 3 }),
    });
    expect(actions).toEqual([{ type: "fire", size: "cruiser", charged: true }]);
    expect(state.combo).toBe(1);
    expect(state.myPlayerStats.pts).toBe(3);
  });

  it("updates the clock from the event", () => {
    const { state } = reduce(createInitialState(mission), {
      kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at({ period: 2, secondsLeft: 300, home: 40, away: 38 }),
    });
    expect(state.clock).toEqual({ period: 2, secondsLeft: 300, home: 40, away: 38 });
  });
});

describe("reduce: opponent scores", () => {
  it("damages the hull by 2/4/6 and resets the combo", () => {
    let state = { ...createInitialState(mission), combo: 4 };
    let r = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at({ away: 3 }) });
    expect(r.actions).toEqual([{ type: "hit", points: 3, absorbed: false }]);
    expect(r.state.hull).toBe(94);
    expect(r.state.combo).toBe(0);

    state = r.state;
    r = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at({ away: 5 }) });
    expect(r.state.hull).toBe(90);

    r = reduce(r.state, { kind: "score", side: "theirs", points: 1, byMyPlayer: false, at: at({ away: 6 }) });
    expect(r.state.hull).toBe(88);
  });

  it("never drops the hull below 1", () => {
    const state = { ...createInitialState(mission), hull: 3 };
    const { state: next } = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(next.hull).toBe(1);
  });

  it("does not change my player's stats when the opponent scores", () => {
    const { state } = reduce(createInitialState(mission), { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() });
    expect(state.myPlayerStats).toEqual({ pts: 0, blk: 0, stl: 0, tov: 0 });
  });
});
