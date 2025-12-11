import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useMissions = ({ userId }: { userId?: string } = {}) => {
  return useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data } = await api.get(`/missions/available/${userId}`);
      return data;
    },
  });
};
