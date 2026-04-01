import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { AxiosError } from "axios";

export const useJoinEvent = () => {
  return useMutation({
    mutationFn: async ({ idEvent }: { idEvent: string }) => {
      return await api.post(`/events/${idEvent}/accept`);
    },
    onError: (error) => {
      const axiosError = error as AxiosError<any>;
      const message =
        axiosError.response?.data?.message ||
        "Failed to join the event. Please try again.";

      toast.error(message);
    },
  });
};
