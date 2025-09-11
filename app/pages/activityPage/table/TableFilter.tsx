import type { Column } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { useFilterState } from "@/hooks/useFilterState";
import { useEffect } from "react";

type TableFilters<TData> = {
  filterName: string;
  filterOptions: { name: string; value: string }[];
  column: Column<TData, unknown>;
  formId: string;
  table: TanstackTable<TData>;
};

export const TableFilter = <TData,>({
  filterName,
  filterOptions,
  column,
  formId,
}: TableFilters<TData>) => {
  const placeholder = "Alle";

  const selectedValues = (column.getFilterValue() ?? []) as string[];
  const [filters, setFilters] = useFilterState(formId);
  const columnFilters = filters.find((f) => f.id == column.id);

  const selectedNames = columnFilters?.value
    .map((f) => filterOptions.find((opt) => opt.value == f)?.name)
    .filter((f) => f != undefined)
    .join(", ");

  useEffect(() => {
    console.log("NAME:", filterName);
    console.log("\tselected", selectedNames);
    console.log(
      "\tfilters",
      filters.filter((f) => f.id == column.id),
    );
    console.log("\toptions", filterOptions);
  }, [column.id, filterName, filterOptions, filters, selectedNames]);

  useEffect(() => {
    console.log("NAME:", filterName);
    console.log("\tselected", selectedNames);
    console.log(
      "\tfilters",
      filters.filter((f) => f.id == column.id),
    );
    console.log("\toptions", filterOptions);
  }, [column.id, filterName, filterOptions, filters, selectedNames]);

  return (
    <div className="flex flex-col gap-1 uppercase text-xs">
      <p className="font-semibold text-foreground/80">{filterName}</p>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div
            role="button"
            className="flex items-center justify-between w-[210px] rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span
              className={cn(
                "truncate text-left",
                selectedNames === "" && "text-muted-foreground",
              )}
            >
              {selectedNames !== "" ? selectedNames : placeholder}
            </span>
            <ChevronDown className="ml-2 size-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[210px] max-w-[210px]">
          {filterOptions.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                onCheckedChange={(checked) =>
                  setFilters((current) => {
                    console.log("setting", current, option.value);
                    if (checked) {
                      return [
                        ...current.filter((f) => f.id != column.id),
                        {
                          id: column.id,
                          value: [
                            ...(columnFilters?.value || []),
                            option.value,
                          ],
                        },
                      ];
                    } else {
                      return current.map((it) => {
                        if (it.id == column.id) {
                          return {
                            id: it.id,
                            value: (it.value as string[]).filter(
                              (v) => v != option.value,
                            ),
                          };
                        } else return it;
                      });
                    }
                  })
                }
                className="cursor-pointer"
              >
                {option.name}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
