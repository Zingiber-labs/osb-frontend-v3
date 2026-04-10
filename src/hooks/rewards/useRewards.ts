import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useEventsForDailyLogin = () => {
  return useQuery({
    queryKey: ["events", "daily-login"],
    queryFn: async () => {
      const { data } = await api.get(`/events/daily-login`);
      return data;
    },
  });
};

export const useEventsForRewards = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get(`/events`);
      return data;
    },
  });
};

type ClaimRewardPayload = {
  eventId: string;
  step: number;
};

export const useClaimReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClaimRewardPayload) => {
      const { data } = await api.post(`/events/claim`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-data"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
