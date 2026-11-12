import { clockOf, createPlayMapper, type Feed, type GameEvent, type GameHeader, type PlayMapper, type RecordedPlay } from "@osb/gameplay";

export const SOCKET_EVENTS = {
  subscribe: "subscribeToGamePlays",
  unsubscribe: "unsubscribeFromGamePlays",
  gameInfo: "gameInfo",
  play: "gamePlay",
  gameError: "gameError",
} as const;

/** Header wait before the feed gives up and reports a timeout. */
export const HEADER_TIMEOUT_MS = 15000;

export type LiveFeedErrorReason = "timeout" | "disconnected" | "player-not-in-game" | "server";
export type LiveFeedError = { reason: LiveFeedErrorReason; message: string };

/**
 * The slice of a socket.io client the feed needs; tests pass a fake. Besides the contract events the feed listens to
 * "connect", "connect_error" (transient, ignored) and "reconnect_failed" (terminal). socket.io emits the last one on
 * its manager, so the host's adapter must route it there.
 */
export type SocketLike = {
  connected: boolean;
  emit(event: string, payload?: unknown): void;
  on(event: string, cb: (payload: any) => void): void;
  off(event: string, cb: (payload: any) => void): void;
};

export type LiveFeed = Feed & {
  onGame(cb: (game: GameHeader) => void): () => void;
  lastOrder(): number;
  onError(cb: (err: LiveFeedError) => void): () => void;
};

/**
 * Feed over the backend's play-by-play socket. Transport only: translation to GameEvent
 * is the package's play mapper, the same one the replay feed uses.
 */
export function createLiveFeed(socket: SocketLike, opts: { gameId: string; playerId: string; headerTimeoutMs?: number }): LiveFeed {
  const headerTimeoutMs = opts.headerTimeoutMs ?? HEADER_TIMEOUT_MS;
  const gameId = Number(opts.gameId);
  if (!Number.isSafeInteger(gameId) || gameId <= 0) throw new Error(`LiveFeed: gameId must be a positive integer, got "${opts.gameId}"`);
  const eventListeners = new Set<(e: GameEvent) => void>();
  const gameListeners = new Set<(g: GameHeader) => void>();
  const errorListeners = new Set<(err: LiveFeedError) => void>();

  let mapper: PlayMapper | null = null;
  let game: GameHeader | null = null;
  let last = 0;
  let tipped = false;
  let running = false;
  const pending: RecordedPlay[] = [];
  const ready: GameEvent[] = [];

  let headerTimer: ReturnType<typeof setTimeout> | undefined;
  const clearHeaderTimer = () => {
    clearTimeout(headerTimer);
    headerTimer = undefined;
  };

  const fail = (err: LiveFeedError) => {
    clearHeaderTimer();
    for (const l of errorListeners) l(err);
  };

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
    clearHeaderTimer();
    try {
      mapper = createPlayMapper(g, opts.playerId);
    } catch (err) {
      fail({ reason: "player-not-in-game", message: err instanceof Error ? err.message : String(err) });
      return;
    }
    game = g;
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

  let subscribed = false;
  const subscribe = () => {
    subscribed = true;
    socket.emit(SOCKET_EVENTS.subscribe, { gameId, fromOrder: last });
  };
  const onConnect = () => subscribe();
  const onGameError = (p: { gameId: number; message: string }) => fail({ reason: "server", message: p?.message ?? "The game feed reported an error." });
  // connect_error fires on every failed attempt while socket.io keeps retrying; only reconnect_failed is final.
  const onConnectError = () => {};
  const onReconnectFailed = () => fail({ reason: "disconnected", message: "Could not reconnect to the live game feed." });

  let attached = false;
  const attach = () => {
    if (attached) return;
    attached = true;
    socket.on(SOCKET_EVENTS.gameInfo, onGameInfo);
    socket.on(SOCKET_EVENTS.play, onPlay);
    socket.on("connect", onConnect);
    socket.on(SOCKET_EVENTS.gameError, onGameError);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect_failed", onReconnectFailed);
  };
  const detach = () => {
    if (!attached) return;
    attached = false;
    socket.off(SOCKET_EVENTS.gameInfo, onGameInfo);
    socket.off(SOCKET_EVENTS.play, onPlay);
    socket.off("connect", onConnect);
    socket.off(SOCKET_EVENTS.gameError, onGameError);
    socket.off("connect_error", onConnectError);
    socket.off("reconnect_failed", onReconnectFailed);
  };

  return {
    start() {
      running = true;
      attach();
      if (!game && headerTimer === undefined) {
        headerTimer = setTimeout(() => {
          headerTimer = undefined;
          fail({ reason: "timeout", message: "The live game feed did not answer in time." });
        }, headerTimeoutMs);
      }
      // A not-yet-connected socket subscribes from the connect handler; emitting here too would double-subscribe.
      if (!subscribed && socket.connected) subscribe();
      drain();
    },
    pause() {
      running = false;
    },
    step() {
      const e = ready.shift();
      if (e) publish(e);
    },
    // Unsubscribes, detaches, and discards buffered events. `start()` afterwards resubscribes from the last applied order,
    // so events translated but not yet delivered are lost; hosts that only want to hold delivery use `pause()`.
    stop() {
      running = false;
      clearHeaderTimer();
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
    onError(cb) {
      errorListeners.add(cb);
      return () => {
        errorListeners.delete(cb);
      };
    },
    lastOrder: () => last,
  };
}
