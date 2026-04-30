import { api, ApiError } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";


export const useComplexEvents = () => {
  return useQuery({
    queryKey: ["complex-events"],
    queryFn: async () => {
      const { data } = await api.get("/events/complex");
      return data;
    },
  });
}

export const useJoinEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idEvent }: { idEvent: string }) => {
      return await api.post(`/events/complex/${idEvent}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complex-events"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      const apiError = error as ApiError<any>;
      const message =
        apiError.data?.message ||
        "Failed to join the event. Please try again.";

      toast.error(message);
    },
  });
};

export const useAcceptEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idEvent }: { idEvent: string }) => {
      return await api.post(`/events/${idEvent}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complex-events"] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      const apiError = error as ApiError<any>;
      const message =
        apiError.data?.message ||
        "Failed to accept the event. Please try again.";

      toast.error(message);
    },
  });
};

export const useMyEvents = () => {
  return useQuery({
    queryKey: ["my-events"],
    queryFn: async () => {
      const { data } = await api.get("/events/my-events");
      return data;
    },
  });
};
