"use client";

import { createReplayFeed, games, type Feed, type GameHeader } from "@osb/gameplay";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { createLiveFeed, type LiveFeedError, type SocketLike } from "./liveFeed";

export type GameFeedMode = "live" | "replay";
export type GameFeed = { feed: Feed | null; game: GameHeader | null; myPlayerId: string; mode: GameFeedMode; error: LiveFeedError | null };

export function feedMode(env: string | undefined): GameFeedMode {
  return env === "replay" ? "replay" : "live";
}

type Socket = SocketLike & { disconnect(): void };

function defaultConnect(): Socket {
  const s = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  // socket.io emits reconnect_failed on the manager, not the socket; route it there so the feed sees one surface.
  return {
    get connected() {
      return s.connected;
    },
    emit: (event, payload) => {
      s.emit(event, payload);
    },
    on: (event, cb) => {
      if (event === "reconnect_failed") s.io.on("reconnect_failed", cb as () => void);
      else s.on(event, cb);
    },
    off: (event, cb) => {
      if (event === "reconnect_failed") s.io.off("reconnect_failed", cb as () => void);
      else s.off(event, cb);
    },
    disconnect: () => {
      s.disconnect();
    },
  };
}

/**
 * Picks the feed for a game. Live: one socket per mount, closed on unmount.
 * Replay (NEXT_PUBLIC_GAMEPLAY_FEED=replay): the package's recorded fixture, for demos without a backend.
 */
export function useGameFeed(gameId: string, playerId: string, connect: () => Socket = defaultConnect): GameFeed {
  const mode = feedMode(process.env.NEXT_PUBLIC_GAMEPLAY_FEED);
  const [game, setGame] = useState<GameHeader | null>(null);
  const [error, setError] = useState<LiveFeedError | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (mode !== "live") return;
    const s = connect();
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
    // connect stays out of the deps on purpose: an inline factory would change identity every render and reconnect in a loop.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gameId, playerId]);

  const replay = useMemo(() => {
    if (mode !== "replay") return null;
    const fixture = games[0];
    const myPlayerId = fixture.home.players[0].id;
    return { feed: createReplayFeed(fixture, { myPlayerId, speed: 16 }), game: fixture as GameHeader, myPlayerId };
  }, [mode]);

  const live = useMemo(() => {
    if (mode !== "live" || !socket) return null;
    return createLiveFeed(socket, { gameId, playerId });
  }, [mode, socket, gameId, playerId]);

  useEffect(() => {
    if (!live) return;
    const offGame = live.onGame(setGame);
    const offError = live.onError(setError);
    return () => {
      offGame();
      offError();
      setGame(null);
      setError(null);
    };
  }, [live]);

  if (replay) return { feed: replay.feed, game: replay.game, myPlayerId: replay.myPlayerId, mode, error: null };
  return { feed: live, game, myPlayerId: playerId, mode, error };
}
