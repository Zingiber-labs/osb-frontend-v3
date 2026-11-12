import type { GameEvent, GameHeader, RecordedPlay } from "@osb/gameplay";
import { describe, expect, it, vi } from "vitest";
import { createLiveFeed, SOCKET_EVENTS, type SocketLike } from "./liveFeed";

const header: GameHeader = {
  id: "g1",
  date: "2026-01-01",
  home: { id: "H", name: "Home", abbreviation: "HOM", players: [{ id: "h1", name: "Home One" }] },
  away: { id: "A", name: "Away", abbreviation: "AWY", players: [{ id: "a1", name: "Away One" }] },
};

const play = (order: number, extra: Partial<RecordedPlay> = {}): RecordedPlay => ({
  order, period: 1, clockSeconds: 700 - order, homeScore: 0, awayScore: 0, kind: "score", points: 2, teamId: "H", playerIds: ["h1"], ...extra,
});

function fakeSocket(connected = true) {
  const handlers = new Map<string, Set<(p: any) => void>>();
  const emitted: Array<[string, unknown]> = [];
  const socket: SocketLike = {
    connected,
    emit: (e, p) => { emitted.push([e, p]); },
    on: (e, cb) => { (handlers.get(e) ?? handlers.set(e, new Set()).get(e)!).add(cb); },
    off: (e, cb) => { handlers.get(e)?.delete(cb); },
  };
  const fire = (e: string, p: unknown) => { for (const cb of handlers.get(e) ?? []) cb(p); };
  return { socket, emitted, fire };
}

describe("createLiveFeed", () => {
  it("subscribes on start with fromOrder 0 and publishes the game header", () => {
    const { socket, emitted, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const onGame = vi.fn();
    feed.onGame(onGame);
    feed.start();
    expect(emitted).toContainEqual([SOCKET_EVENTS.subscribe, { gameId: 1, fromOrder: 0 }]);
    fire(SOCKET_EVENTS.gameInfo, header);
    expect(onGame).toHaveBeenCalledWith(header);
  });

  it("emits tipoff once before the first play, then mapped events", () => {
    const { socket, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    feed.start();
    fire(SOCKET_EVENTS.gameInfo, header);
    fire(SOCKET_EVENTS.play, play(1));
    fire(SOCKET_EVENTS.play, play(2, { teamId: "A", playerIds: ["a1"] }));
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score", "score"]);
    expect(events[1]).toMatchObject({ side: "mine", byMyPlayer: true });
    expect(events[2]).toMatchObject({ side: "theirs", byMyPlayer: false });
  });

  it("buffers plays that arrive before the header", () => {
    const { socket, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    feed.start();
    fire(SOCKET_EVENTS.play, play(1));
    expect(events).toHaveLength(0);
    fire(SOCKET_EVENTS.gameInfo, header);
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score"]);
  });

  it("drops plays it has already applied and resubscribes from the last order on reconnect", () => {
    const { socket, emitted, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    feed.start();
    fire(SOCKET_EVENTS.gameInfo, header);
    fire(SOCKET_EVENTS.play, play(1));
    fire(SOCKET_EVENTS.play, play(1));
    fire(SOCKET_EVENTS.play, play(2));
    expect(events.filter((e) => e.kind === "score")).toHaveLength(2);
    expect(feed.lastOrder()).toBe(2);
    fire("connect", undefined);
    expect(emitted.at(-1)).toEqual([SOCKET_EVENTS.subscribe, { gameId: 1, fromOrder: 2 }]);
  });

  it("pause holds delivery and step releases one event", () => {
    const { socket, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    feed.start();
    fire(SOCKET_EVENTS.gameInfo, header);
    feed.pause();
    fire(SOCKET_EVENTS.play, play(1));
    fire(SOCKET_EVENTS.play, play(2));
    expect(events).toHaveLength(0);
    feed.step();
    expect(events.map((e) => e.kind)).toEqual(["tipoff"]);
    feed.start();
    expect(events.map((e) => e.kind)).toEqual(["tipoff", "score", "score"]);
  });

  it("stop unsubscribes and removes handlers", () => {
    const { socket, emitted, fire } = fakeSocket();
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    const events: GameEvent[] = [];
    feed.onEvent((e) => events.push(e));
    feed.start();
    fire(SOCKET_EVENTS.gameInfo, header);
    feed.stop();
    expect(emitted).toContainEqual([SOCKET_EVENTS.unsubscribe, { gameId: 1 }]);
    fire(SOCKET_EVENTS.play, play(1));
    expect(events).toHaveLength(0);
  });

  it("on a not-yet-connected socket subscribes once from the connect handler", () => {
    const { socket, emitted, fire } = fakeSocket(false);
    const feed = createLiveFeed(socket, { gameId: "1", playerId: "h1" });
    feed.start();
    expect(emitted).toEqual([]);
    fire("connect", undefined);
    expect(emitted).toEqual([[SOCKET_EVENTS.subscribe, { gameId: 1, fromOrder: 0 }]]);
    fire(SOCKET_EVENTS.gameInfo, header);
    fire(SOCKET_EVENTS.play, play(1));
    fire(SOCKET_EVENTS.play, play(2));
    fire("connect", undefined);
    expect(emitted.at(-1)).toEqual([SOCKET_EVENTS.subscribe, { gameId: 1, fromOrder: 2 }]);
  });

  it("rejects a non-positive-integer game id", () => {
    const { socket } = fakeSocket();
    expect(() => createLiveFeed(socket, { gameId: "g1", playerId: "h1" })).toThrow('LiveFeed: gameId must be a positive integer, got "g1"');
    expect(() => createLiveFeed(socket, { gameId: "", playerId: "h1" })).toThrow("positive integer");
    expect(() => createLiveFeed(socket, { gameId: "1.5", playerId: "h1" })).toThrow("positive integer");
  });
});
