import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameEvent } from "../engine/types";
import { buildTimeline, createReplayFeed, findTeamId, formatLabel } from "./replayFeed";
import { testGame } from "./testGame";
import type { RecordedGame } from "./types";

describe("findTeamId", () => {
  it("finds the team of a home or away player", () => {
    expect(findTeamId(testGame, "h2")).toBe("H");
    expect(findTeamId(testGame, "a1")).toBe("A");
  });

  it("throws for an unknown player", () => {
    expect(() => findTeamId(testGame, "zzz")).toThrow(/not on either roster/);
  });
});

describe("buildTimeline", () => {
  it("starts with tipoff and resolves side for a home player", () => {
    const kinds = buildTimeline(testGame, "h1", 1).map((i) => i.event.kind);
    expect(kinds).toEqual(["tipoff", "score", "block", "score", "turnover", "period", "score", "final"]);
    const [, first, block, second] = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    expect(first).toMatchObject({ kind: "score", side: "mine", points: 2, byMyPlayer: true });
    expect(block).toMatchObject({ kind: "block", side: "theirs", byMyPlayer: false });
    expect(second).toMatchObject({ kind: "score", side: "theirs", points: 3, byMyPlayer: false });
  });

  it("flips side for an away player", () => {
    const [, first, block] = buildTimeline(testGame, "a2", 1).map((i) => i.event);
    expect(first).toMatchObject({ side: "theirs", byMyPlayer: false });
    expect(block).toMatchObject({ side: "mine", byMyPlayer: true });
  });

  it("carries the clock and score on every event", () => {
    const [, first] = buildTimeline(testGame, "h1", 1);
    expect(first.event.at).toEqual({ period: 1, secondsLeft: 700, home: 2, away: 0 });
  });

  it("derives delays from the game clock divided by speed and zeroes them across periods", () => {
    const delays = buildTimeline(testGame, "h1", 10).map((i) => i.delayMs);
    // tipoff 0; play1 is 20s after the skipped "other" play; block 20s; score 30s; turnover 10s; period boundary 0; score 10s; final crosses periods 0
    expect(delays).toEqual([0, 2000, 2000, 3000, 1000, 0, 1000, 0]);
  });
});

describe("createReplayFeed", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function collect() {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    return { feed, events };
  }

  it("emits tipoff immediately on start and the next event after its delay", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(0);
    expect(events.map((e) => e.kind)).toEqual(["tipoff"]);
    vi.advanceTimersByTime(1999);
    expect(events).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score"]);
  });

  it("delivers everything by the end of the timeline", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(60_000);
    expect(events).toHaveLength(8);
    expect(events.at(-1)?.kind).toBe("final");
  });

  it("pauses, steps one event, and resumes", () => {
    const { feed, events } = collect();
    feed.start();
    vi.advanceTimersByTime(0);
    feed.pause();
    vi.advanceTimersByTime(10_000);
    expect(events).toHaveLength(1);
    feed.step();
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score"]);
    feed.start();
    vi.advanceTimersByTime(2000);
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score", "block"]);
  });

  it("unsubscribe stops that listener", () => {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const a: string[] = [];
    const b: string[] = [];
    const offA = feed.onEvent((e) => a.push(e.kind));
    feed.onEvent((e) => b.push(e.kind));
    feed.start();
    vi.advanceTimersByTime(0);
    offA();
    vi.advanceTimersByTime(2000);
    expect(a).toEqual(["tipoff"]);
    expect(b).toEqual(["tipoff", "score"]);
  });

  it("stop ends delivery permanently", () => {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const seen: string[] = [];
    feed.onEvent((e) => seen.push(e.kind));
    feed.start();
    vi.advanceTimersByTime(0);
    feed.stop();
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual(["tipoff"]);
    feed.start();
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual(["tipoff"]);
  });

  it("a listener that calls step during delivery does not double-advance", () => {
    const feed = createReplayFeed(testGame, { myPlayerId: "h1", speed: 10 });
    const kinds: string[] = [];
    let stepped = false;
    feed.onEvent((e) => {
      kinds.push(e.kind);
      if (e.kind === "score" && !stepped) {
        stepped = true;
        feed.step();
      }
    });
    feed.start();
    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(3000);
    expect(kinds).toEqual(["tipoff", "score", "block", "score"]);
  });
});

describe("labels", () => {
  it("formats last name and play, ignoring suffixes, or the team when there is no player", () => {
    expect(formatLabel("Ja Morant", "MEM", "+3")).toBe("MORANT +3");
    expect(formatLabel("Jaren Jackson Jr.", "MEM", "BLOCK")).toBe("JACKSON BLOCK");
    expect(formatLabel("Robert Williams III", "MEM", "STEAL")).toBe("WILLIAMS STEAL");
    expect(formatLabel(undefined, "IND", "TURNOVER")).toBe("IND TURNOVER");
  });

  it("labels score, block, steal and turnover events from the rosters", () => {
    const [, score, block, , turnover] = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    expect(score).toMatchObject({ kind: "score", label: "ONE +2" });
    expect(block).toMatchObject({ kind: "block", label: "TWO BLOCK" });
    expect(turnover).toMatchObject({ kind: "turnover", label: "TWO TURNOVER" });
  });

  it("falls back to the team abbreviation for a team turnover", () => {
    const game: RecordedGame = {
      ...testGame,
      plays: [{ order: 0, period: 1, clockSeconds: 700, homeScore: 0, awayScore: 0, kind: "turnover", teamId: "A", playerIds: [] }],
    };
    const [, turnover] = buildTimeline(game, "h1", 1).map((i) => i.event);
    expect(turnover).toMatchObject({ kind: "turnover", side: "theirs", label: "AWY TURNOVER" });
  });

  it("leaves period and final without labels", () => {
    const events = buildTimeline(testGame, "h1", 1).map((i) => i.event);
    for (const e of events) if (e.kind === "period" || e.kind === "final" || e.kind === "tipoff") expect("label" in e).toBe(false);
  });
});
