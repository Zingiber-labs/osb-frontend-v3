import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { ItemType } from "@/types/inventory-items";

export const useStoreItems = ({ type }: { type?: ItemType } = {}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["store-items", { type }],
    queryFn: async () => {
      const { data } = await api.get("/items", {
        params: { ...(type ? { type } : {}) },
      });
      return data;
    },
  });
};
