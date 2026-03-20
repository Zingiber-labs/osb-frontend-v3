import { api } from "@/lib/axios";
import { LockerSeason } from "@/types/locker-room";
import { useQuery } from "@tanstack/react-query";

export const useLockerRoomProgress = () => {
  return useQuery<LockerSeason[]>({
    queryKey: ["locker-room", "my-progress"],
    queryFn: async () => {
      const { data } = await api.get("/locker-room/my-progress");
      return data;
    },
    staleTime: 60_000,
  });
};

export const useSeasonProgress = (seasonId: string) => {
  return useQuery<LockerSeason>({
    queryKey: ["locker-room", "season", seasonId],
    queryFn: async () => {
      const { data } = await api.get(`/locker-room/seasons/${seasonId}/progress`);
      return data;
    },
    enabled: !!seasonId,
  });
};
