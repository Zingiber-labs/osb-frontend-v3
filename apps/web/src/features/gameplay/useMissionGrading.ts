"use client";

import type { GradingView, MyPlayerStats } from "@osb/gameplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { isGraded, processGame, type MissionRewards, type ProcessGameResponse } from "./api";

/** Poll period for process-game. Overridable through the env so tests do not wait 5 s per refetch. */
export const GRADING_INTERVAL_MS = Number(process.env.GAMEPLAY_GRADING_INTERVAL_MS ?? 5000);

export type GradingInput = {
  userId: string | undefined;
  gameId: string;
  playerId: string;
  stats: MyPlayerStats;
  finished: boolean;
  engineWon: boolean;
  rewards: MissionRewards | undefined;
  enabled: boolean;
};

/**
 * Polls process-game with the engine's live stats and turns the backend's answer into a GradingView.
 * The engine decides what the player sees; the backend decides what the player earns.
 */
export function useMissionGrading(input: GradingInput): GradingView | undefined {
  const { userId, gameId, playerId, stats, finished, engineWon, rewards, enabled } = input;
  const queryClient = useQueryClient();
  const latest = useRef({ stats, finished });
  latest.current = { stats, finished };

  const query = useQuery<ProcessGameResponse>({
    queryKey: ["gameplay", "grading", userId, gameId, playerId],
    enabled: enabled && Boolean(userId),
    queryFn: () => {
      const { stats: s, finished: f } = latest.current;
      // Rebounds and assists are not tracked by the engine; the backend requires the fields.
      return processGame({
        userId: userId!,
        idGame: Number(gameId),
        idPlayer: Number(playerId),
        points: s.pts,
        rebounds: 0,
        blocks: s.blk,
        assists: 0,
        steals: s.stl,
        isGameFinished: f,
      });
    },
    refetchInterval: (q) => {
      const data = q.state.data;
      if (data && isGraded(data, latest.current.finished)) return false;
      return GRADING_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
  });

  const data = query.data;
  const graded = Boolean(data && isGraded(data, finished));

  useEffect(() => {
    if (!graded) return;
    queryClient.invalidateQueries({ queryKey: ["profile-data"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [graded, queryClient]);

  useEffect(() => {
    if (!graded || !finished || !data) return;
    const completed = data.missionsCompleted === true;
    if (completed !== engineWon) {
      console.warn("mission grading: backend and engine disagree", { backend: data, engineWon });
    }
  }, [graded, finished, data, engineWon]);

  if (!finished) return undefined;
  if (query.error) return { status: "error", message: "Could not reach mission control." };
  if (!data || !graded) return { status: "grading" };
  const completed = data.missionsCompleted === true;
  return completed ? { status: "graded", completed, rewards } : { status: "graded", completed };
}
