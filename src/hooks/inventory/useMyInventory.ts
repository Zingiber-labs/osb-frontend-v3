import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { ItemType } from "@/types/inventory-items";

export const useMyInventory = ({
  type,
  userId,
}: {
  type?: ItemType;
  userId: string;
}) => {

  return useQuery({
    queryKey: ["inventory-items", { type }],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get(`/inventory/user/${userId}`, {
        params: { ...(type ? { type } : {}) },
      });
      return data;
    },
  });
};
