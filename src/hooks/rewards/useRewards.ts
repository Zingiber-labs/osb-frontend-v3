import { api } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  return useMutation({
    mutationFn: async (payload: ClaimRewardPayload) => {
      const { data } = await api.post(`/events/claim`, payload);
      return data;
    },
  });
};
