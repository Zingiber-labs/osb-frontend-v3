import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export interface MissionProcess {
  userId: string;
  points: number;
  idPlayer: string;
  idGame: string;
  blocks: number;
  rebounds: number;
}

export const useMissions = ({ userId }: { userId?: string } = {}) => {
  return useQuery({
    queryKey: ["missions", userId],
    queryFn: async () => {
      const { data } = await api.get(`/missions/available/${userId}`);
      return data;
    },
    enabled: Boolean(userId),
  });
};

export const useAcceptMission = ({ userId }: { userId?: string }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missionId: string) => {
      return await api.post(`/missions/${missionId}/assign/${userId}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
};

export const useMissionProcess = (
  payload?: MissionProcess,
  options?: {
    enabled?: boolean;
    refetchIntervalMs?: number;
    stopWhen?: (data: any) => boolean;
  },
) => {
  const queryClient = useQueryClient();
  const refetchIntervalMs = options?.refetchIntervalMs ?? 5000;

  const query = useQuery({
    queryKey: [
      "mission-process",
      payload?.userId,
      payload?.idGame,
      payload?.idPlayer,
    ],
    enabled: Boolean(payload?.userId) && (options?.enabled ?? true),
    queryFn: async () => {
      const { data } = await api.post("/missions/process-game", payload);
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;

      if (options?.stopWhen?.(data)) return false;

      return refetchIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!query.data) return;

    if (options?.stopWhen?.(query.data)) {
      queryClient.invalidateQueries({ queryKey: ["profile-data"] });
    }
  }, [query.data, options, queryClient]);

  return query;
};

export const useRecentMissions = () => {
  return useQuery({
    queryKey: ["recent-missions"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile/missions");
      return data;
    },
  });
};
