import { useQuery } from "@tanstack/react-query";
import { axiosFetch } from "../api/Fetch";
import type { Form } from "../api/types";

const API_URL_BASE = "/api";

export function useForm(formId?: string) {
  return useQuery({
    queryKey: ["forms", formId],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    notifyOnChangeProps: ["data", "error"],
    queryFn: () =>
      axiosFetch<Form>({
        url: formId ? `${API_URL_BASE}/forms/${formId}` : undefined,
      }).then((response) => response.data),
    select: formatFormData,
    enabled: !!formId,
  });
}

function formatFormData(data: Form) {
  return {
    ...data,
    records: data.records.map((record) => {
      return {
        ...record,
        updated: record.updated ? new Date(record.updated) : undefined,
      };
    }),
  };
}
