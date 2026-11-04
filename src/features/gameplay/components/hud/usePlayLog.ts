import { useEffect, useRef, useState } from "react";
import type { GameEvent } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";

export type PlayTone = "mine" | "charged" | "theirs";
export type PlayEntry = { id: number; label: string; tone: PlayTone };

/** Same coloring as the renderer's callouts: my player's scores are the charged (gold) shots. */
export function toneFor(event: GameEvent): PlayTone | null {
  if (!("side" in event)) return null;
  if (event.side === "theirs") return "theirs";
  return event.kind === "score" && event.byMyPlayer ? "charged" : "mine";
}

/** The last `limit` labeled plays from the feed, oldest first. Resets when the feed changes. */
export function usePlayLog(feed: Feed | null, limit = 4): PlayEntry[] {
  const [entries, setEntries] = useState<PlayEntry[]>([]);
  const nextId = useRef(1);
  useEffect(() => {
    setEntries([]);
    if (!feed) return;
    return feed.onEvent((event) => {
      const tone = toneFor(event);
      if (!tone || !("label" in event) || !event.label) return;
      const entry: PlayEntry = { id: nextId.current++, label: event.label, tone };
      setEntries((prev) => [...prev, entry].slice(-limit));
    });
  }, [feed, limit]);
  return entries;
}
