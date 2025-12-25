import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useGameTeam = (teamId: string) => {
  return useQuery({
    queryKey: ["gameplay", teamId],
    enabled: Boolean(teamId),
    queryFn: async () => {
      const { data } = await api.get(`/games/team`, {
        params: { teamId }
      });
      return data;
    },
  });
};
