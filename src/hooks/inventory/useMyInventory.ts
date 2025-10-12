import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { ItemType } from "@/types/inventory-items";

export const useMyInventory = ({ type }: { type?: ItemType } = {}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["inventory-items", { type }],
    queryFn: async () => {
      const { data } = await api.get("/inventory", {
        params: { ...(type ? { type } : {}) },
      });
      return data;
    },
    enabled: isAuthenticated && !authLoading, // Only run query when authenticated
  });
};
