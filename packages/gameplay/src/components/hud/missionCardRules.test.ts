import { describe, expect, it } from "vitest";
import { createInitialState } from "../../engine/reduce";
import type { ScenarioState } from "../../engine/types";
import { cardFor, EVENT_MS, TIPOFF_MS } from "./missionCardRules";

const ctx = { playerName: "Ja Morant", matchup: "MEM vs IND" };
const base = (over: Partial<ScenarioState> = {}): ScenarioState => ({ ...createInitialState({ stat: "pts", target: 20 }), ...over });

describe("cardFor", () => {
  it("announces the mission at tip-off", () => {
    const card = cardFor(base(), base({ status: "live" }), ctx);
    expect(card).toEqual({ eyebrow: "MISSION", headline: "20 PTS · JA MORANT", subline: "MEM vs IND", tone: "mine", ms: TIPOFF_MS });
  });

  it("celebrates the objective once, in gold, with the count", () => {
    const prev = base({ status: "live" });
    const next = base({ status: "live", mission: { stat: "pts", target: 20, met: true }, myPlayerStats: { pts: 21, blk: 0, stl: 0, tov: 0 } });
    expect(cardFor(prev, next, ctx)).toEqual({ eyebrow: "OBJECTIVE", headline: "OBJECTIVE COMPLETE", subline: "21 / 20 PTS", tone: "gold", ms: EVENT_MS });
    expect(cardFor(next, { ...next, myPlayerStats: { pts: 23, blk: 0, stl: 0, tov: 0 } }, ctx)).toBeNull();
  });

  it("announces a period change with progress", () => {
    const prev = base({ status: "live", myPlayerStats: { pts: 14, blk: 0, stl: 0, tov: 0 } });
    const next = { ...prev, clock: { ...prev.clock, period: 3 } };
    expect(cardFor(prev, next, ctx)).toEqual({ eyebrow: "PERIOD", headline: "Q3", subline: "14 / 20 PTS", tone: "neutral", ms: EVENT_MS });
  });

  it("announces the final", () => {
    const prev = base({ status: "live", myPlayerStats: { pts: 18, blk: 0, stl: 0, tov: 0 } });
    expect(cardFor(prev, { ...prev, status: "lost" }, ctx)).toEqual({ eyebrow: "FINAL", headline: "FINAL", subline: "18 / 20 PTS", tone: "neutral", ms: EVENT_MS });
  });

  it("returns null for unrelated changes", () => {
    const prev = base({ status: "live" });
    expect(cardFor(prev, { ...prev, hull: 90 }, ctx)).toBeNull();
    expect(cardFor(prev, { ...prev, clock: { ...prev.clock, secondsLeft: 600, home: 2 } }, ctx)).toBeNull();
  });
});
