import { useSearchParams } from "react-router";
import { useLocalstorageState } from "./useStorageState";
import { useEffect } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";

export function useFilterState(formId: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterState, setFilterState] =
    useLocalstorageState<ColumnFiltersState>(`filters_${formId}`, []);

  useEffect(() => {
    console.log("effect", filterState);
    setSearchParams(
      (current) => {
        current.delete("page");
        current.delete("filter");
        filterState.forEach((columnFilter) => {
          current.append("filter", `${columnFilter.id}_${columnFilter.value}`);
        });
        return current;
      },
      { replace: true },
    );
  }, [filterState]);

  const filterSearchParams = searchParams.getAll("filter");
  const urlFilterState = urlFilterParamsToColumnFilterState(filterSearchParams);

  return [urlFilterState, setFilterState] as const;
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
