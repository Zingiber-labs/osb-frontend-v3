import { describe, expect, it } from "vitest";
import { clockOf, createPlayMapper, findTeamId } from "./mapPlay";
import { testGame } from "./testGame";

describe("createPlayMapper", () => {
  const mapper = createPlayMapper(testGame, "h1");

  it("resolves my team from the roster", () => {
    expect(mapper.myTeamId).toBe("H");
    expect(findTeamId(testGame, "a2")).toBe("A");
    expect(() => findTeamId(testGame, "nobody")).toThrow(/not on either roster/);
  });

  it("maps a score by my player to a mine/byMyPlayer score with a label", () => {
    const e = mapper.toEvent(testGame.plays[1]);
    expect(e).toEqual({
      kind: "score",
      side: "mine",
      points: 2,
      byMyPlayer: true,
      label: "ONE +2",
      at: { period: 1, secondsLeft: 700, home: 2, away: 0 },
    });
  });

  it("maps a block by the other team to theirs", () => {
    const e = mapper.toEvent(testGame.plays[2]);
    expect(e).toMatchObject({ kind: "block", side: "theirs", byMyPlayer: false, label: "TWO BLOCK" });
  });

  it("maps period and final, and drops other", () => {
    expect(mapper.toEvent(testGame.plays[5])).toEqual({ kind: "period", period: 2, at: clockOf(testGame.plays[5]) });
    expect(mapper.toEvent(testGame.plays[7])).toEqual({ kind: "final", at: clockOf(testGame.plays[7]) });
    expect(mapper.toEvent(testGame.plays[0])).toBeNull();
  });
});
