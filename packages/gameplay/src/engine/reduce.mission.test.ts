import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

describe("reduce: game structure", () => {
  it("goes live on tipoff with no action", () => {
    const { state, actions } = reduce(createInitialState({ stat: "pts", target: 5 }), { kind: "tipoff", at: at() });
    expect(state.status).toBe("live");
    expect(actions).toEqual([]);
  });

  it("only updates the clock on a period change", () => {
    const start = reduce(createInitialState({ stat: "pts", target: 5 }), { kind: "tipoff", at: at() }).state;
    const { state, actions } = reduce(start, { kind: "period", period: 2, at: at({ period: 2, home: 28, away: 30 }) });
    expect(actions).toEqual([]);
    expect(state.clock.period).toBe(2);
    expect(state.hull).toBe(100);
  });
});

describe("reduce: mission threshold", () => {
  it("emits objectiveComplete once when my player reaches the target", () => {
    let state = createInitialState({ stat: "pts", target: 5 });
    let r = reduce(state, { kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(false);
    expect(r.actions.map((a) => a.type)).toEqual(["fire"]);

    r = reduce(r.state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["fire", "objectiveComplete"]);

    r = reduce(r.state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["fire"]);
  });

  it("supports block and steal missions", () => {
    let state = createInitialState({ stat: "blk", target: 1 });
    const r = reduce(state, { kind: "block", side: "mine", byMyPlayer: true, at: at() });
    expect(r.state.mission.met).toBe(true);
    expect(r.actions.map((a) => a.type)).toEqual(["shieldUp", "objectiveComplete"]);

    state = createInitialState({ stat: "stl", target: 2 });
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.mission.met).toBe(false);
    state = reduce(state, { kind: "steal", side: "mine", byMyPlayer: true, at: at() }).state;
    expect(state.mission.met).toBe(true);
  });

  it("ignores teammates' stats for the mission", () => {
    const { state } = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "score", side: "mine", points: 3, byMyPlayer: false, at: at() });
    expect(state.mission.met).toBe(false);
  });
});

describe("reduce: final", () => {
  it("wins and warps out when the mission was met", () => {
    let state = createInitialState({ stat: "pts", target: 2 });
    state = reduce(state, { kind: "score", side: "mine", points: 2, byMyPlayer: true, at: at() }).state;
    const { state: next, actions } = reduce(state, { kind: "final", at: at({ period: 4, secondsLeft: 0 }) });
    expect(next.status).toBe("won");
    expect(actions).toEqual([{ type: "warpOut" }]);
  });

  it("loses and explodes when the mission was not met", () => {
    const { state, actions } = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "final", at: at({ period: 4, secondsLeft: 0 }) });
    expect(state.status).toBe("lost");
    expect(actions).toEqual([{ type: "explode" }]);
  });

  it("ignores every event after final", () => {
    const done = reduce(createInitialState({ stat: "pts", target: 2 }), { kind: "final", at: at() }).state;
    const { state, actions } = reduce(done, { kind: "score", side: "theirs", points: 3, byMyPlayer: false, at: at() });
    expect(actions).toEqual([]);
    expect(state).toBe(done);
  });
});
