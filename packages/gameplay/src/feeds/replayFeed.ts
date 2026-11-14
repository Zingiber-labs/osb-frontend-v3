import type { Clock, GameEvent } from "../engine/types";
import { clockOf, createPlayMapper, findTeamId, formatLabel } from "./mapPlay";
import type { Feed, RecordedGame, RecordedPlay } from "./types";

export type TimelineItem = { event: GameEvent; delayMs: number };
export { findTeamId, formatLabel };

function gapSeconds(prev: RecordedPlay | undefined, cur: RecordedPlay): number {
  if (!prev || prev.period !== cur.period) return 0;
  return Math.max(0, prev.clockSeconds - cur.clockSeconds);
}

export function buildTimeline(game: RecordedGame, myPlayerId: string, speed: number): TimelineItem[] {
  const mapper = createPlayMapper(game, myPlayerId);
  const plays = [...game.plays].sort((a, b) => a.order - b.order);
  const first = plays[0];
  const tipoffAt: Clock = first ? clockOf(first) : { period: 1, secondsLeft: 720, home: 0, away: 0 };
  const items: TimelineItem[] = [{ event: { kind: "tipoff", at: tipoffAt }, delayMs: 0 }];

  let pendingMs = 0;
  let prev: RecordedPlay | undefined;
  for (const play of plays) {
    pendingMs += (gapSeconds(prev, play) * 1000) / speed;
    prev = play;
    const event = mapper.toEvent(play);
    if (!event) continue;
    items.push({ event, delayMs: Math.round(pendingMs) });
    pendingMs = 0;
  }
  return items;
}

export function createReplayFeed(game: RecordedGame, opts: { myPlayerId: string; speed?: number }): Feed {
  const timeline = buildTimeline(game, opts.myPlayerId, opts.speed ?? 16);
  const listeners = new Set<(e: GameEvent) => void>();
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const deliverNext = () => {
    const item = timeline[index];
    if (!item) {
      running = false;
      return;
    }
    index += 1;
    for (const l of listeners) l(item.event);
  };

  const schedule = () => {
    clearTimer();
    if (!running || index >= timeline.length) {
      running = false;
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      deliverNext();
      schedule();
    }, timeline[index].delayMs);
  };

  return {
    start() {
      if (running) return;
      running = true;
      schedule();
    },
    pause() {
      running = false;
      clearTimer();
    },
    stop() {
      running = false;
      clearTimer();
      index = timeline.length;
    },
    step() {
      clearTimer();
      deliverNext();
      if (running) schedule();
    },
    onEvent(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}
