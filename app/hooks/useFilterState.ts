import { useSearchParams } from "react-router";

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterSearchParams = searchParams.getAll("filter");
}

function urlFilterParamsToColumnFilterState(params: string[]) {
  const grouped: Record<string, string[]> = {};

  for (const param of params) {
    const [id, ...rest] = param.split("_");
    const value = rest.join("_");
    grouped[id] = [...(grouped[id] ?? []), value];
  }

  return Object.entries(grouped).map(([id, value]) => ({ id, value }));
}
