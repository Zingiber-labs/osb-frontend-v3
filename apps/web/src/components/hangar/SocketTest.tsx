"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

const SOCKET_URL = "";
const GAME_ID = "";
const UPDATE_INTERVAL = 0;
const PSEUDO_REPLAY_INTERVAL = 0;
const PSEUDO_REPLAY_PLAY_COUNT = 0;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type SubscriptionStatus = "unsubscribed" | "subscribing" | "subscribed";

export const SocketTest = () => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("unsubscribed");

  const [latestGameUpdate, setLatestGameUpdate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [isPseudoRepeating, setIsPseudoRepeating] = useState(false);
  const [pseudoPlayIndex, setPseudoPlayIndex] = useState(0);
  const [pseudoPlays, setPseudoPlays] = useState<any[]>([]);
  const [pseudoGameUpdate, setPseudoGameUpdate] = useState<any>(null);
  const [highlightedPlayId, setHighlightedPlayId] = useState<string | null>(
    null
  );
  const socketRef = useRef<Socket | null>(null);
  const previousUpdateRef = useRef<string | null>(null);
  const pseudoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      const socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🔌 [SOCKET] connect", { id: socket.id });
        setStatus("connected");
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 [SOCKET] disconnect", { reason });
        setStatus("disconnected");
        setSubscriptionStatus("unsubscribed");
      });

      socket.on("connect_error", (err) => {
        console.error("🔌 [SOCKET] connect_error", err);
        setStatus("error");
        setError(err.message);
      });

      socket.on("error", (err) => {
        console.error("🔌 [SOCKET] error", err);
        setError(err.message || "Unknown error");
      });

      // Listen for specific game events
      socket.on("connection-success", (data) => {
        console.log("✅ [SOCKET] connection-success", data);
      });

      socket.on("subscription-success", (data) => {
        console.log("✅ [SOCKET] subscription-success", data);
        setSubscriptionStatus("subscribed");
      });

      socket.on("game-update", (data) => {
        console.log("📊 [SOCKET] game-update", data);

        // Check if game has ended
        const latestPlay = data?.latestPlays?.[0];
        const isEndGame = latestPlay?.actionType === "End Game";

        if (isEndGame && !gameEnded) {
          console.log("🏁 [SOCKET] Game ended - unsubscribing automatically");
          setGameEnded(true);
          // Unsubscribe directly using socket
          socket.emit("unsubscribe-game", { espnGameId: GAME_ID });
          setLatestGameUpdate(data);
          return;
        }

        // Skip if game has already ended
        if (gameEnded) {
          console.log("⏸️ [SOCKET] Skipping update - game has ended");
          return;
        }

        // Check if data has actually changed by comparing totalPlays or latest play actionNumber
        const currentUpdateKey =
          data?.totalPlays?.toString() ||
          latestPlay?.actionNumber?.toString() ||
          JSON.stringify(data);

        if (previousUpdateRef.current === currentUpdateKey) {
          console.log(
            "⏭️ [SOCKET] Skipping duplicate update - no changes detected"
          );
          return;
        }

        // Update only if data has changed
        previousUpdateRef.current = currentUpdateKey;
        setLatestGameUpdate(data);

        // Highlight the latest play (first in array, newest event)
        if (data?.latestPlays && data.latestPlays.length > 0) {
          const latestPlay = data.latestPlays[0];
          const playId = `${latestPlay.actionNumber || "latest"}-${Date.now()}`;
          setHighlightedPlayId(playId);

          // Clear previous timeout
          if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
          }

          // Fade out highlight after 3 seconds
          highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedPlayId(null);
          }, 3000);
        }
      });

      socket.on("unsubscription-success", (data) => {
        console.log("✅ [SOCKET] unsubscription-success", data);
        setSubscriptionStatus("unsubscribed");
      });

      // Listen for any other custom events
      socket.onAny((eventName, ...args) => {
        // Skip events we're already handling explicitly
        if (
          ![
            "connect",
            "disconnect",
            "connect_error",
            "error",
            "connection-success",
            "subscription-success",
            "game-update",
            "unsubscription-success",
          ].includes(eventName)
        ) {
          console.log(`📨 [SOCKET] ${eventName}`, ...args);
        }
      });
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Failed to create socket connection");
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      // Unsubscribe before disconnecting
      if (subscriptionStatus === "subscribed") {
        unsubscribeGame();
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
      setSubscriptionStatus("unsubscribed");
    }
  };

  const subscribeGame = () => {
    if (!socketRef.current?.connected) {
      setError("Not connected to socket");
      return;
    }

    setSubscriptionStatus("subscribing");
    setError(null);
    setGameEnded(false);
    previousUpdateRef.current = null; // Reset previous update tracking

    const payload = {
      espnGameId: GAME_ID,
      interval: UPDATE_INTERVAL,
    };
    console.log("📤 [SOCKET] emit: subscribe-game", payload);
    socketRef.current.emit("subscribe-game", payload);
  };

  const unsubscribeGame = () => {
    if (!socketRef.current?.connected) {
      return;
    }

    const payload = {
      espnGameId: GAME_ID,
    };
    console.log("📤 [SOCKET] emit: unsubscribe-game", payload);
    socketRef.current.emit("unsubscribe-game", payload);
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pseudoIntervalRef.current) {
        clearInterval(pseudoIntervalRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Handle pseudo repeat interval
  useEffect(() => {
    if (isPseudoRepeating && pseudoPlays.length > 0) {
      pseudoIntervalRef.current = setInterval(() => {
        setPseudoPlayIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= pseudoPlays.length) {
            // Reached the end, stop repeating
            setIsPseudoRepeating(false);
            return prev;
          }
          return nextIndex;
        });
      }, PSEUDO_REPLAY_INTERVAL * 1000);

      return () => {
        if (pseudoIntervalRef.current) {
          clearInterval(pseudoIntervalRef.current);
        }
      };
    } else {
      if (pseudoIntervalRef.current) {
        clearInterval(pseudoIntervalRef.current);
        pseudoIntervalRef.current = null;
      }
    }
  }, [isPseudoRepeating, pseudoPlays.length]);

  // Update pseudo game update when index changes
  useEffect(() => {
    if (
      isPseudoRepeating &&
      pseudoPlays.length > 0 &&
      pseudoPlayIndex < pseudoPlays.length
    ) {
      const currentPlays = pseudoPlays.slice(0, pseudoPlayIndex + 1);
      setPseudoGameUpdate({
        ...latestGameUpdate,
        latestPlays: currentPlays,
        totalPlays: currentPlays.length,
        _isPseudo: true,
      });

      // Highlight the latest play (last in chronological array, which becomes first after reverse)
      if (currentPlays.length > 0) {
        const latestPlay = currentPlays[currentPlays.length - 1];
        const playId = `${
          latestPlay.actionNumber || "pseudo"
        }-${pseudoPlayIndex}`;
        setHighlightedPlayId(playId);

        // Clear previous timeout
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }

        // Fade out highlight after 3 seconds
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedPlayId(null);
        }, 3000);
      }
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [pseudoPlayIndex, isPseudoRepeating, pseudoPlays, latestGameUpdate]);

  const startPseudoRepeat = () => {
    if (
      !latestGameUpdate?.latestPlays ||
      latestGameUpdate.latestPlays.length === 0
    ) {
      setError("No game data available to repeat");
      return;
    }

    // Events are sorted newest first (actionNumber descending)
    // Get the last N events until the end of the game (first N in the array)
    const last50Plays = latestGameUpdate.latestPlays.slice(
      0,
      PSEUDO_REPLAY_PLAY_COUNT
    );

    // Reverse to show chronologically (oldest first, newest last)
    const chronologicalPlays = [...last50Plays].reverse();

    setPseudoPlays(chronologicalPlays);
    setPseudoPlayIndex(0);
    setIsPseudoRepeating(true);

    // Show first play immediately (oldest event)
    setPseudoGameUpdate({
      ...latestGameUpdate,
      latestPlays: [chronologicalPlays[0]],
      totalPlays: 1,
      _isPseudo: true,
    });
  };

  const stopPseudoRepeat = () => {
    setIsPseudoRepeating(false);
    setPseudoPlayIndex(0);
    setPseudoGameUpdate(null);
    setHighlightedPlayId(null);
    if (pseudoIntervalRef.current) {
      clearInterval(pseudoIntervalRef.current);
      pseudoIntervalRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

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
    <div className="rounded-2xl border border-primary-orange/80 bg-orange-24/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[22px] font-extrabold tracking-wider text-cyan-300">
          SOCKET TEST
        </h2>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-semibold text-white/90 capitalize">
            {status}
          </span>
        </div>
      </div>

      <div className="mb-4 text-xs text-white/70">
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
        <div className="flex gap-2">
          <Button
            onClick={subscribeGame}
            disabled={
              status !== "connected" ||
              subscriptionStatus === "subscribed" ||
              subscriptionStatus === "subscribing"
            }
            variant="default"
            size="sm"
            className="flex-1"
          >
            Subscribe to Game
          </Button>
          <Button
            onClick={unsubscribeGame}
            disabled={subscriptionStatus !== "subscribed"}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Unsubscribe
          </Button>
        </div>
        <div className="text-sm text-white">
          <p>
            Game ID: <span className="font-mono text-cyan-400">{GAME_ID}</span>
          </p>
          <p>
            Interval: <span className="font-mono">{UPDATE_INTERVAL}s</span>
          </p>
          <p>
            Subscription:{" "}
            <span className="font-semibold capitalize text-white/80">
              {subscriptionStatus}
            </span>
          </p>
          {gameEnded && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-yellow-400 font-semibold">
                ⏸️ Game has ended - updates stopped
              </p>
              {!isPseudoRepeating ? (
                <Button
                  onClick={startPseudoRepeat}
                  variant="outline"
                  size="sm"
                  className="text-xs text-black/80"
                >
                  🔄 Repeat Last{" "}
                  <span className="font-mono! font-bold">
                    {PSEUDO_REPLAY_PLAY_COUNT}
                  </span>{" "}
                  Events
                </Button>
              ) : (
                <Button
                  onClick={stopPseudoRepeat}
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                >
                  ⏹️ Stop Repeat
                </Button>
              )}
            </div>
          )}
          {isPseudoRepeating && (
            <div className="mt-2 rounded-lg bg-purple-500/20 border border-purple-500/50 p-2">
              <p className="text-md text-purple-300 font-semibold normal-case!">
                🔄 Pseudo Repeating: Showing play {pseudoPlayIndex + 1} of{" "}
                {pseudoPlays.length} -- every {PSEUDO_REPLAY_INTERVAL} seconds
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 p-3">
          <p className="text-sm text-red-300 font-semibold">Error:</p>
          <p className="text-xs text-red-200 mt-1">{error}</p>
        </div>
      )}

      {(pseudoGameUpdate || latestGameUpdate) && (
        <div className="mb-4 rounded-lg bg-cyan-500/20 border border-cyan-500/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-cyan-300">
                {pseudoGameUpdate?._isPseudo
                  ? "🔄 Pseudo Replay"
                  : "Latest Game Update"}
              </p>
              {pseudoGameUpdate?._isPseudo && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 font-semibold">
                  REPLAY MODE
                </span>
              )}
            </div>
            <span className="text-xs text-cyan-400/70">
              {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Game Info */}
          {(pseudoGameUpdate || latestGameUpdate)?.gameInfo && (
            <div className="mb-4 rounded-lg bg-black/40 p-4 border border-cyan-500/50">
              <p className="text-xs font-semibold text-cyan-300 mb-3 tracking-wider">
                Game Score
              </p>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-xs text-white/80 mb-1 font-semibold tracking-wide">
                    Away Team
                  </p>
                  <p className="text-lg font-bold text-white mb-1">
                    {(pseudoGameUpdate || latestGameUpdate).gameInfo.awayTeam ||
                      "N/A"}
                  </p>
                  <p className="text-2xl font-extrabold text-cyan-300">
                    {(pseudoGameUpdate || latestGameUpdate).gameInfo
                      .awayScore ?? 0}
                  </p>
                </div>
                <div className="px-4 text-center border-x border-cyan-500/30">
                  <p className="text-xs text-white/80 mb-1 font-semibold tracking-wide">
                    Status
                  </p>
                  <p className="text-sm font-bold text-yellow-300 mb-2">
                    {(pseudoGameUpdate || latestGameUpdate).gameInfo.status ||
                      "N/A"}
                  </p>
                  {(pseudoGameUpdate || latestGameUpdate).gameInfo.period && (
                    <div className="mb-1">
                      <p className="text-xs text-white/70 mb-0.5">Period</p>
                      <p className="text-sm font-semibold text-white">
                        Q
                        {(pseudoGameUpdate || latestGameUpdate).gameInfo.period}
                      </p>
                    </div>
                  )}
                  {(pseudoGameUpdate || latestGameUpdate).gameInfo.clock && (
                    <div>
                      <p className="text-xs text-white/70 mb-0.5">Time</p>
                      <p className="text-sm font-semibold text-white font-mono">
                        {(pseudoGameUpdate || latestGameUpdate).gameInfo.clock}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-white/80 mb-1 font-semibold tracking-wide">
                    Home Team
                  </p>
                  <p className="text-lg font-bold text-white mb-1">
                    {(pseudoGameUpdate || latestGameUpdate).gameInfo.homeTeam ||
                      "N/A"}
                  </p>
                  <p className="text-2xl font-extrabold text-cyan-300">
                    {(pseudoGameUpdate || latestGameUpdate).gameInfo
                      .homeScore ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Plays */}
          {(pseudoGameUpdate || latestGameUpdate)?.latestPlays &&
            (pseudoGameUpdate || latestGameUpdate).latestPlays.length > 0 && (
              <div className="rounded-lg bg-black/30 border border-cyan-500/30">
                <div className="p-3 border-b border-cyan-500/30">
                  <p className="text-xs font-semibold text-cyan-300">
                    LATEST PLAYS <span className="font-mono! font-bold">(</span>
                    {(pseudoGameUpdate || latestGameUpdate).latestPlays.length}
                    <span className="font-mono! font-bold">)</span>
                  </p>
                  {(pseudoGameUpdate || latestGameUpdate).totalPlays && (
                    <p className="text-xs text-white/60 mt-1">
                      {pseudoGameUpdate?._isPseudo
                        ? `Showing: ${
                            (pseudoGameUpdate || latestGameUpdate).latestPlays
                              .length
                          } of ${pseudoPlays.length} plays`
                        : `Total Plays: ${
                            (pseudoGameUpdate || latestGameUpdate).totalPlays
                          }`}
                    </p>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                  {(pseudoGameUpdate?._isPseudo
                    ? [
                        ...(pseudoGameUpdate || latestGameUpdate).latestPlays,
                      ].reverse()
                    : (pseudoGameUpdate || latestGameUpdate).latestPlays
                  ).map((play: any, idx: number) => {
                    const isEndGame = play.actionType === "End Game";
                    const isEndPeriod = play.actionType === "End Period";
                    const playId = `${play.actionNumber || idx}-${idx}`;
                    // Check if this play should be highlighted (always highlight the first one if it matches)
                    const isHighlighted =
                      idx === 0 &&
                      highlightedPlayId !== null &&
                      (highlightedPlayId.includes(String(play.actionNumber)) ||
                        highlightedPlayId === playId);
                    return (
                      <div
                        key={playId}
                        className={`rounded p-3 border transition-all duration-500 ${
                          isHighlighted
                            ? "bg-cyan-500/50 border-cyan-400/90 shadow-lg shadow-cyan-500/30"
                            : isEndGame
                            ? "bg-red-500/30 border-red-500/70"
                            : isEndPeriod
                            ? "bg-yellow-500/30 border-yellow-500/70"
                            : "bg-white/10 border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              {play.actionNumber && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-white/70 font-semibold">
                                    Action:
                                  </span>
                                  <span className="text-xs font-mono text-cyan-300 font-bold">
                                    #{play.actionNumber}
                                  </span>
                                </div>
                              )}
                              {play.period && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-white/70 font-semibold">
                                    Quarter:
                                  </span>
                                  <span className="text-xs text-white font-semibold">
                                    Q{play.period}
                                  </span>
                                </div>
                              )}
                              {play.clock && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-white/70 font-semibold">
                                    Time:
                                  </span>
                                  <span className="text-xs font-mono text-white font-semibold">
                                    {play.clock}
                                  </span>
                                </div>
                              )}
                            </div>
                            {play.actionType && (
                              <div className="mb-2">
                                <span className="text-xs text-white/70 font-semibold mr-2">
                                  Type:
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded font-bold ${
                                    isEndGame
                                      ? "bg-red-500/50 text-red-100 border border-red-400/50"
                                      : isEndPeriod
                                      ? "bg-yellow-500/50 text-yellow-100 border border-yellow-400/50"
                                      : "bg-primary-orange/50 text-orange-100 border border-primary-orange/50"
                                  }`}
                                >
                                  {play.actionType}
                                </span>
                              </div>
                            )}
                            <div className="mb-2">
                              <span className="text-xs text-white/70 font-semibold mb-1 block">
                                Description:
                              </span>
                              <p className="text-sm text-white font-medium leading-relaxed">
                                {play.description || "No description"}
                              </p>
                            </div>
                            {(play.scoreHome !== undefined ||
                              play.scoreAway !== undefined) && (
                              <div className="mt-3 pt-2 border-t border-white/20">
                                <span className="text-xs text-white/70 font-semibold mr-2">
                                  Score:
                                </span>
                                <span className="text-sm text-white font-bold">
                                  <span className="text-lg text-orange-400 font-semibold">
                                    {(pseudoGameUpdate || latestGameUpdate)
                                      .gameInfo?.awayTeam || "Away"}{" "}
                                  </span>
                                  {play.scoreAway ?? 0} - {play.scoreHome ?? 0}{" "}
                                  <span className="text-lg text-orange-400 font-semibold">
                                    {(pseudoGameUpdate || latestGameUpdate)
                                      .gameInfo?.homeTeam || "Home"}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
