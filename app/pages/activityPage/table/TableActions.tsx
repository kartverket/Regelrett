import type { Column } from "../../../api/types";
import { TableFilter } from "./TableFilter";
import { useStoredRedirect } from "../../../hooks/useStoredRedirect";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { FunnelX, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilterState } from "@/hooks/useFilterState";

interface Props<TData> {
  columnMetadata: Column[];
  filterByAnswer: boolean;
  table: TanstackTable<TData>;
  formId: string;
}

export const TableActions = <TData,>({
  columnMetadata,
  filterByAnswer,
  table,
  formId,
}: Props<TData>) => {
  const storedRedirect = useStoredRedirect();
  const [filters, setFilters] = useFilterState(formId);

  const statusFilterKolonne = table.getColumn("Status");
  const anyFiltersActive = filters.length > 0;

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
            ]}
            filterName="Status"
            column={statusFilterKolonne}
            formId={formId}
            table={table}
          />
        )}

        {columnMetadata
          .filter(({ name }) => filterByAnswer || name !== "Svar")
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
          onClick={() => setFilters([])}
        >
          <FunnelX className="size-5  self-center" />
          Fjern alle filtre
        </Button>
      )}
    </div>
  );
};
