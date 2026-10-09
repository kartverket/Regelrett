import { useQuery } from "@tanstack/react-query";
import { axiosFetch } from "../api/Fetch";
import type { Column } from "../api/types";

const API_URL_BASE = "/api";

export function useFetchColumns(formId: string) {
  return useQuery({
    queryKey: ["columns", formId],
    queryFn: () =>
      axiosFetch<Column[]>({
        url: formId ? `${API_URL_BASE}/forms/${formId}/columns` : undefined,
      }).then((response) => response.data),
  });
}
