import type { Column } from "../../../api/types";
import { TableFilter } from "./TableFilter";
import { useStoredRedirect } from "../../../hooks/useStoredRedirect";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { FunnelX, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router";

interface Props<TData> {
  tableMetadata: Column[];
  filterByAnswer: boolean;
  table: TanstackTable<TData>;
  formId: string;
  answerColumnName: string;
}

export const TableActions = <TData,>({
  tableMetadata,
  filterByAnswer,
  table,
  formId,
  answerColumnName,
}: Props<TData>) => {
  const storedRedirect = useStoredRedirect();
  const [_, setSearchParams] = useSearchParams();

  const statusFilterKolonne = table.getColumn("Status");
  const anyFiltersActive = table
    .getAllColumns()
    .some((col) => col.getFilterValue() != null);

  const resetAllFilters = () => {
    table.setColumnFilters([]);
    localStorage.removeItem(`filters_${formId}`);
    table.setPageIndex(0);
    setSearchParams(
      (current) => {
        const newParams = new URLSearchParams(current);
        newParams.delete("filter");
        newParams.delete("page");
        return newParams;
      },
      { replace: true },
    );
  };

  return (
    <div
      className={`sticky bg-background w-full ${storedRedirect ? "top-10" : "top-0"} z-20  px-10 py-5 flex flex-col gap-2 `}
    >
      <div className="flex items-center gap-2 text-foreground/80">
        <ListFilter className="size-5" />
        <h4 className="text-sm font-normal">FILTER</h4>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {statusFilterKolonne && (
          <TableFilter
            filterOptions={[
              { name: "Utfylt", value: "utfylt" },
              { name: "Ikke utfylt", value: "ikke utfylt" },
              { name: "Utgått", value: "utgaatt" },
            ]}
            filterName="Status"
            column={statusFilterKolonne}
            formId={formId}
            table={table}
          />
        )}

        {tableMetadata
          .filter(({ name }) => filterByAnswer || name !== answerColumnName)
          .map((metaColumn) => {
            const column = table.getColumn(metaColumn.name);
            if (!column || !metaColumn.options) return null;
            return (
              <TableFilter
                key={metaColumn.name}
                filterName={metaColumn.name}
                filterOptions={metaColumn.options.map((option) => {
                  return { name: option.name, value: option.name };
                })}
                column={column}
                formId={formId}
                table={table}
              />
            );
          })}
      </div>
      {anyFiltersActive && (
        <Button
          variant="link"
          className="flex flex-row w-fit has-[>svg]:px-0"
          onClick={() => resetAllFilters()}
        >
          <FunnelX className="size-5  self-center" />
          Fjern alle filtre
        </Button>
      )}
    </div>
  );
};
