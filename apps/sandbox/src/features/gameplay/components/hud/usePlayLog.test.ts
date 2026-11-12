import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { at } from "@/features/gameplay/engine/testUtils";
import { createTestFeed } from "@/features/gameplay/feeds/testFeed";
import { toneFor, usePlayLog } from "./usePlayLog";

describe("toneFor", () => {
  it("colors my plays cyan, my player's scores gold, theirs rose, and ignores sideless events", () => {
    expect(toneFor({ kind: "score", side: "mine", points: 2, byMyPlayer: false, at: at() })).toBe("mine");
    expect(toneFor({ kind: "score", side: "mine", points: 3, byMyPlayer: true, at: at() })).toBe("charged");
    expect(toneFor({ kind: "block", side: "mine", byMyPlayer: true, at: at() })).toBe("mine");
    expect(toneFor({ kind: "steal", side: "theirs", byMyPlayer: false, at: at() })).toBe("theirs");
    expect(toneFor({ kind: "period", period: 2, at: at() })).toBeNull();
    expect(toneFor({ kind: "final", at: at() })).toBeNull();
  });
});

describe("usePlayLog", () => {
  it("keeps the last four labeled plays, newest last, and skips unlabeled events", () => {
    const feed = createTestFeed();
    const { result } = renderHook(() => usePlayLog(feed));
    act(() => {
      feed.emit({ kind: "tipoff", at: at() });
      feed.emit({ kind: "score", side: "mine", points: 3, byMyPlayer: true, label: "MORANT +3", at: at() });
      feed.emit({ kind: "block", side: "theirs", byMyPlayer: false, at: at() }); // no label
      feed.emit({ kind: "score", side: "theirs", points: 2, byMyPlayer: false, label: "IND +2", at: at() });
      feed.emit({ kind: "steal", side: "mine", byMyPlayer: false, label: "BANE STEAL", at: at() });
      feed.emit({ kind: "turnover", side: "theirs", byMyPlayer: false, label: "IND TURNOVER", at: at() });
      feed.emit({ kind: "score", side: "mine", points: 1, byMyPlayer: false, label: "JACKSON +1", at: at() });
    });
    expect(result.current.map((e) => e.label)).toEqual(["IND +2", "BANE STEAL", "IND TURNOVER", "JACKSON +1"]);
    expect(result.current.map((e) => e.tone)).toEqual(["theirs", "mine", "theirs", "mine"]);
    const ids = result.current.map((e) => e.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("starts empty again when the feed changes and unsubscribes from the old one", () => {
    const a = createTestFeed();
    const b = createTestFeed();
    const { result, rerender } = renderHook(({ feed }) => usePlayLog(feed), { initialProps: { feed: a } });
    act(() => a.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: false, label: "X +2", at: at() }));
    expect(result.current).toHaveLength(1);
    rerender({ feed: b });
    expect(result.current).toHaveLength(0);
    act(() => a.emit({ kind: "score", side: "mine", points: 2, byMyPlayer: false, label: "Y +2", at: at() }));
    expect(result.current).toHaveLength(0);
  });
});
