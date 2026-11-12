import { clockOf, createPlayMapper, type Feed, type GameEvent, type GameHeader, type PlayMapper, type RecordedPlay } from "@osb/gameplay";

export const SOCKET_EVENTS = {
  subscribe: "subscribeToGamePlays",
  unsubscribe: "unsubscribeFromGamePlays",
  gameInfo: "gameInfo",
  play: "gamePlay",
} as const;

/** The slice of a socket.io client the feed needs; tests pass a fake. */
export type SocketLike = {
  emit(event: string, payload?: unknown): void;
  on(event: string, cb: (payload: any) => void): void;
  off(event: string, cb: (payload: any) => void): void;
};

export type LiveFeed = Feed & {
  onGame(cb: (game: GameHeader) => void): () => void;
  lastOrder(): number;
};

/**
 * Feed over the backend's play-by-play socket. Transport only: translation to GameEvent
 * is the package's play mapper, the same one the replay feed uses.
 */
export function createLiveFeed(socket: SocketLike, opts: { gameId: string; playerId: string }): LiveFeed {
  const gameId = Number(opts.gameId);
  const eventListeners = new Set<(e: GameEvent) => void>();
  const gameListeners = new Set<(g: GameHeader) => void>();

  let mapper: PlayMapper | null = null;
  let game: GameHeader | null = null;
  let last = 0;
  let tipped = false;
  let running = false;
  const pending: RecordedPlay[] = [];
  const ready: GameEvent[] = [];

  const publish = (e: GameEvent) => {
    for (const l of eventListeners) l(e);
  };

  const translate = (play: RecordedPlay) => {
    if (!mapper) return;
    if (play.order <= last) return;
    last = play.order;
    if (!tipped) {
      tipped = true;
      ready.push({ kind: "tipoff", at: clockOf(play) });
    }
    const e = mapper.toEvent(play);
    if (e) ready.push(e);
  };

  const drain = () => {
    while (running && ready.length > 0) publish(ready.shift()!);
  };

  const onGameInfo = (g: GameHeader) => {
    game = g;
    mapper = createPlayMapper(g, opts.playerId);
    for (const l of gameListeners) l(g);
    for (const p of pending.splice(0)) translate(p);
    drain();
  };

  const onPlay = (p: RecordedPlay) => {
    if (!mapper) {
      pending.push(p);
      return;
    }
    translate(p);
    drain();
  };

  const subscribe = () => socket.emit(SOCKET_EVENTS.subscribe, { gameId, fromOrder: last });
  const onConnect = () => subscribe();

  let attached = false;
  const attach = () => {
    if (attached) return;
    attached = true;
    socket.on(SOCKET_EVENTS.gameInfo, onGameInfo);
    socket.on(SOCKET_EVENTS.play, onPlay);
    socket.on("connect", onConnect);
  };
  const detach = () => {
    if (!attached) return;
    attached = false;
    socket.off(SOCKET_EVENTS.gameInfo, onGameInfo);
    socket.off(SOCKET_EVENTS.play, onPlay);
    socket.off("connect", onConnect);
  };

  let subscribed = false;

  return {
    start() {
      running = true;
      attach();
      if (!subscribed) {
        subscribed = true;
        subscribe();
      }
      drain();
    },
    pause() {
      running = false;
    },
    step() {
      const e = ready.shift();
      if (e) publish(e);
    },
    stop() {
      running = false;
      detach();
      if (subscribed) {
        subscribed = false;
        socket.emit(SOCKET_EVENTS.unsubscribe, { gameId });
      }
      pending.length = 0;
      ready.length = 0;
    },
    onEvent(cb) {
      eventListeners.add(cb);
      return () => {
        eventListeners.delete(cb);
      };
    },
    onGame(cb) {
      gameListeners.add(cb);
      if (game) cb(game);
      return () => {
        gameListeners.delete(cb);
      };
    },
    lastOrder: () => last,
  };
}
