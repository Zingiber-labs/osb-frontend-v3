"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export type BoxScorePayload = {
  id: number;
  status?: string;
  time?: string | number | null;
  home_score?: number;
  visitor_score?: number;
  home_ot1?: number;
  home_ot2?: number;
  home_ot3?: number;
  visitor_ot1?: number;
  visitor_ot2?: number;
  visitor_ot3?: number;
  [k: string]: unknown;
};

export type GameSocketState = {
  boxScore: BoxScorePayload | null;
  receivedAt: number | null;
};

export const useGameSocket = (gameId: number | string | null | undefined) => {
  const [state, setState] = useState<GameSocketState>({
    boxScore: null,
    receivedAt: null,
  });

  useEffect(() => {
    if (!gameId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      socket.emit("subscribeToGame", { gameId: Number(gameId) });
    });

    socket.on("boxScoreUpdate", (payload: BoxScorePayload) => {
      setState({ boxScore: payload, receivedAt: Date.now() });
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId]);

  return state;
};
