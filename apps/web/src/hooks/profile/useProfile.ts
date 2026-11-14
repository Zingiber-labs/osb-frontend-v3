import { api } from "@/lib/api/client";
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

export const useProfileData = () => {

  return useQuery({
    queryKey: ["profile-data"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
  });
};