import type { Clock, GameEvent, Side } from "@/features/gameplay/engine/types";
import type { Feed, RecordedGame, RecordedPlay } from "./types";

export type TimelineItem = { event: GameEvent; delayMs: number };

export function findTeamId(game: RecordedGame, playerId: string): string {
  if (game.home.players.some((p) => p.id === playerId)) return game.home.id;
  if (game.away.players.some((p) => p.id === playerId)) return game.away.id;
  throw new Error(`Player ${playerId} is not on either roster of game ${game.id}`);
}

function toClock(play: RecordedPlay): Clock {
  return { period: play.period, secondsLeft: play.clockSeconds, home: play.homeScore, away: play.awayScore };
}

function toEvent(play: RecordedPlay, myTeamId: string, myPlayerId: string): GameEvent | null {
  const at = toClock(play);
  const side: Side = play.teamId === myTeamId ? "mine" : "theirs";
  const byMyPlayer = play.playerIds.includes(myPlayerId);
  switch (play.kind) {
    case "score":
      return play.points ? { kind: "score", side, points: play.points, byMyPlayer, at } : null;
    case "block":
    case "steal":
    case "turnover":
      return { kind: play.kind, side, byMyPlayer, at };
    case "period":
      return { kind: "period", period: play.period, at };
    case "final":
      return { kind: "final", at };
    default:
      return null;
  }
}

function gapSeconds(prev: RecordedPlay | undefined, cur: RecordedPlay): number {
  if (!prev || prev.period !== cur.period) return 0;
  return Math.max(0, prev.clockSeconds - cur.clockSeconds);
}

export function buildTimeline(game: RecordedGame, myPlayerId: string, speed: number): TimelineItem[] {
  const myTeamId = findTeamId(game, myPlayerId);
  const plays = [...game.plays].sort((a, b) => a.order - b.order);
  const first = plays[0];
  const tipoffAt: Clock = first ? toClock(first) : { period: 1, secondsLeft: 720, home: 0, away: 0 };
  const items: TimelineItem[] = [{ event: { kind: "tipoff", at: tipoffAt }, delayMs: 0 }];

  let pendingMs = 0;
  let prev: RecordedPlay | undefined;
  for (const play of plays) {
    pendingMs += (gapSeconds(prev, play) * 1000) / speed;
    prev = play;
    const event = toEvent(play, myTeamId, myPlayerId);
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
