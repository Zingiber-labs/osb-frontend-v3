import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    queryKey: ["missions"],
    queryFn: async () => {
      const { data } = await api.get(`/missions/available/${userId}`);
      return data;
    },
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
  payload: MissionProcess,
  options?: {
    enabled?: boolean;
    refetchIntervalMs?: number;
    stopWhen?: (data: any) => boolean;
  }
) => {
  const enabled = options?.enabled ?? false;
  const refetchIntervalMs = options?.refetchIntervalMs ?? 5000;

  return useQuery({
    queryKey: ["mission-process", payload?.userId],
    enabled,
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
};
