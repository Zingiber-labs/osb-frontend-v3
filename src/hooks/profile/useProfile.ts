import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useProfileStats = () => {
  return useQuery({
    queryKey: ["profile-stats"],
    queryFn: async () => {
      const { data } = await api.get("auth/users/stats");
      return data;
    },
  });
};
