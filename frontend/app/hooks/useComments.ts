import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "../api/types";
import { axiosFetch } from "../api/Fetch";
import { toast } from "sonner";

const API_URL_BASE = "/api";

function url(contextId: string, recordId?: string) {
  return `${API_URL_BASE}/comments?contextId=${contextId}${recordId ? `&recordId=${recordId}` : ""}`;
}

export function useComments(contextId?: string) {
  return useQuery({
    queryKey: ["comments", contextId],
    queryFn: () =>
      axiosFetch<Comment[]>({
        url: contextId ? url(contextId) : undefined,
      }).then((response) => response.data),
    select: formatCommentData,
    enabled: !!contextId,
  });
}

function formatCommentData(comments: Comment[]) {
  return comments.map((comment: Comment) => {
    return {
      ...comment,
      updated: new Date(comment.updated),
    };
  });
}

export function useFetchCommentsForQuestion(
  contextId?: string,
  recordId?: string,
) {
  return useQuery({
    queryKey: ["comments", contextId, recordId],
    queryFn: () =>
      axiosFetch<Comment[]>({
        url: contextId ? url(contextId, recordId) : undefined,
      }).then((response) => response.data),
    enabled: !!recordId && !!contextId,
  });
}

export function useDeleteComment(
  contextId: string,
  recordId: string | undefined,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return axiosFetch({
        url: url(contextId, recordId),
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments", contextId],
      });
      onSuccess();
    },
    onError: () => {
      const toastId = "delete-comment-error";
      toast.error("Å nei!", {
        description: "Det har skjedd en feil. Prøv på nytt",
        duration: 5000,
        id: toastId,
      });
    },
  });
}

type SubmitCommentsRequest = {
  actor: string;
  recordId: string;
  questionId: string;
  contextId: string;
  comment?: string;
};

export function useSubmitComment(
  contextId: string,
  recordId: string | undefined,
  setEditMode: (editMode: boolean) => void,
) {
  const url = `${API_URL_BASE}/comments`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitCommentsRequest) => {
      return axiosFetch<SubmitCommentsRequest>({
        url: url,
        method: "POST",
        data: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      if (recordId != undefined) {
        await queryClient.invalidateQueries({
          queryKey: ["comments", contextId, recordId],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["comments", contextId],
        });
      }
      setEditMode(false);
    },
    onError: () => {
      const toastId = "submit-comment-error";
      toast.error("Å nei!", {
        description: "Det har skjedd en feil. Prøv på nytt",
        duration: 5000,
        id: toastId,
      });
    },
  });
}
