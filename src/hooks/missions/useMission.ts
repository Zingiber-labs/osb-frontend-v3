import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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