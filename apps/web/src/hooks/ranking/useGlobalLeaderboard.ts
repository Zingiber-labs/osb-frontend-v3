import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { LeaderboardResponse } from "@/types/ranking";

export const useGlobalLeaderboard = (page: number = 1, limit: number = 20) => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard-global", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/ranking/leaderboard/global", {
        params: {
          page,
          limit,
        },
      });
      return data;
    },
  });
};
