import { describe, expect, it } from "vitest";
import sample from "./__fixtures__/espn-sample.json";
import { espnToRecordedGame, parseClock, type EspnSummary } from "./espnToRecordedGame";

describe("parseClock", () => {
  it("parses mm:ss and fractional seconds", () => {
    expect(parseClock("11:42")).toBe(702);
    expect(parseClock("0.8")).toBe(1);
    expect(parseClock("0.0")).toBe(0);
  });
});

describe("espnToRecordedGame", () => {
  const game = espnToRecordedGame(sample as EspnSummary);

  it("maps header and rosters", () => {
    expect(game.id).toBe("999");
    expect(game.date).toBe("2026-01-15T00:30Z");
    expect(game.home).toEqual({ id: "13", name: "Los Angeles Lakers", abbreviation: "LAL", players: [{ id: "p1", name: "Laker One" }, { id: "p2", name: "Laker Two" }] });
    expect(game.away.players).toEqual([{ id: "w1", name: "Warrior One" }]);
  });

  it("maps play kinds in order, splitting turnover+steal", () => {
    expect(game.plays.map((p) => p.kind)).toEqual(["other", "score", "block", "turnover", "steal", "score", "period", "final"]);
    expect(game.plays.map((p) => p.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("attributes a score to the shooter only", () => {
    expect(game.plays[1]).toMatchObject({ kind: "score", points: 2, teamId: "13", playerIds: ["p1"], clockSeconds: 702, homeScore: 2, awayScore: 0 });
  });

  it("credits a block to the defending team and the blocker", () => {
    expect(game.plays[2]).toMatchObject({ kind: "block", teamId: "13", playerIds: ["p2"] });
  });

  it("credits the turnover to the offender and the steal to the thief", () => {
    expect(game.plays[3]).toMatchObject({ kind: "turnover", teamId: "13", playerIds: ["p1"] });
    expect(game.plays[4]).toMatchObject({ kind: "steal", teamId: "9", playerIds: ["w1"] });
  });

  it("maps free throws to 1 point", () => {
    expect(game.plays[5]).toMatchObject({ kind: "score", points: 1, teamId: "9", playerIds: ["w1"] });
  });

  it("turns End Period into the start of the next period and End Game into final", () => {
    expect(game.plays[6]).toMatchObject({ kind: "period", period: 2, clockSeconds: 720, playerIds: [] });
    expect(game.plays[6].teamId).toBeUndefined();
    expect(game.plays[7]).toMatchObject({ kind: "final", period: 4, clockSeconds: 0 });
  });
});
