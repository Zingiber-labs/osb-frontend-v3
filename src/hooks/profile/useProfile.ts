import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

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
  const { status } = useSession();

  return useQuery({
    queryKey: ["profile-data"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
    enabled: status === "authenticated",
    refetchOnWindowFocus: true,
  });
};