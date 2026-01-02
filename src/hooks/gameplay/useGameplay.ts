import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useGameTeam = (gameId: string, playerId?: string) => {
  return useQuery({
    queryKey: ["gameplay", gameId, playerId],
    enabled: Boolean(gameId) && Boolean(playerId),
    queryFn: async () => {
      const { data } = await api.get(`/games/team`, {
        params: { gameId, playerId },
      });
      return data;
    },
  });
};
