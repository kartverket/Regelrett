import { FILLMODE_COLUMN_IDXS } from "../utils/fillmodeColumns";
import { useLocalstorageState } from "./useStorageState";

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useLocalstorageState<
    Record<string, boolean>
  >("columnVisibility", {});

  const unHideColumn = (name: string) => {
    setColumnVisibility((prev: Record<string, boolean>) => ({
      ...prev,
      [name]: true,
    }));
  };

  const hideColumn = (name: string) => {
    setColumnVisibility((prev: Record<string, boolean>) => ({
      ...prev,
      [name]: false,
    }));
  };

  const unHideColumns = (names: string[]) => {
    names.forEach((name) => {
      unHideColumn(name);
    });
  };

  const showOnlyFillModeColumns = (names: string[]) => {
    names.forEach((name, idx) => {
      if (!FILLMODE_COLUMN_IDXS.includes(idx)) {
        hideColumn(name);
      }
    });
  };

  const getShownColumns = (
    record: Record<string, boolean>,
    keysToCheck: string[],
  ): string[] => keysToCheck.filter((key) => record[key] || !(key in record));

  return [
    columnVisibility,
    setColumnVisibility,
    unHideColumn,
    unHideColumns,
    showOnlyFillModeColumns,
    getShownColumns,
  ] as const;
}
