import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export const useSpin = (leagueSlug: string) => {

  return useMutation({
    mutationFn: async (payload: { username: string }) => {
      return await api.post(`/leagues/${leagueSlug}/draft/spin`, payload);
    },
  });
};
