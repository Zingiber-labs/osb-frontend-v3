import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { ItemType } from "@/types/inventory-items";

export const useStoreItems = ({ type }: { type?: ItemType } = {}) => {

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
