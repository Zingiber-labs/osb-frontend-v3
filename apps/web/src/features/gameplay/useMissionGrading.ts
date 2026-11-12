"use client";

import type { GradingView, MyPlayerStats } from "@osb/gameplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { isGraded, processGame, type MissionRewards, type ProcessGameResponse } from "./api";

/** Poll period for process-game. Overridable through the env so tests do not wait 5 s per refetch. */
export const GRADING_INTERVAL_MS = Number(process.env.GAMEPLAY_GRADING_INTERVAL_MS) || 5000;

type GradingResult = { res: ProcessGameResponse; sentFinished: boolean };

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
  const queryKey = ["gameplay", "grading", userId, gameId, playerId];
  // Once graded, stop posting (no re-post on observer remount while the result is cached).
  const cached = queryClient.getQueryData<GradingResult>(queryKey);
  const alreadyGraded = cached ? isGraded(cached.res, cached.sentFinished) : false;

  const query = useQuery<GradingResult>({
    queryKey,
    enabled: enabled && Boolean(userId) && !alreadyGraded,
    queryFn: async () => {
      const { stats: s, finished: f } = latest.current;
      // Rebounds and assists are not tracked by the engine; the backend requires the fields.
      const res = await processGame({
        // Non-null is safe: both `enabled` and the buzzer refetch below require a userId.
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
      return { res, sentFinished: f };
    },
    // Grade against the flag that was actually posted, never the current one: a mid-game answer must not
    // be read as a final verdict just because the game ended after it was fetched.
    refetchInterval: (q) => {
      const data = q.state.data;
      if (data && isGraded(data.res, data.sentFinished)) return false;
      return GRADING_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  const data = query.data;
  const graded = data ? isGraded(data.res, data.sentFinished) : false;

  // Keep the queryFn reading the newest stats; declared before the buzzer refetch so it sees them.
  useEffect(() => {
    latest.current = { stats, finished };
  }, [stats, finished]);

  // Re-poll at the buzzer so the backend receives isGameFinished: true and the final stats.
  // refetch() bypasses `enabled`, hence the explicit userId guard.
  const { refetch } = query;
  useEffect(() => {
    if (finished && enabled && userId) void refetch();
  }, [finished, enabled, userId, refetch]);

  useEffect(() => {
    if (!graded) return;
    queryClient.invalidateQueries({ queryKey: ["profile-data"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [graded, queryClient]);

  useEffect(() => {
    if (!graded || !finished || !data) return;
    const completed = data.res.missionsCompleted === true;
    if (completed !== engineWon) {
      console.warn("mission grading: backend and engine disagree", { backend: data.res, engineWon });
    }
  }, [graded, finished, data, engineWon]);

  if (!finished) return undefined;
  if (query.error) return { status: "error", message: "Could not reach mission control." };
  if (!data || !graded) return { status: "grading" };
  const completed = data.res.missionsCompleted === true;
  return completed ? { status: "graded", completed, rewards } : { status: "graded", completed };
}
