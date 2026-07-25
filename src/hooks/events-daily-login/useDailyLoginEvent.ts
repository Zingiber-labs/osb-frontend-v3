import { api } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useEventsForDailyLogin = () => {
  return useQuery({
    queryKey: ["events", "daily-login"],
    queryFn: async () => {
      const { data } = await api.get(`/events/daily-login`);
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
    onSuccess: (data) => {
      if (data?.balances) {
        queryClient.setQueryData(["profile-data"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            balance: {
              ...(old.balance || {}),
              ...data.balances,
            },
            hasUnclaimedDailyReward: false,
          };
        });
      }

      if (data?.event) {
        queryClient.setQueryData(["events", "daily-login"], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((e: any) => e.id === data.event.id ? data.event : e);
        });
        
        queryClient.setQueryData(["events"], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((e: any) => e.id === data.event.id ? data.event : e);
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to claim the reward. Please try again.",
      );
    },
  });
};
