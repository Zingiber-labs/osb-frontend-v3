import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const usePlayers = () => {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data } = await api.get("/games/players/today");
      return data;
    },
  });
};
