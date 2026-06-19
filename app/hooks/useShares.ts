import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosFetch } from "@/api/Fetch";
import { toast } from "sonner";

const API_URL_BASE = "/api";

export type SharedContext = {
  id: string;
  contextId: string;
  userId: string;
  created: Date;
  expiresAt?: Date | null;
};


type SubmitShareRequest = {
  userId: string;
  expiresAt?: string;
  justification: string;
  sharedBy: string;
};

function formatShareData(shares: SharedContext[]) {
  return shares.map((share) => ({
    ...share,
    created: new Date(share.created),
    expiresAt: share.expiresAt ? new Date(share.expiresAt) : null,
  }));
}

export function useShares(contextId: string){
  const queryClient = useQueryClient();

  const shares = useQuery({
    queryKey: ["Shares", contextId],
    queryFn: () =>
      axiosFetch<SharedContext[]>({
        url: `${API_URL_BASE}/contexts/${contextId}/shares`,
      }).then((response) => response.data),
    select: formatShareData,
  });

  const shareContext = useMutation({
    mutationFn: (body: SubmitShareRequest) => {
      return axiosFetch<SharedContext>({
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

export function useSharedContextsByUser(userId: string){
  return useQuery({
    queryKey: ["sharedContexts", userId],
    queryFn: () =>
      axiosFetch<SharedContext[]>({
        url: `${API_URL_BASE}/contexts/sharedWith?userId=${userId}`,
      }).then((response) => response.data),
    select: formatShareData,
  });
}