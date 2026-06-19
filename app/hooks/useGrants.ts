import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosFetch } from "@/api/Fetch";
import { toast } from "sonner";

const API_URL_BASE = "/api";

export type ReadGrant = {
  id: string;
  contextId: string;
  userId: string;
  created: Date;
  expiresAt: Date;
};


type SubmitReadGrantRequest = {
  userId: string;
  expiresAt: string;
  justification: string;
  sharedBy: string;
};

function formatReadGrantData(shares: ReadGrant[]) {
  return shares.map((share) => ({
    ...share,
    created: new Date(share.created),
    expiresAt: share.expiresAt ? new Date(share.expiresAt) : null,
  }));
}

export function useGrants(contextId: string){
  const queryClient = useQueryClient();

  const shares = useQuery({
    queryKey: ["Shares", contextId],
    queryFn: () =>
      axiosFetch<ReadGrant[]>({
        url: `${API_URL_BASE}/contexts/${contextId}/readGrants`,
      }).then((response) => response.data),
    select: formatReadGrantData,
  });

  const shareContext = useMutation({
    mutationFn: (body: SubmitReadGrantRequest) => {
      return axiosFetch<ReadGrant>({
        url: `${API_URL_BASE}/contexts/${contextId}/grantReadAccess`,
        method: "POST",
        data: body,
      });
    },
    onSuccess: async () => {
      const toastId = "submit-share-success";
      toast.success("Suksess", {
        description: `Skjemautfyllingen ble delt`,
        duration: 5000,
        id: toastId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["Shares", contextId],
      });
    },
  });

  return {
    readGrants: shares,
    grantReadAccess: shareContext
  }

}

export function useReadGrantsByUser(userId: string){
  return useQuery({
    queryKey: ["sharedContexts", userId],
    queryFn: () =>
      axiosFetch<ReadGrant[]>({
        url: `${API_URL_BASE}/contexts/usersReadGrants?userId=${userId}`,
      }).then((response) => response.data),
    select: formatReadGrantData,
  });
}