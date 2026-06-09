import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosFetch } from "@/api/Fetch";
import { toast } from "sonner";
import type { AxiosError } from "axios";

const API_URL_BASE = "/api";

export type Share = {
  id: string;
  contextId: string;
  userId: string;
  accessLevel: accessLevels;
  created: string;
};

export type accessLevels = "read" | "write";

type SubmitShareRequest = {
  userId: string;
  accessLevel: accessLevels;
};

export function useShares(contextId: string){
  const queryClient = useQueryClient();

  const shares = useQuery({
    queryKey: ["Shares", contextId],
    queryFn: () =>
      axiosFetch<Share[]>({
        url: `${API_URL_BASE}/contexts/${contextId}/shares`,
      }).then((response) => response.data),
  });

  const shareContext = useMutation({
    mutationFn: (body: SubmitShareRequest) => {
      return axiosFetch<Share>({
        url: `${API_URL_BASE}/contexts/${contextId}/share`,
        method: "POST",
        data: body,
      });
    },
    onSuccess: async () => {
      const toastId = "submit-share-success";
      toast.success("Suksess", {
        description: `Konteksten ble delt`,
        duration: 5000,
        id: toastId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["Shares", contextId],
      });
    },
  });

  return {
    shares,
    shareContext
  }

}