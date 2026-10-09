import { useQuery } from "@tanstack/react-query";
import { axiosFetch } from "../api/Fetch";

const API_URL_BASE = "/api";

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    notifyOnChangeProps: ["data", "error"],
    queryFn: () =>
      axiosFetch<{ id: string; name: string }[]>({
        url: `${API_URL_BASE}/forms`,
      }).then((response) => response.data),
  });
}
