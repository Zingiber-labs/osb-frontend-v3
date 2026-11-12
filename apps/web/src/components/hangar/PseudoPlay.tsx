"use client";

import { useSession } from "@/hooks/useSession";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePlayByPlay } from "@/hooks/playbyplay/usePlayByPlay";

interface PseudoPlayProps {
  onClose?: () => void;
}

export interface Score {
  away: number;
  home: number;
}

export interface Play {
  description: string;
  eventNum: number;
  gameClock: string;
  period: number;
  score: Score;
  teamId: number;
  timeActual: string;
  typeId: string;
  typeText: string;
  x: number;
  y: number;
}

const PLAY_INTERVAL_MS = 700;

export const PseudoPlay = ({ onClose }: PseudoPlayProps) => {
  const { data, isLoading, error } = usePlayByPlay();

  const plays: Play[] = useMemo(() => {
    const d: any = data ?? {};
    if (Array.isArray(d.plays)) return d.plays;
    return [];
  }, [data]);

  const { data: session } = useSession();
  const user = session;
  const isGuest = session?.type === "guest";
  const [showLines, setShowLines] = useState({
    command: false,
    init: false,
    assets: false,
    server: false,
    ready: false,
    prompt: false,
  });

  const [visiblePlays, setVisiblePlays] = useState<Play[]>([]);
  const intervalRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

    // Extract email from user object or use guest identifier
  const userEmail =
    user?.email || (isGuest ? "guest@hangar.local" : "user@hangar.local");
  const username = useMemo(() => userEmail.split("@")[0], [userEmail]);

  useEffect(() => {
    const delays = {
      command: 500,
      init: 1000,
      assets: 2000,
      server: 3000,
      ready: 4000,
      prompt: 4500,
    };
    const timers = Object.entries(delays).map(([key, delay]) =>
      setTimeout(() => {
        setShowLines((prev) => ({ ...prev, [key]: true }));
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [showLines, visiblePlays.length]);

  useEffect(() => {
    if (!showLines.ready) return;

    if (!plays.length) {
      setVisiblePlays([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisiblePlays([]);
    let i = 0;

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.table(plays.slice(0, Math.min(5, plays.length)));
    }

    intervalRef.current = setInterval(() => {
      setVisiblePlays((prev) => {
        const next = plays[i];
        if (!next) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }
        i += 1;
        return [...prev, next];
      });
    }, PLAY_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showLines.ready, plays]);

  const eventColor = (typeText: string) => {
    const t = (typeText || "").toLowerCase();
    if (t.includes("goal") || t.includes("score")) return "text-green-300";
    if (t.includes("penalty") || t.includes("foul")) return "text-red-300";
    if (t.includes("shot")) return "text-blue-300";
    if (t.includes("save") || t.includes("block")) return "text-yellow-300";
    return "text-gray-300";
  };

  const renderPlayLine = (p: Play) => (
    <div key={`${p.eventNum}-${p.timeActual ?? ""}`} className="mb-1">
      <span className="text-gray-400">
        [P{p.period} {p.gameClock}]{" "}
      </span>
      <span className={`${eventColor(p.typeText)} font-semibold`}>
        {p.typeText}
      </span>
      <span className="text-gray-300"> — {p.description}</span>
      <span className="text-gray-400">{`  (Score: H ${p.score?.home ?? 0} - A ${
        p.score?.away ?? 0
      })`}</span>
    </div>
  );

  return (
    <div className="w-full bg-black border border-gray-600 rounded-lg p-4 font-mono text-green-400 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="ml-4 text-gray-400 text-sm">
            Terminal - PseudoPlay
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded hover:bg-gray-700"
            aria-label="Close terminal"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="text-sm max-h-80 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {isLoading && (
          <div className="text-gray-400 animate-pulse">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-red-400">Failed to load play-by-play data.</div>
        )}

        {!isLoading && !error && (
          <>
            {showLines.command && (
              <div className="mb-2">
                <span className="text-blue-400">{username}@hangar:~$</span>
                <span className="ml-2">./pseudo-play --init</span>
              </div>
            )}
            {showLines.init && (
              <div className="mb-2 text-gray-300">
                Initializing pseudo-play environment...
              </div>
            )}
            {showLines.assets && (
              <div className="mb-2 text-gray-300">Loading game assets... ✓</div>
            )}
            {showLines.server && (
              <div className="mb-2 text-gray-300">
                Connecting to matchmaking server... ✓
              </div>
            )}
            {showLines.ready && (
              <div className="mb-2 text-green-300">
                Ready to simulate gameplay
              </div>
            )}

            {showLines.ready && !!plays.length && (
              <div className="mb-2 text-gray-400">
                Found {plays.length} plays. Streaming...
              </div>
            )}

            {visiblePlays.map(renderPlayLine)}

            {showLines.ready && !plays.length && (
              <div className="mb-2 text-gray-500">
                No play-by-play data available.
              </div>
            )}

            {showLines.prompt && (
              <div className="flex items-center mt-1">
                <span className="text-blue-400">{username}@hangar:~$</span>
                <span className="ml-2 animate-pulse">_</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
