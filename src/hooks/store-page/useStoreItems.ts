import { api } from "@/lib/api/client";
import { ItemType } from "@/types/inventory-items";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useStoreItems = ({ type }: { type?: ItemType } = {}) => {
  return useQuery({
    queryKey: ["store-items", { type }],
    queryFn: async () => {
      const { data } = await api.get("/store/items", {
        params: { ...(type ? { type } : {}) },
      });
      return data;
    },
  });
};

export const useBuyStoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { itemId: string; quantity: number }) => {
      return await api.post("/store/purchase", payload);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-data"] }),
      ]),
  });
};
