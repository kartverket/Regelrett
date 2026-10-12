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

function formatReadGrantData(readGrants: ReadGrant[]) {
  return readGrants.map((readGrant) => ({
    ...readGrant,
    created: new Date(readGrant.created),
    expiresAt: readGrant.expiresAt ? new Date(readGrant.expiresAt) : null,
  }));
}

export function useGrants(contextId: string){
  const queryClient = useQueryClient();

  const readGrants = useQuery({
    queryKey: ["ReadGrants", contextId],
    queryFn: () =>
      axiosFetch<ReadGrant[]>({
        url: `${API_URL_BASE}/readGrants/${contextId}`,
      }).then((response) => response.data),
    select: formatReadGrantData,
  });

  const grantReadAccess = useMutation({
    mutationFn: (body: SubmitReadGrantRequest) => {
      return axiosFetch<ReadGrant>({
        url: `${API_URL_BASE}/readGrants/${contextId}`,
        method: "POST",
        data: body,
      });
    },
    onSuccess: async () => {
      const toastId = "submit-readGrant-success";
      toast.success("Suksess", {
        description: `Skjemautfyllingen ble delt`,
        duration: 5000,
        id: toastId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["ReadGrants", contextId],
      });
    },
  });

  const revokeReadGrant = useMutation({
    mutationFn: (readGrantId: string) => {
      return axiosFetch({
        url: `${API_URL_BASE}/readGrants/${contextId}/${readGrantId}/expiry`,
        method: "PATCH",
      });
    },
    onSuccess: async () => {
      const toastId = "patch-readGrant-success";
      toast.success("Suksess", {
        description: `Lesetilgangen ble slettet`,
        duration: 5000,
        id: toastId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["ReadGrants", contextId],
      });
    },
  });

  return {
    readGrants,
    grantReadAccess,
    revokeReadGrant,
  }

}

export function useReadGrantsByUser(userId: string){
  return useQuery({
    queryKey: ["UsersGrantedReadAccesses", userId],
    queryFn: () =>
      axiosFetch<ReadGrant[]>({
        url: `${API_URL_BASE}/readGrants?userId=${userId}`,
      }).then((response) => response.data),
    select: formatReadGrantData,
  });
}