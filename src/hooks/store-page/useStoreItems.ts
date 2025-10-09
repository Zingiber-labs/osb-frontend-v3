import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";

export const useStoreItems = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["store-items"],
    queryFn: async () => {
      const { data } = await api.get("/items");
      return data;
    },
    enabled: isAuthenticated && !authLoading, // Only run query when authenticated
  });
};
