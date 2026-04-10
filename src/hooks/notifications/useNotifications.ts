import { api } from "@/lib/axios";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UnreadCountResponse, NotificationPaginatedResponse } from "@/types/notifications";
import { useSession } from "next-auth/react";

export const useUnreadCount = () => {
  const { status } = useSession();
  
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data;
    },
    enabled: status === "authenticated",
    refetchInterval: 60000, // refresh every minute
  });
};

export const useInfiniteNotifications = (unreadOnly: boolean = false) => {
  const { status } = useSession();
  return useInfiniteQuery<NotificationPaginatedResponse>({
    queryKey: ["notifications", "list", { unreadOnly }],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(`/notifications`, {
        params: {
          page: pageParam,
          limit: 20,
          ...(unreadOnly ? { unreadOnly } : {}),
        },
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentLoadedCount = allPages.reduce((acc, page) => acc + page.rows.length, 0);
      if (currentLoadedCount < lastPage.total) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: status === "authenticated",
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/notifications/read-all`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
