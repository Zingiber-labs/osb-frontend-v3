"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { BoxScoreCard } from "./BoxScoreCard";
import { mapBoxScoreToTeams, type BoxScoreTeam } from "./mapBoxScoreToTeams";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type SubscriptionStatus = "idle" | "subscribing" | "subscribed";

type TodayGame = {
  date: string;
  dateUtc: string;
  homeTeam: string;
  idGame: number;
  status: string;
  visitorTeam: string;
};

export function SocketScoreBoard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("idle");

  const [games, setGames] = useState<TodayGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [teams, setTeams] = useState<BoxScoreTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    if (socket?.connected) return;

    setStatus("connecting");
    setError(null);

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("[SCOREBOARD] connected", s.id);
      setStatus("connected");
      console.log("[SCOREBOARD] emit: getTodayGames");
      s.emit("getTodayGames", {});
    });

    s.on("disconnect", (reason) => {
      console.log("[SCOREBOARD] disconnect", { reason });
      setStatus("disconnected");
      setSubscriptionStatus("idle");
    });

    s.on("connect_error", (err) => {
      console.error("[SCOREBOARD] connect_error", err);
      setStatus("error");
      setError(err.message);
    });

    s.on("error", (err: any) => {
      console.error("[SCOREBOARD] error", err);
      setError(err.message || "Unknown socket error");
    });

    s.on("todayGamesList", (payload: TodayGame[]) => {
      console.log("[SCOREBOARD] todayGamesList", payload);
      setGames(payload);
    });

    s.on("boxScoreUpdate", (payload: any) => {
      console.log("[SCOREBOARD] boxScoreUpdate", payload);
      const mapped = mapBoxScoreToTeams(payload);
      setTeams(mapped);
      setSubscriptionStatus("subscribed");
    });

    s.onAny((eventName, ...args) => {
      if (!["boxScoreUpdate"].includes(eventName)) {
        console.log(`[SCOREBOARD] ${eventName}`, ...args);
      }
    });
  };

  const disconnect = () => {
    socket?.disconnect();
    setStatus("disconnected");
    setSubscriptionStatus("idle");
    setTeams(null);
  };

  const subscribeToSelectedGame = () => {
    if (!socket?.connected) {
      setError("Socket not connected");
      return;
    }
    if (!selectedGameId) {
      setError("Please select a game");
      return;
    }

    setError(null);
    setSubscriptionStatus("subscribing");

    const payload = { gameId: selectedGameId };
    console.log("[SCOREBOARD] emit: subscribeToGame", payload);
    socket.emit("subscribeToGame", payload);
  };

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold tracking-wider text-cyan-300">
            SCOREBOARD SOCKET
          </h2>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-semibold text-white/90 capitalize">
              {status}
            </span>
          </div>
        </div>

        <div className="mb-3 text-xs text-white/70">
          <p className="font-mono break-all">{SOCKET_URL}</p>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={connect}
              disabled={status === "connected" || status === "connecting"}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Connect
            </Button>
            <Button
              onClick={disconnect}
              disabled={status === "disconnected"}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/80">
              Select game to subscribe
            </label>
            <div className="flex flex-wrap gap-2">
              <Select
                onValueChange={(value) => {
                  setSelectedGameId(Number(value));
                }}
              >
                <SelectTrigger className="min-w-[500px] text-white bg-orange-dark cursor-pointer">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>

                <SelectContent className="">
                  <SelectGroup>
                    {games.map((op: TodayGame) => {
                      return (
                        <SelectItem key={op.idGame} value={String(op.idGame)}>
                          {`${op.homeTeam} vs ${op.visitorTeam}`}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                onClick={subscribeToSelectedGame}
                disabled={
                  !selectedGameId ||
                  status !== "connected" ||
                  subscriptionStatus === "subscribing"
                }
                size="sm"
                className="rounded-full"
              >
                {subscriptionStatus === "subscribing"
                  ? "Subscribing..."
                  : "Subscribe"}
              </Button>
            </div>

            <p className="text-xs text-white/70">
              Subscription:{" "}
              <span className="font-semibold text-white/90">
                {subscriptionStatus}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-2 rounded-lg bg-red-500/20 border border-red-500/50 p-3">
            <p className="text-sm text-red-300 font-semibold">Error:</p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
        )}
      </div>

      {teams && (
        <div className="my-4 w-full overflow-x-auto custom-scroll-thin">
          <BoxScoreCard teams={teams} />
        </div>
      )}
    </div>
  );
}
