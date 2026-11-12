import { api } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
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
