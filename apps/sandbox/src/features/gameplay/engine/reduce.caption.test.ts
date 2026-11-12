import { describe, expect, it } from "vitest";
import { createInitialState, reduce } from "./reduce";
import { at } from "./testUtils";

const mission = { stat: "pts" as const, target: 20 };

describe("reduce: captions", () => {
  it("copies the event label onto fire, hit, shieldUp, fizzle, stall and enemyMalfunction", () => {
    const s = createInitialState(mission);
    expect(reduce(s, { kind: "score", side: "mine", points: 3, byMyPlayer: true, label: "MORANT +3", at: at() }).actions[0])
      .toEqual({ type: "fire", size: "cruiser", charged: true, caption: "MORANT +3" });
    expect(reduce(s, { kind: "score", side: "theirs", points: 2, byMyPlayer: false, label: "SIAKAM +2", at: at() }).actions[0])
      .toEqual({ type: "hit", points: 2, absorbed: false, caption: "SIAKAM +2" });
    expect(reduce(s, { kind: "block", side: "mine", byMyPlayer: false, label: "JACKSON BLOCK", at: at() }).actions[0])
      .toEqual({ type: "shieldUp", caption: "JACKSON BLOCK" });
    expect(reduce(s, { kind: "steal", side: "theirs", byMyPlayer: false, label: "SIAKAM STEAL", at: at() }).actions[0])
      .toEqual({ type: "fizzle", caption: "SIAKAM STEAL" });
    expect(reduce(s, { kind: "turnover", side: "mine", byMyPlayer: false, label: "MORANT TURNOVER", at: at() }).actions[0])
      .toEqual({ type: "stall", caption: "MORANT TURNOVER" });
    expect(reduce(s, { kind: "turnover", side: "theirs", byMyPlayer: false, label: "IND TURNOVER", at: at() }).actions[0])
      .toEqual({ type: "enemyMalfunction", caption: "IND TURNOVER" });
  });

  it("omits the caption key when the event has no label", () => {
    const { actions } = reduce(createInitialState(mission), { kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at() });
    expect("caption" in actions[0]).toBe(false);
  });
});
