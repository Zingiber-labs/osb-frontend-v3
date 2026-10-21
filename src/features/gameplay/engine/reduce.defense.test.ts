import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("reduce: blocks and steals", () => {
  it("adds a shield charge and raises the shield on my team's block", () => {
    const { state, actions } = reduce(createInitialState(mission), { kind: "block", side: "mine", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "shieldUp" }]);
    expect(state.shield).toBe(1);
    expect(state.myPlayerStats.blk).toBe(0);
  });

  it("caps the shield at 3 charges", () => {
    let state = createInitialState(mission);
    for (let i = 0; i < 5; i += 1) {
      state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: false, at: at() }).state;
    }
    expect(state.shield).toBe(3);
  });

  it("tracks my player's blocks and steals", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: true, at: at() }).state;
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.myPlayerStats).toEqual({ pts: 0, blk: 1, stl: 2, tov: 0 });
  });

  it("fizzles my shot on the opponent's block or steal without touching state", () => {
    const start = createInitialState(mission);
    const block = reduce(start, { kind: "block", side: "theirs", byMyPlayer: false, at: at() });
    const steal = reduce(start, { kind: "steal", side: "theirs", byMyPlayer: false, at: at() });
    expect(block.actions).toEqual([{ type: "fizzle" }]);
    expect(steal.actions).toEqual([{ type: "fizzle" }]);
    expect(block.state.shield).toBe(0);
    expect(block.state.hull).toBe(100);
  });
});

describe("reduce: shield absorbs opponent scores", () => {
  it("spends one charge and leaves the hull untouched", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "hit", points: 3, absorbed: true }]);
    expect(next.hull).toBe(100);
    expect(next.shield).toBe(1);
  });

  it("damages the hull once the charges are gone", () => {
    let state = createInitialState(mission);
    state = reduce(state, { kind: "block", side: "mine", byMyPlayer: false, at: at() }).state;
    state = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "hit", points: 2, absorbed: false }]);
    expect(next.hull).toBe(96);
    expect(next.shield).toBe(0);
  });
});

describe("reduce: turnovers", () => {
  it("stalls the ship on my team's turnover", () => {
    const state = { ...createInitialState(mission), combo: 3 };
    const { state: next, actions } = reduce(state, { kind: "turnover", side: "mine", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "stall" }]);
    expect(next.combo).toBe(3);
    expect(next.myPlayerStats.tov).toBe(0);
  });

  it("resets the combo and counts the turnover when it is my player's", () => {
    const state = { ...createInitialState(mission), combo: 3 };
    const { state: next, actions } = reduce(state, { kind: "turnover", side: "mine", byMyPlayer: true, at: at() });
    expect(actions).toEqual([{ type: "stall" }]);
    expect(next.combo).toBe(0);
    expect(next.myPlayerStats.tov).toBe(1);
  });

  it("makes the enemy malfunction on the opponent's turnover", () => {
    const { state, actions } = reduce(createInitialState(mission), { kind: "turnover", side: "theirs", byMyPlayer: false, at: at() });
    expect(actions).toEqual([{ type: "enemyMalfunction" }]);
    expect(state.hull).toBe(100);
  });
});
