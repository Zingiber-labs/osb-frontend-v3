import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export const useEventsForRewards = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get(`/events`);
      return data;
    },
  });
};
