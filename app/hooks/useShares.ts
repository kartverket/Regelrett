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
  contextId: string;
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
        queryKey: ["contexts"],
      });
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        const toastId = "submit-context-conflict";
        toast.warning("Konflikt", {
          description: "Denne brukeren har allerede denne tilgangen.",
          duration: 5000,
          id: toastId,
        });
      } else {
        const toastId = "submit-context-error";
        toast.error("Å nei!", {
          description: "Det har skjedd en feil. Prøv på nytt",
          duration: 5000,
          id: toastId,
        });
      }
    },
  });

  return {
    shares,
    shareContext
  }

}