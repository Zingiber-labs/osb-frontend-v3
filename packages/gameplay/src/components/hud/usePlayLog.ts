import { useEffect, useRef, useState } from "react";
import type { GameEvent } from "../../engine/types";
import type { Feed } from "../../feeds/types";

export type PlayTone = "mine" | "charged" | "theirs";
export type PlayEntry = { id: number; label: string; tone: PlayTone };

/** Same coloring as the renderer's callouts: my player's scores are the charged (gold) shots. */
export function toneFor(event: GameEvent): PlayTone | null {
  if (!("side" in event)) return null;
  if (event.side === "theirs") return "theirs";
  return event.kind === "score" && event.byMyPlayer ? "charged" : "mine";
}

/** The last `limit` labeled plays from the feed, oldest first. Entries are tagged with their feed, so a feed change reads as empty without a state reset. */
export function usePlayLog(feed: Feed | null, limit = 4): PlayEntry[] {
  const [log, setLog] = useState<{ feed: Feed | null; list: PlayEntry[] }>({ feed: null, list: [] });
  const nextId = useRef(1);
  useEffect(() => {
    if (!feed) return;
    return feed.onEvent((event) => {
      const tone = toneFor(event);
      if (!tone || !("label" in event) || !event.label) return;
      const entry: PlayEntry = { id: nextId.current++, label: event.label, tone };
      setLog((prev) => ({ feed, list: [...(prev.feed === feed ? prev.list : []), entry].slice(-limit) }));
    });
  }, [feed, limit]);
  return log.feed === feed ? log.list : [];
}
